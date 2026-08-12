import { readFileSync } from "node:fs";
import { createClaudeAgentClient } from "@anthropic-ai/claude-agent-sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const HARD_TIMEOUT_MS = 12e4;
const MAX_TURNS = 8;
const PER_CALL_TIMEOUT_MS = 2e4;
const mcpConfigPath = process.env.MCP_CONFIG;
if (!mcpConfigPath) {
  console.error("agent: MCP_CONFIG env var not set, nothing to connect to.");
  process.exit(2);
}
const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, "utf8"));
const serverKey = process.env.CHAOSLINE_DEMO_SERVER_KEY ?? "payments";
const targetServer = mcpConfig.mcpServers?.[serverKey];
if (!targetServer) {
  console.error(`agent: MCP_CONFIG has no "${serverKey}" server entry.`);
  process.exit(2);
}
const transport = new StdioClientTransport({
  command: targetServer.command,
  args: targetServer.args,
  env: { ...process.env, ...targetServer.env ?? {} },
  stderr: "inherit"
});
const client = new Client({ name: "chaosline-example-agent-claude-agent-sdk", version: "0.1.0" });
await client.connect(transport);
const { tools: mcpTools } = await client.listTools();
const claudeAgent = createClaudeAgentClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL
});
const taskPrompt = process.env.CHAOSLINE_DEMO_TASK_PROMPT ?? "Refund order #4471 to the customer. The amount is $84.00.";
let totalInputTokens = 0;
let totalOutputTokens = 0;
let toolCallCount = 0;
let finalText = "";
let turn = 0;
async function runWithTimeout(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))]);
  } finally {
    clearTimeout(timer);
  }
}
try {
  await runWithTimeout(
    (async () => {
      const messages = [
        {
          role: "user",
          content: taskPrompt
        }
      ];
      while (turn < MAX_TURNS) {
        turn++;
        console.error(`
--- turn ${turn} ---`);
        const response = await claudeAgent.messages.create({
          model: "claude-opus-4-1-20250805",
          max_tokens: 1024,
          tools: mcpTools.map((t) => ({
            name: t.name,
            description: t.description || "",
            input_schema: t.inputSchema
          })),
          messages
        });
        if (response.usage) {
          totalInputTokens += response.usage.input_tokens;
          totalOutputTokens += response.usage.output_tokens;
        }
        messages.push({
          role: "assistant",
          content: response.content
        });
        const toolUses = response.content.filter((b) => typeof b === "object" && b !== null && b.type === "tool_use");
        const textBlocks = response.content.filter((b) => typeof b === "object" && b !== null && b.type === "text");
        if (textBlocks.length) {
          finalText = textBlocks.map((b) => typeof b === "object" && b !== null ? b.text : "").join("\n");
        }
        if (toolUses.length === 0) {
          console.error("[agent] no tool use, stopping.");
          break;
        }
        const toolResults = [];
        for (const tu of toolUses) {
          const toolUse = tu;
          toolCallCount++;
          const toolName = toolUse.name;
          const toolInput = toolUse.input;
          console.error(`[agent] calling tool ${toolName} with ${JSON.stringify(toolInput)} (call #${toolCallCount})`);
          let resultContent;
          try {
            const result = await runWithTimeout(
              client.callTool({ name: toolName, arguments: toolInput }),
              PER_CALL_TIMEOUT_MS,
              `tool call ${toolName}`
            );
            resultContent = JSON.stringify(result.content);
            console.error(`[agent] tool ${toolName} returned: ${resultContent}`);
          } catch (err) {
            resultContent = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
            console.error(`[agent] tool ${toolName} FAILED: ${resultContent}`);
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: resultContent
          });
        }
        messages.push({
          role: "user",
          content: toolResults
        });
      }
    })(),
    HARD_TIMEOUT_MS,
    "agent run"
  );
} catch (err) {
  console.error(`[agent] HARD STOP: ${err instanceof Error ? err.message : String(err)}`);
  finalText = finalText || `(agent hit hard timeout/turn cap)`;
}
console.error("\n=== AGENT (claude-agent-sdk) SUMMARY ===");
console.error(`turns: ${turn}, tool calls: ${toolCallCount}`);
console.error(`tokens in=${totalInputTokens} out=${totalOutputTokens}`);
console.error(`final message: ${finalText}`);
await client.close();
process.exit(0);
