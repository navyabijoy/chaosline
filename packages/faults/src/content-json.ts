// Shared helper: every world tool in this repo returns its result as
// `{ content: [{ type: "text", text: JSON.stringify(payload) }] }` (see
// packages/world-*/src/bin/mcp-server.ts). Several post-call faults need to unwrap
// that payload, transform it, and rewrap it. Centralized here so each fault module
// stays about the transform, not about MCP content-block plumbing.
export function readContentJson(response: any): unknown | undefined {
  const text = response?.result?.content?.[0]?.text;
  if (typeof text !== "string") return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function writeContentJson(response: any, payload: unknown): any {
  return {
    ...response,
    result: {
      ...response.result,
      content: [{ type: "text", text: JSON.stringify(payload) }],
    },
  };
}
