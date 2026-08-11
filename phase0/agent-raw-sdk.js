// Phase 0 throwaway. Agent (a): raw Anthropic SDK tool loop, zero framework retry logic.
// Tests whether the MODEL retries a hung tool call unprompted.
import { config as loadEnv } from "dotenv";
loadEnv({ path: new URL("../.env", import.meta.url).pathname });
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const HARD_TIMEOUT_MS = 120_000;
const MAX_TURNS = 8;
const PER_CALL_TIMEOUT_MS = 20_000; // how long the agent waits on one tool call before giving up on it

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const transport = new StdioClientTransport({
  command: "node",
  args: ["payments-server.js"],
  env: { ...process.env, CHAOS: process.env.CHAOS || "" },
  stderr: "inherit",
});

const client = new Client({ name: "phase0-raw-agent", version: "0.0.1" });
await client.connect(transport);

const { tools: mcpTools } = await client.listTools();
const anthropicTools = mcpTools.map((t) => ({
  name: t.name,
  description: t.description || "",
  input_schema: t.inputSchema,
}));

let totalInputTokens = 0;
let totalOutputTokens = 0;
let toolCallCount = 0;
const toolCallLog = [];

async function runWithTimeout(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

const messages = [
  {
    role: "user",
    content: "Refund order #4471 to the customer. The amount is $84.00.",
  },
];

const start = Date.now();
let finalText = "";
let turn = 0;

try {
  await runWithTimeout(
    (async () => {
      while (turn < MAX_TURNS) {
        turn++;
        console.error(`\n--- turn ${turn} ---`);
        const resp = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1024,
          tools: anthropicTools,
          messages,
        });

        totalInputTokens += resp.usage.input_tokens;
        totalOutputTokens += resp.usage.output_tokens;

        messages.push({ role: "assistant", content: resp.content });

        const toolUses = resp.content.filter((b) => b.type === "tool_use");
        const textBlocks = resp.content.filter((b) => b.type === "text");
        if (textBlocks.length) finalText = textBlocks.map((b) => b.text).join("\n");

        if (toolUses.length === 0) {
          console.error("[agent] no tool use, stopping.");
          break;
        }

        const toolResults = [];
        for (const tu of toolUses) {
          toolCallCount++;
          console.error(`[agent] calling tool ${tu.name} with ${JSON.stringify(tu.input)} (call #${toolCallCount})`);
          toolCallLog.push({ turn, tool: tu.name, input: tu.input });
          let resultContent;
          try {
            const result = await runWithTimeout(
              client.callTool({ name: tu.name, arguments: tu.input }),
              PER_CALL_TIMEOUT_MS,
              `tool call ${tu.name}`
            );
            resultContent = JSON.stringify(result.content);
            console.error(`[agent] tool ${tu.name} returned: ${resultContent}`);
          } catch (err) {
            resultContent = `ERROR: ${err.message}`;
            console.error(`[agent] tool ${tu.name} FAILED: ${err.message}`);
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: resultContent,
          });
        }
        messages.push({ role: "user", content: toolResults });
      }
    })(),
    HARD_TIMEOUT_MS,
    "agent run"
  );
} catch (err) {
  console.error(`[agent] HARD STOP: ${err.message}`);
  finalText = finalText || `(agent hit hard timeout/turn cap: ${err.message})`;
}

const elapsedMs = Date.now() - start;

// Pricing for claude-sonnet-4-5: $3/MTok in, $15/MTok out (as of doc date; approximate)
const usd = (totalInputTokens / 1_000_000) * 3 + (totalOutputTokens / 1_000_000) * 15;

console.error("\n=== AGENT (a) raw-anthropic-sdk SUMMARY ===");
console.error(`turns: ${turn}, tool calls: ${toolCallCount}, elapsed_ms: ${elapsedMs}`);
console.error(`tokens in=${totalInputTokens} out=${totalOutputTokens} approx_usd=${usd.toFixed(4)}`);
console.error(`final message: ${finalText}`);

console.log(
  JSON.stringify(
    {
      agent: "raw-anthropic-sdk",
      turns: turn,
      tool_call_count: toolCallCount,
      tool_call_log: toolCallLog,
      elapsed_ms: elapsedMs,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      approx_usd: usd,
      final_message: finalText,
    },
    null,
    2
  )
);

await client.close();
process.exit(0);
