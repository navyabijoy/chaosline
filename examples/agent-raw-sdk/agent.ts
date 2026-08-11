// "Agent under test" for the chaosline demo. Adapted from phase0/agent-raw-sdk.js:
// a raw Anthropic SDK tool loop with zero framework-level retry logic, so any retry
// behavior observed comes from the model, not from an SDK default. The only change
// from phase0 is that the MCP server command comes from MCP_CONFIG (chaosline's
// generated config pointing at the shim) instead of being hardcoded.
import { config as loadEnv } from "dotenv";
loadEnv({ path: new URL("../../.env", import.meta.url).pathname });
import { readFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const HARD_TIMEOUT_MS = 120_000;
const MAX_TURNS = 8;
const PER_CALL_TIMEOUT_MS = 20_000;

const mcpConfigPath = process.env.MCP_CONFIG;
if (!mcpConfigPath) {
  console.error("agent: MCP_CONFIG env var not set, nothing to connect to.");
  process.exit(2);
}
const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, "utf8"));
const paymentsServer = mcpConfig.mcpServers?.payments;
if (!paymentsServer) {
  console.error("agent: MCP_CONFIG has no `payments` server entry.");
  process.exit(2);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const transport = new StdioClientTransport({
  command: paymentsServer.command,
  args: paymentsServer.args,
  env: { ...process.env, ...(paymentsServer.env ?? {}) },
  stderr: "inherit",
});

const client = new Client({ name: "chaosline-example-agent", version: "0.1.0" });
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

console.error("\n=== AGENT (example-raw-sdk) SUMMARY ===");
console.error(`turns: ${turn}, tool calls: ${toolCallCount}`);
console.error(`tokens in=${totalInputTokens} out=${totalOutputTokens}`);
console.error(`final message: ${finalText}`);

await client.close();
process.exit(0);
