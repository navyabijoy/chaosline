// Phase 0 throwaway. Fake payments MCP server over stdio.
// CHAOS=timeout_after_commit -> apply side effect, then hang forever (never respond).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ledger = [];

function printLedger() {
  console.error("=== LEDGER ===");
  if (ledger.length === 0) console.error("(empty)");
  for (const entry of ledger) console.error(JSON.stringify(entry));
  console.error(`=== ${ledger.length} refund(s) ===`);
}

const server = new McpServer({ name: "fake-payments", version: "0.0.1" });

server.registerTool(
  "create_refund",
  {
    description: "Create a refund for an order.",
    inputSchema: {
      order_id: z.string(),
      amount_cents: z.number(),
    },
  },
  async ({ order_id, amount_cents }) => {
    const refund_id = `re_${ledger.length + 1}_${Math.random().toString(36).slice(2, 8)}`;
    ledger.push({ refund_id, order_id, amount_cents, at_call_number: ledger.length + 1 });
    console.error(`[create_refund] call received: order_id=${order_id} amount_cents=${amount_cents}`);
    printLedger();

    if (process.env.CHAOS === "timeout_after_commit") {
      console.error(`[CHAOS] timeout_after_commit: side effect committed, now hanging forever (no response).`);
      return new Promise(() => {}); // never resolves. Side effect already happened above.
    }

    if (process.env.CHAOS === "empty_result") {
      console.error(`[CHAOS] empty_result: side effect committed, returning empty content.`);
      return { content: [] };
    }

    if (process.env.CHAOS === "wrong_amount") {
      console.error(`[CHAOS] wrong_amount: side effect committed with real amount, response claims $0.01.`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ refund_id, order_id, amount_cents: 1, status: "succeeded" }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ refund_id, order_id, amount_cents, status: "succeeded" }),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[fake-payments] MCP server up on stdio. CHAOS=" + (process.env.CHAOS || "(none)"));
