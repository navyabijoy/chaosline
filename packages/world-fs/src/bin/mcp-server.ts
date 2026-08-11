#!/usr/bin/env node
// world-fs as a real MCP server over stdio. No fault injection lives here —
// faults belong at the proxy (packages/shim), not inside the world. This process
// is clean.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFile, readFile, getFsSnapshot } from "../fs.ts";
import { writeFileSync } from "node:fs";

const fsSnapshotPath = process.env.CHAOSLINE_FS_SNAPSHOT_PATH;

function snapshotFs() {
  if (!fsSnapshotPath) return;
  writeFileSync(fsSnapshotPath, JSON.stringify(getFsSnapshot(), null, 2));
}

const server = new McpServer({ name: "chaosline-world-fs", version: "0.1.0" });

server.registerTool(
  "fs_write_file",
  {
    description: "Write a file.",
    inputSchema: {
      path: z.string(),
      content: z.string(),
    },
  },
  async ({ path, content }) => {
    const result = writeFile(path, content);
    console.error(
      `[fs_write_file] path=${path} -> bytes_written=${result.bytes_written}`
    );
    snapshotFs();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

server.registerTool(
  "fs_read_file",
  {
    description: "Read a file.",
    inputSchema: {
      path: z.string(),
    },
  },
  async ({ path }) => {
    const result = readFile(path);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[world-fs] MCP server up on stdio.");
