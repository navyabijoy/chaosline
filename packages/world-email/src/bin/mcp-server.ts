#!/usr/bin/env node
// world-email as a real MCP server over stdio. No fault injection lives here —
// faults belong at the proxy (packages/shim), not inside the world. This process
// is clean.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { sendEmail, getOutbox } from "../outbox";
import { writeFileSync } from "node:fs";

const outboxSnapshotPath = process.env.CHAOSLINE_EMAIL_SNAPSHOT_PATH;

function snapshotOutbox() {
  if (!outboxSnapshotPath) return;
  writeFileSync(outboxSnapshotPath, JSON.stringify(getOutbox(), null, 2));
}

const server = new McpServer({ name: "chaosline-world-email", version: "0.1.0" });

server.registerTool(
  "send_email",
  {
    description: "Send an email.",
    inputSchema: {
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    },
  },
  async ({ to, subject, body }) => {
    const result = sendEmail(to, subject, body);
    console.error(
      `[send_email] to=${to} subject=${subject} -> ${result.message_id}`
    );
    snapshotOutbox();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[world-email] MCP server up on stdio.");
