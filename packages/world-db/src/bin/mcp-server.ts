#!/usr/bin/env node
// world-db as a real MCP server over stdio. No fault injection lives here —
// per docs/02-architecture.md Mode A, faults belong at the proxy (packages/shim),
// not inside the world. This process is clean.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { queryBalance, updateBalance, getTransactions } from "../rows.ts";
import { writeFileSync } from "node:fs";

const dbSnapshotPath = process.env.CHAOSLINE_DB_SNAPSHOT_PATH;

function snapshotDb() {
  if (!dbSnapshotPath) return;
  writeFileSync(dbSnapshotPath, JSON.stringify(getTransactions(), null, 2));
}

const server = new McpServer({ name: "chaosline-world-db", version: "0.1.0" });

server.registerTool(
  "db_query_balance",
  {
    description: "Query a customer's balance.",
    inputSchema: {
      customer_id: z.string(),
    },
  },
  async ({ customer_id }) => {
    const result = queryBalance(customer_id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

server.registerTool(
  "db_update_balance",
  {
    description: "Update a customer's balance by a delta.",
    inputSchema: {
      customer_id: z.string(),
      delta_cents: z.number(),
      idempotency_key: z.string().optional(),
    },
  },
  async ({ customer_id, delta_cents, idempotency_key }) => {
    const result = updateBalance(customer_id, delta_cents, idempotency_key);
    console.error(
      `[db_update_balance] customer_id=${customer_id} delta_cents=${delta_cents} idempotency_key=${idempotency_key ?? "(none)"} -> balance_after=${result.balance_after}`
    );
    snapshotDb();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[world-db] MCP server up on stdio.");
