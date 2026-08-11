// In-memory filesystem. One process's worth of state — the MCP entrypoint
// (./bin/mcp-server.ts) is what gives this a lifetime across a chaosline run.

export interface WriteFileResult {
  path: string;
  bytes_written: number;
  status: "written";
}

export type ReadFileResult =
  | { path: string; content: string }
  | { path: string; content: null; error: "not_found" };

const files = new Map<string, string>();

export function writeFile(path: string, content: string): WriteFileResult {
  files.set(path, content);
  return { path, bytes_written: content.length, status: "written" };
}

export function readFile(path: string): ReadFileResult {
  if (!files.has(path)) {
    return { path, content: null, error: "not_found" };
  }
  return { path, content: files.get(path)! };
}

export function getFsSnapshot(): Record<string, string> {
  return Object.fromEntries(files);
}

export function resetFs(): void {
  files.clear();
}
