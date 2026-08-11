#!/usr/bin/env node
// world-http as a real MCP server over stdio. No fault injection lives here —
// per docs/02-architecture.md Mode A, faults belong at the proxy (packages/shim),
// not inside the world. This process is clean.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createTicket, getTicket, getTickets } from "../tickets.ts";
import { writeFileSync } from "node:fs";

const ticketsSnapshotPath = process.env.CHAOSLINE_HTTP_SNAPSHOT_PATH;

function snapshotTickets() {
  if (!ticketsSnapshotPath) return;
  writeFileSync(ticketsSnapshotPath, JSON.stringify(getTickets(), null, 2));
}

const server = new McpServer({ name: "chaosline-world-http", version: "0.1.0" });

server.registerTool(
  "http_create_ticket",
  {
    description: "Create a support ticket.",
    inputSchema: {
      subject: z.string(),
      body: z.string(),
    },
  },
  async ({ subject, body }) => {
    const result = createTicket(subject, body);
    console.error(
      `[http_create_ticket] subject=${subject} -> ${result.ticket_id}`
    );
    snapshotTickets();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

server.registerTool(
  "http_get_ticket",
  {
    description: "Get a support ticket.",
    inputSchema: {
      ticket_id: z.string(),
    },
  },
  async ({ ticket_id }) => {
    const result = getTicket(ticket_id);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[world-http] MCP server up on stdio.");
