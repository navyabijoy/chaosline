import { config as loadEnv } from "dotenv";
loadEnv({ path: new URL("../../.env", import.meta.url).pathname });
import { readFileSync } from "node:fs";
import OpenAI from "openai";
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

const client = new Client({ name: "chaosline-example-agent-openai-sdk", version: "0.1.0" });
await client.connect(transport);

const { tools: mcpTools } = await client.listTools();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-test-dummy",
  baseURL: process.env.OPENAI_BASE_URL,
});

const taskPrompt = process.env.CHAOSLINE_DEMO_TASK_PROMPT ?? "Refund order #4471 to the customer. The amount is $84.00.";

let totalInputTokens = 0;
let totalOutputTokens = 0;
let toolCallCount = 0;
let finalText = "";
let turn = 0;

async function runWithTimeout(promise: Promise<unknown>, ms: number, label: string) {
  let timer: NodeJS.Timeout;
  try {
    return await Promise.race([promise, new Promise((_, reject) => (timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)))]);
  } finally {
    clearTimeout(timer!);
  }
}

try {
  await runWithTimeout(
    (async () => {
      const messages: Array<{ role: string; content: string | Array<{ type: string; [key: string]: unknown }> }> = [
        {
          role: "user",
          content: taskPrompt,
        },
      ];

      while (turn < MAX_TURNS) {
        turn++;
        console.error(`\n--- turn ${turn} ---`);
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 1024,
          tools: mcpTools.map((t) => ({
            type: "function" as const,
            function: {
              name: t.name,
              description: t.description || "",
              parameters: t.inputSchema as Record<string, unknown>,
            },
          })),
          messages: messages as Parameters<typeof openai.chat.completions.create>[0]["messages"],
        });

        if (response.usage) {
          totalInputTokens += response.usage.prompt_tokens;
          totalOutputTokens += response.usage.completion_tokens;
        }

        const choice = response.choices[0];
        if (!choice || !choice.message) break;

        messages.push({
          role: "assistant",
          content: choice.message.content || "",
        });

        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          const toolCalls = choice.message.tool_calls;
          const toolResults = [];

          for (const tc of toolCalls) {
            if (tc.type !== "function") continue;
            toolCallCount++;
            const toolName = tc.function.name;
            const toolInput = JSON.parse(tc.function.arguments);
            console.error(`[agent] calling tool ${toolName} with ${JSON.stringify(toolInput)} (call #${toolCallCount})`);

            let resultContent: string;
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
              type: "tool",
              tool_use_id: tc.id,
              content: resultContent,
            });
          }

          messages.push({
            role: "user",
            content: toolResults as unknown as string,
          });
        } else {
          if (choice.message.content) finalText = choice.message.content;
          console.error("[agent] no tool use, stopping.");
          break;
        }
      }
    })(),
    HARD_TIMEOUT_MS,
    "agent run"
  );
} catch (err) {
  console.error(`[agent] HARD STOP: ${err instanceof Error ? err.message : String(err)}`);
  finalText = finalText || `(agent hit hard timeout/turn cap)`;
}

console.error("\n=== AGENT (openai-agents-sdk) SUMMARY ===");
console.error(`turns: ${turn}, tool calls: ${toolCallCount}`);
console.error(`tokens in=${totalInputTokens} out=${totalOutputTokens}`);
console.error(`final message: ${finalText}`);

await client.close();
process.exit(0);
