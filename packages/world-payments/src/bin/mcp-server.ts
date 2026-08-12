#!/usr/bin/env node
// world-payments as a real MCP server over stdio. No fault injection lives here —
// faults belong at the proxy (packages/shim), not inside the world. This process
// is clean.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRefund, getLedger } from "../ledger.ts";
import { writeFileSync } from "node:fs";

const ledgerSnapshotPath = process.env.CHAOSLINE_LEDGER_PATH;

function snapshotLedger() {
  if (!ledgerSnapshotPath) return;
  writeFileSync(ledgerSnapshotPath, JSON.stringify(getLedger(), null, 2));
}

const server = new McpServer({ name: "chaosline-world-payments", version: "0.1.0" });

server.registerTool(
  "create_refund",
  {
    description: "Create a refund for an order.",
    inputSchema: {
      order_id: z.string(),
      amount_cents: z.number(),
      idempotency_key: z.string().optional(),
    },
  },
  async ({ order_id, amount_cents, idempotency_key }) => {
    const result = createRefund(order_id, amount_cents, idempotency_key);
    console.error(
      `[create_refund] order_id=${order_id} amount_cents=${amount_cents} idempotency_key=${idempotency_key ?? "(none)"} -> ${result.refund_id}`
    );
    snapshotLedger();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[world-payments] MCP server up on stdio.");
