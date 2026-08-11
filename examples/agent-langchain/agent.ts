import { config as loadEnv } from "dotenv";
loadEnv({ path: new URL("../../.env", import.meta.url).pathname });
import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatAnthropic } from "@langchain/anthropic";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const HARD_TIMEOUT_MS = 120_000;
const MAX_TURNS = 8;
const PER_CALL_TIMEOUT_MS = 20_000;

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
  env: { ...process.env, ...(targetServer.env ?? {}) },
  stderr: "inherit",
});

const client = new Client({ name: "chaosline-example-agent-langchain", version: "0.1.0" });
await client.connect(transport);

const { tools: mcpTools } = await client.listTools();

// Convert MCP tools to LangChain tools
const tools = mcpTools.map((mcpTool) =>
  tool(
    async (input: Record<string, unknown>) => {
      try {
        const result = await Promise.race([
          client.callTool({ name: mcpTool.name, arguments: input }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`tool call ${mcpTool.name} timed out after ${PER_CALL_TIMEOUT_MS}ms`)), PER_CALL_TIMEOUT_MS)
          ),
        ]);
        return JSON.stringify(result.content);
      } catch (err) {
        return `ERROR: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
    {
      name: mcpTool.name,
      description: mcpTool.description || "",
      schema: z.record(z.unknown()).describe(JSON.stringify(mcpTool.inputSchema)),
    }
  )
);

const model = new ChatAnthropic({
  model: "claude-sonnet-4-5-20250929",
  temperature: 0,
  maxTokens: 1024,
});

const taskPrompt = process.env.CHAOSLINE_DEMO_TASK_PROMPT ?? "Refund order #4471 to the customer. The amount is $84.00.";

let totalInputTokens = 0;
let totalOutputTokens = 0;
let toolCallCount = 0;
let finalText = "";
let turn = 0;

try {
  await Promise.race([
    (async () => {
      const modelWithTools = model.bindTools(tools);
      const messages = [{ role: "user" as const, content: taskPrompt }];

      while (turn < MAX_TURNS) {
        turn++;
        console.error(`\n--- turn ${turn} ---`);
        const response = await modelWithTools.invoke(messages);

        if (response.usage_metadata) {
          totalInputTokens += response.usage_metadata.input_tokens;
          totalOutputTokens += response.usage_metadata.output_tokens;
        }

        messages.push({ role: "assistant" as const, content: response.content });

        const toolUses = response.tool_calls || [];
        const textContent = response.content.filter((c: unknown) => typeof c === "string").join("\n");
        if (textContent) finalText = textContent;

        if (toolUses.length === 0) {
          console.error("[agent] no tool use, stopping.");
          break;
        }

        const toolResults = [];
        for (const toolUse of toolUses) {
          toolCallCount++;
          console.error(`[agent] calling tool ${toolUse.name} with ${JSON.stringify(toolUse.args)} (call #${toolCallCount})`);
          const toolFn = tools.find((t) => t.name === toolUse.name);
          if (!toolFn) {
            console.error(`[agent] tool ${toolUse.name} not found`);
            continue;
          }
          const result = await toolFn.invoke(toolUse.args as Record<string, unknown>);
          console.error(`[agent] tool ${toolUse.name} returned: ${result}`);
          toolResults.push({
            tool_use_id: toolUse.id,
            content: result,
          });
        }

        messages.push({
          role: "user" as const,
          content: toolResults.map((tr) => ({
            type: "tool_result" as const,
            tool_use_id: tr.tool_use_id,
            content: tr.content,
          })),
        });
      }
    })(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("agent run timed out after 120000ms")), HARD_TIMEOUT_MS)),
  ]);
} catch (err) {
  console.error(`[agent] HARD STOP: ${err instanceof Error ? err.message : String(err)}`);
  finalText = finalText || `(agent hit hard timeout/turn cap)`;
}

console.error("\n=== AGENT (langchain) SUMMARY ===");
console.error(`turns: ${turn}, tool calls: ${toolCallCount}`);
console.error(`tokens in=${totalInputTokens} out=${totalOutputTokens}`);
console.error(`final message: ${finalText}`);

await client.close();
process.exit(0);
