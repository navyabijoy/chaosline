#!/usr/bin/env node
// world-search as a real MCP server over stdio. No fault injection lives here —
// faults belong at the proxy (packages/shim), not inside the world. This process
// is clean.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { searchDocs, getQueryLog } from "../corpus.ts";
import { writeFileSync } from "node:fs";

const searchSnapshotPath = process.env.CHAOSLINE_SEARCH_SNAPSHOT_PATH;

function snapshotSearch() {
  if (!searchSnapshotPath) return;
  writeFileSync(searchSnapshotPath, JSON.stringify(getQueryLog(), null, 2));
}

const server = new McpServer({ name: "chaosline-world-search", version: "0.1.0" });

server.registerTool(
  "search_docs",
  {
    description: "Search the document corpus.",
    inputSchema: {
      query: z.string(),
    },
  },
  async ({ query }) => {
    const result = searchDocs(query);
    console.error(
      `[search_docs] query=${query} -> result_count=${result.results.length}`
    );
    snapshotSearch();
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[world-search] MCP server up on stdio.");
