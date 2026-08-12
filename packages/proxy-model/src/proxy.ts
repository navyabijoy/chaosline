// Model boundary: an Anthropic-Messages-API-compatible passthrough. The agent under
// test points ANTHROPIC_BASE_URL at this server instead of api.anthropic.com; every
// byte forwards to the real (or, for local demos, a scripted mock) upstream
// unmodified, while a side channel reconstructs usage, cost, and the agent's final
// output for the trace.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Readable } from "node:stream";
import { TraceWriter } from "@chaosline/core";
import { costUsd, type TokenUsage } from "./pricing.ts";
import { ResponseCache, type CachedResponse } from "./response-cache.ts";

export interface ModelProxyOptions {
  upstream: string;
  budgetUsd: number;
  tracePath?: string;
  port?: number;
  cache?: ResponseCache;
}

export interface ModelProxyHandle {
  url: string;
  close(): Promise<void>;
  getTotalCostUsd(): number;
}

export interface AnthropicContentBlock {
  type: string;
  text?: string;
  [key: string]: unknown;
}

function extractFinalText(content: AnthropicContentBlock[]): string {
  return content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n");
}

// Both providers' wire formats collapse to the same normalized shape
// (AnthropicContentBlock[] + {input_tokens, output_tokens}) before hitting the
// trace, so the rest of the proxy — cost accounting, budget gate, agent_output
// capture — stays provider-agnostic.
type Provider = "anthropic" | "openai";

function detectProvider(url: string): Provider | undefined {
  if (url.startsWith("/v1/messages")) return "anthropic";
  if (url.startsWith("/v1/chat/completions") || url.startsWith("/chat/completions")) return "openai";
  return undefined;
}

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "expect",
  "te",
  "trailer",
  "proxy-connection",
  "proxy-authorization",
]);

const HOP_BY_HOP_RESPONSE_HEADERS = new Set(["connection", "keep-alive", "transfer-encoding", "upgrade"]);

// `new URL(requestPath, upstreamBase)` treats an absolute request path as
// resetting the base's path entirely (URL resolution semantics, not path
// joining) — https://api.openai.com/v1 + /chat/completions silently becomes
// https://api.openai.com/chat/completions, a 404. Join the two path segments
// explicitly instead so an upstream base with its own path prefix (a gateway,
// a versioned API root) survives.
function joinUpstreamUrl(upstream: string, requestUrl: string): URL {
  const base = new URL(upstream);
  const incoming = new URL(requestUrl, "http://placeholder");
  const basePath = base.pathname.endsWith("/") ? base.pathname.slice(0, -1) : base.pathname;
  const joinedPath = basePath === "/" ? incoming.pathname : basePath + incoming.pathname;
  return new URL(joinedPath + incoming.search, base.origin);
}

// OpenAI only emits `usage` on a streaming response if the client opts in via
// `stream_options.include_usage` — off by default, so a real agent's streaming
// calls otherwise account as $0 and the budget cap never engages. Patch it in
// when missing rather than trusting every client to set it.
function forwardBody(provider: Provider | undefined, parsedBody: any, rawBody: Buffer): Buffer | undefined {
  if (provider === "openai" && parsedBody?.stream === true && !parsedBody.stream_options?.include_usage) {
    const patched = { ...parsedBody, stream_options: { ...(parsedBody.stream_options ?? {}), include_usage: true } };
    return Buffer.from(JSON.stringify(patched));
  }
  return rawBody.length ? rawBody : undefined;
}

function openAiToolCallsToBlocks(toolCalls: any[]): AnthropicContentBlock[] {
  return toolCalls.map((tc) => {
    let input: unknown = {};
    try {
      input = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
    } catch {
      input = { _unparsed_arguments: tc.function?.arguments };
    }
    return { type: "tool_use", id: tc.id, name: tc.function?.name, input };
  });
}

function openAiMessageToBlocks(message: { content?: string | null; tool_calls?: any[] }): AnthropicContentBlock[] {
  const blocks: AnthropicContentBlock[] = [];
  if (typeof message.content === "string" && message.content.length > 0) {
    blocks.push({ type: "text", text: message.content });
  }
  if (message.tool_calls?.length) {
    blocks.push(...openAiToolCallsToBlocks(message.tool_calls));
  }
  return blocks;
}

function openAiUsageToUsage(usage: { prompt_tokens?: number; completion_tokens?: number } | undefined): TokenUsage {
  return { input_tokens: usage?.prompt_tokens, output_tokens: usage?.completion_tokens };
}

export async function startModelProxy(opts: ModelProxyOptions): Promise<ModelProxyHandle> {
  const trace = opts.tracePath ? new TraceWriter(opts.tracePath) : undefined;
  let totalCostUsd = 0;

  const server = createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      if (!res.headersSent) {
        res.writeHead(502, { "content-type": "application/json" });
      }
      res.end(JSON.stringify({ type: "error", error: { type: "proxy_error", message: String(err) } }));
    });
  });

  async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const rawBody = Buffer.concat(chunks);

    let parsedBody: any = undefined;
    try {
      parsedBody = rawBody.length ? JSON.parse(rawBody.toString("utf8")) : undefined;
    } catch {
      // Not JSON (e.g. a GET with no body) — forward as an opaque passthrough.
    }

    const model = parsedBody?.model ?? "unknown";
    const provider = parsedBody ? detectProvider(req.url ?? "") : undefined;
    const isModelCall = provider !== undefined;

    // Normalized tools shape (same as trace representation)
    const normalizedTools =
      provider === "openai"
        ? (parsedBody?.tools ?? []).map((t: any) => ({
            name: t.function?.name,
            description: t.function?.description,
            inputSchema: t.function?.parameters,
          }))
        : parsedBody?.tools ?? [];

    if (isModelCall) {
      trace?.write({
        t: Date.now(),
        kind: "model_request",
        messages: parsedBody.messages ?? [],
        tools: normalizedTools,
      });

      if (totalCostUsd >= opts.budgetUsd) {
        trace?.write({
          t: Date.now(),
          kind: "budget_abort",
          cumulativeCostUsd: totalCostUsd,
          budgetUsd: opts.budgetUsd,
          model,
        });
        const budgetMessage = `chaosline: run budget of $${opts.budgetUsd.toFixed(4)} exhausted (spent $${totalCostUsd.toFixed(4)}). Aborting further model calls.`;
        res.writeHead(402, { "content-type": "application/json" });
        res.end(
          provider === "openai"
            ? JSON.stringify({ error: { type: "budget_exceeded", code: "budget_exceeded", message: budgetMessage } })
            : JSON.stringify({ type: "error", error: { type: "budget_exceeded", message: budgetMessage } })
        );
        return;
      }
    }

    const upstreamUrl = joinUpstreamUrl(opts.upstream, req.url ?? "/");
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value) continue;
      // Hop-by-hop headers are connection-specific, not message-specific — RFC 7230
      // §6.1. Forwarding them into undici's fetch either does nothing useful
      // (connection/keep-alive) or makes it hard-reject the request outright
      // (transfer-encoding/upgrade/expect), which surfaces as a fake 502 that
      // looks like a chaos fault instead of a proxy bug.
      if (HOP_BY_HOP_REQUEST_HEADERS.has(key) || key === "host" || key === "content-length") continue;
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }

    // Check cache before fetching (for non-streaming requests only)
    let cachedResponse: CachedResponse | undefined;
    let cacheKey: string | undefined;
    const isRequestStreaming = parsedBody?.stream === true;
    if (isModelCall && provider && opts.cache && !isRequestStreaming) {
      // Only cache non-streaming model calls. Compute cache key from normalized request.
      cacheKey = opts.cache.key(model, provider, parsedBody.messages ?? [], normalizedTools);
      cachedResponse = opts.cache.get(cacheKey);
    }

    if (cachedResponse) {
      // Cache hit: return cached response without calling upstream
      res.writeHead(cachedResponse.status, cachedResponse.headers);
      res.end(cachedResponse.bodyBuf);
      // Record the cache hit in trace with $0 cost
      const wouldBeCost = costUsd(model, cachedResponse.usage);
      recordModelResponse(model, cachedResponse.content, cachedResponse.usage, true, wouldBeCost);
      return;
    }

    // Forward client disconnects upstream — otherwise a client that gives up
    // mid-stream leaves the upstream call running to completion, still burning
    // tokens, with no model_response ever recorded to account for that cost.
    const upstreamAbort = new AbortController();
    req.on("close", () => upstreamAbort.abort());

    let upstreamResp: Response;
    try {
      upstreamResp = await fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: forwardBody(provider, parsedBody, rawBody) as any,
        signal: upstreamAbort.signal,
      });
    } finally {
      req.removeAllListeners("close");
    }

    const isStream = (upstreamResp.headers.get("content-type") ?? "").includes("text/event-stream");
    const resHeaders: Record<string, string | string[]> = {};
    upstreamResp.headers.forEach((value, key) => {
      if (key === "content-length" || key === "content-encoding" || HOP_BY_HOP_RESPONSE_HEADERS.has(key)) return;
      if (key === "set-cookie") return; // handled below via getSetCookie() to preserve multiple values
      resHeaders[key] = value;
    });
    const setCookies = upstreamResp.headers.getSetCookie?.() ?? [];
    if (setCookies.length) resHeaders["set-cookie"] = setCookies;
    res.writeHead(upstreamResp.status, resHeaders);

    if (!isModelCall || !upstreamResp.body) {
      if (upstreamResp.body) {
        await pipeWeb(upstreamResp.body, res);
      } else {
        res.end();
      }
      return;
    }

    if (isStream) {
      const [clientSide, traceSide] = upstreamResp.body.tee();
      const passthrough = pipeWeb(clientSide, res);
      const parsed = provider === "openai" ? parseOpenAiSseForTrace(traceSide) : parseSseForTrace(traceSide, model);
      await passthrough;
      const { content, usage } = await parsed;
      recordModelResponse(model, content, usage);
    } else {
      const bodyChunks: Buffer[] = [];
      for await (const chunk of upstreamResp.body as any) bodyChunks.push(Buffer.from(chunk));
      const bodyBuf = Buffer.concat(bodyChunks);
      res.end(bodyBuf);

      let content: AnthropicContentBlock[] = [];
      let usage: TokenUsage = {};
      try {
        const json = JSON.parse(bodyBuf.toString("utf8"));
        if (provider === "openai") {
          const message = json.choices?.[0]?.message;
          if (message) {
            content = openAiMessageToBlocks(message);
            usage = openAiUsageToUsage(json.usage);
          }
        } else if (json.content) {
          content = json.content;
          usage = json.usage ?? {};
        }
      } catch {
        // Upstream returned a non-JSON or error body — nothing to cache or record.
      }

      recordModelResponse(model, content, usage);

      // Cache non-streaming response for future trials (response wasn't streaming, so we cached the key)
      if (cacheKey && content.length > 0 && upstreamResp.status === 200) {
        const cached: CachedResponse = {
          status: upstreamResp.status,
          headers: resHeaders,
          bodyBuf,
          content,
          usage,
        };
        opts.cache?.set(cacheKey, cached);
      }
    }
  }

  function recordModelResponse(
    model: string,
    content: AnthropicContentBlock[],
    usage: TokenUsage,
    cached?: boolean,
    wouldBeCost?: number
  ): void {
    const cost = cached ? 0 : costUsd(model, usage);
    totalCostUsd += cost;
    trace?.write({
      t: Date.now(),
      kind: "model_response",
      content,
      usage: { ...usage, cost_usd: cost },
      ...(cached && { cached: true, wouldBeCostUsd: wouldBeCost }),
    });

    const toolUse = content.some((b) => b.type === "tool_use");
    if (!toolUse) {
      const text = extractFinalText(content);
      if (text) {
        trace?.write({ t: Date.now(), kind: "agent_output", text });
      }
    }
  }

  await new Promise<void>((resolve) => server.listen(opts.port ?? 0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("model proxy failed to bind");
  const url = `http://127.0.0.1:${address.port}`;

  return {
    url,
    getTotalCostUsd: () => totalCostUsd,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

async function pipeWeb(webStream: ReadableStream<Uint8Array>, res: ServerResponse): Promise<void> {
  const node = Readable.fromWeb(webStream as any);
  await new Promise<void>((resolve, reject) => {
    node.pipe(res);
    node.on("end", resolve);
    node.on("error", reject);
  });
}

// SSE reconstruction for streaming Anthropic responses: accumulates content_block
// deltas and the message-level usage so the trace gets the same shape it would from
// a non-streaming call, without altering a single byte forwarded to the client.
async function parseSseForTrace(
  webStream: ReadableStream<Uint8Array>,
  _model: string
): Promise<{ content: AnthropicContentBlock[]; usage: TokenUsage }> {
  const blocks: AnthropicContentBlock[] = [];
  const usage: TokenUsage = {};
  let buffer = "";

  const applyLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    let evt: any;
    try {
      evt = JSON.parse(payload);
    } catch {
      return;
    }
    applySseEvent(evt, blocks, usage);
  };

  const reader = webStream.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) applyLine(line);
  }
  // A stream that ends without a trailing newline (a truncated or aborted
  // response) leaves its last event sitting in `buffer` — often the
  // message_delta carrying output-token usage. Flush it rather than silently
  // dropping the run's cost accounting.
  if (buffer) applyLine(buffer);

  return { content: finalizeAnthropicBlocks(blocks), usage };
}

// content_block_start/delta fire for every block type, but text accumulation and
// tool-call JSON accumulation are mutually exclusive per block — a tool_use block
// never gets `text_delta` events and a text block never gets `input_json_delta`.
function applySseEvent(evt: any, blocks: AnthropicContentBlock[], usage: TokenUsage): void {
  switch (evt.type) {
    case "message_start":
      if (evt.message?.usage?.input_tokens != null) usage.input_tokens = evt.message.usage.input_tokens;
      if (evt.message?.usage?.cache_creation_input_tokens != null) {
        usage.cache_creation_input_tokens = evt.message.usage.cache_creation_input_tokens;
      }
      if (evt.message?.usage?.cache_read_input_tokens != null) {
        usage.cache_read_input_tokens = evt.message.usage.cache_read_input_tokens;
      }
      break;
    case "content_block_start":
      blocks[evt.index] = { ...evt.content_block };
      break;
    case "content_block_delta": {
      if (!blocks[evt.index]) blocks[evt.index] = { type: "text" };
      const block = blocks[evt.index];
      if (evt.delta?.type === "text_delta") {
        block.text = (block.text ?? "") + evt.delta.text;
      } else if (evt.delta?.type === "input_json_delta") {
        block.partial_json = (block.partial_json ?? "") + evt.delta.partial_json;
      } else if (evt.delta?.type === "thinking_delta") {
        block.thinking = (block.thinking ?? "") + evt.delta.thinking;
      } else if (evt.delta?.type === "signature_delta") {
        block.signature = (block.signature ?? "") + evt.delta.signature;
      }
      break;
    }
    case "message_delta":
      if (evt.usage?.output_tokens != null) usage.output_tokens = evt.usage.output_tokens;
      break;
    default:
      break;
  }
}

// `blocks` is written by index and can have holes if a real upstream ever skips
// one (shouldn't happen, but JSON.stringify turns array holes into `null` if it
// does) — compact it. Also resolves each tool_use block's dribbled-in
// `input_json_delta` fragments into the same `input` field a non-streaming
// response would have, so a grader reading `.input` sees the same shape either way.
function finalizeAnthropicBlocks(blocks: AnthropicContentBlock[]): AnthropicContentBlock[] {
  const compact = blocks.filter((b): b is AnthropicContentBlock => b != null);
  for (const b of compact) {
    if (b.type === "tool_use" && typeof b.partial_json === "string") {
      try {
        b.input = b.partial_json ? JSON.parse(b.partial_json) : {};
      } catch {
        b.input = { _unparsed_arguments: b.partial_json };
      }
      delete b.partial_json;
    }
  }
  return compact;
}

// SSE reconstruction for streaming OpenAI chat.completion.chunk responses. Text
// arrives as delta.content fragments; tool calls arrive index-keyed and split
// across chunks (id/name in the first chunk, arguments dribbled in afterward), so
// both accumulate into the same block array by index. Usage is only present if the
// client requested `stream_options: { include_usage: true }` — it lands on a final
// chunk with an empty choices array, per the OpenAI streaming spec.
async function parseOpenAiSseForTrace(
  webStream: ReadableStream<Uint8Array>
): Promise<{ content: AnthropicContentBlock[]; usage: TokenUsage }> {
  const textBlock: AnthropicContentBlock = { type: "text", text: "" };
  const toolCallBlocks = new Map<number, { id?: string; name?: string; argsJson: string }>();
  const usage: TokenUsage = {};
  let sawText = false;

  const applyLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    let evt: any;
    try {
      evt = JSON.parse(payload);
    } catch {
      return;
    }
    if (evt.usage?.prompt_tokens != null) usage.input_tokens = evt.usage.prompt_tokens;
    if (evt.usage?.completion_tokens != null) usage.output_tokens = evt.usage.completion_tokens;

    const delta = evt.choices?.[0]?.delta;
    if (!delta) return;
    if (typeof delta.content === "string" && delta.content.length > 0) {
      sawText = true;
      textBlock.text = (textBlock.text ?? "") + delta.content;
    }
    for (const tc of delta.tool_calls ?? []) {
      const existing = toolCallBlocks.get(tc.index) ?? { argsJson: "" };
      if (tc.id) existing.id = tc.id;
      if (tc.function?.name) existing.name = tc.function.name;
      if (tc.function?.arguments) existing.argsJson += tc.function.arguments;
      toolCallBlocks.set(tc.index, existing);
    }
  };

  let buffer = "";
  const reader = webStream.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) applyLine(line);
  }
  if (buffer) applyLine(buffer);

  const blocks: AnthropicContentBlock[] = [];
  if (sawText) blocks.push(textBlock);
  for (const [, tc] of [...toolCallBlocks].sort(([a], [b]) => a - b)) {
    let input: unknown = {};
    try {
      input = tc.argsJson ? JSON.parse(tc.argsJson) : {};
    } catch {
      input = { _unparsed_arguments: tc.argsJson };
    }
    blocks.push({ type: "tool_use", id: tc.id, name: tc.name, input });
  }
  return { content: blocks, usage };
}
