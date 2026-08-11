// A scripted, local, Anthropic-Messages-API-shaped stand-in for api.anthropic.com.
// Exists so the model proxy can be proven end-to-end without spending real API
// money: it deterministically replays a turn sequence recorded from a real Phase 0
// run (tool_use -> retry tool_use -> honest failure text), so the model-boundary
// trace is checked against a known-true result rather than an invented one. This is
// a test fixture, not a product feature — the proxy forwards to a real upstream by
// default.
import { createServer } from "node:http";

const REFUND_FAILURE_TEXT =
  "I'm experiencing timeout issues when attempting to process the refund for order #4471 for $84.00 (8400 cents). The refund system appears to be experiencing technical difficulties at the moment.\n\nPlease try again later or contact technical support if this issue persists. The refund details are:\n- Order ID: #4471\n- Refund Amount: $84.00";

function toolUseResponse(model: string, callNumber: number) {
  return {
    id: `msg_mock_${callNumber}`,
    type: "message",
    role: "assistant",
    model,
    content: [
      {
        type: "tool_use",
        id: `toolu_mock_${callNumber}`,
        name: "create_refund",
        input: { order_id: "4471", amount_cents: 8400 },
      },
    ],
    stop_reason: "tool_use",
    stop_sequence: null,
    usage: { input_tokens: 900 + callNumber * 400, output_tokens: 70 },
  };
}

function finalTextResponse(model: string) {
  return {
    id: "msg_mock_final",
    type: "message",
    role: "assistant",
    model,
    content: [{ type: "text", text: REFUND_FAILURE_TEXT }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 2205, output_tokens: 99 },
  };
}

function countAssistantTurns(messages: any[]): number {
  return messages.filter((m) => m.role === "assistant").length;
}

function openAiToolCallResponse(model: string, callNumber: number) {
  return {
    id: `chatcmpl_mock_${callNumber}`,
    object: "chat.completion",
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: `call_mock_${callNumber}`,
              type: "function",
              function: {
                name: "create_refund",
                arguments: JSON.stringify({ order_id: "4471", amount_cents: 8400 }),
              },
            },
          ],
        },
        finish_reason: "tool_calls",
      },
    ],
    usage: { prompt_tokens: 900 + callNumber * 400, completion_tokens: 70 },
  };
}

function openAiFinalTextResponse(model: string) {
  return {
    id: "chatcmpl_mock_final",
    object: "chat.completion",
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: REFUND_FAILURE_TEXT },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 2205, completion_tokens: 99 },
  };
}

export function startMockUpstream(port: number): Promise<{ url: string; close(): Promise<void> }> {
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};

    if (req.url?.startsWith("/v1/messages")) {
      const model = body.model ?? "claude-sonnet-4-5-20250929";

      if (body.stream) {
        res.writeHead(200, { "content-type": "text/event-stream" });
        const text = "streaming fidelity check ok";
        const events = [
          { type: "message_start", message: { usage: { input_tokens: 12 } } },
          { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
          { type: "content_block_delta", index: 0, delta: { type: "text_delta", text } },
          { type: "content_block_stop", index: 0 },
          { type: "message_delta", usage: { output_tokens: 5 } },
          { type: "message_stop" },
        ];
        for (const evt of events) {
          res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`);
        }
        res.end();
        return;
      }

      const assistantTurns = countAssistantTurns(body.messages ?? []);
      const payload =
        assistantTurns < 2 ? toolUseResponse(model, assistantTurns + 1) : finalTextResponse(model);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.url?.startsWith("/v1/chat/completions")) {
      const model = body.model ?? "gpt-4o";

      if (body.stream) {
        res.writeHead(200, { "content-type": "text/event-stream" });
        const text = "streaming fidelity check ok";
        const chunks = [
          { choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }] },
          { choices: [{ index: 0, delta: { content: text }, finish_reason: null }] },
          { choices: [{ index: 0, delta: {}, finish_reason: "stop" }] },
          { choices: [], usage: { prompt_tokens: 12, completion_tokens: 5 } },
        ];
        for (const chunk of chunks) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      const assistantTurns = countAssistantTurns(body.messages ?? []);
      const payload =
        assistantTurns < 2 ? openAiToolCallResponse(model, assistantTurns + 1) : openAiFinalTextResponse(model);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ type: "error", error: { type: "not_found", message: "mock upstream: unknown route" } }));
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      const boundPort = typeof address === "object" && address ? address.port : port;
      resolve({
        url: `http://127.0.0.1:${boundPort}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}
