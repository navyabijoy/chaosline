// stdio MCP passthrough. Wraps a real MCP stdio server as a child process and
// forwards every JSON-RPC message transparently in both directions, except for
// one fault hook: FAULTLINE_FAULT=timeout_after_commit on FAULTLINE_FAULT_TOOL
// lets the call through to the child, records its result, and never forwards
// the response to the real client — a lost-response hang, on purpose.
//
// MCP stdio framing (2026-07-28): one JSON-RPC message per line, newline-delimited.
// No sessions, no initialize handshake to special-case — just messages.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { TraceWriter } from "@faultline/core";

interface PendingCall {
  tool: string;
  args: unknown;
  swallow: boolean;
}

export function runShim(childCommand: string, childArgs: string[]): void {
  const faultKind = process.env.FAULTLINE_FAULT;
  const faultTool = process.env.FAULTLINE_FAULT_TOOL;
  const tracePath = process.env.FAULTLINE_TRACE_PATH;
  const trace = tracePath ? new TraceWriter(tracePath) : undefined;

  const child = spawn(childCommand, childArgs, {
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
  });

  const pending = new Map<string | number, PendingCall>();

  // client (agent) -> child (world server)
  const fromClient = createInterface({ input: process.stdin });
  fromClient.on("line", (line) => {
    if (!line.trim()) return;
    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch {
      child.stdin.write(line + "\n");
      return;
    }

    if (msg.method === "tools/call" && msg.id !== undefined) {
      const tool = msg.params?.name;
      const swallow = faultKind === "timeout_after_commit" && tool === faultTool;
      pending.set(msg.id, { tool, args: msg.params?.arguments, swallow });
      trace?.write({
        t: Date.now(),
        kind: "tool_call",
        id: String(msg.id),
        tool,
        args: msg.params?.arguments,
      });
    }

    child.stdin.write(line + "\n");
  });

  // child (world server) -> client (agent)
  const fromChild = createInterface({ input: child.stdout });
  fromChild.on("line", (line) => {
    if (!line.trim()) return;
    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch {
      process.stdout.write(line + "\n");
      return;
    }

    const call = msg.id !== undefined ? pending.get(msg.id) : undefined;
    if (call) {
      pending.delete(msg.id);
      trace?.write({
        t: Date.now(),
        kind: "tool_result",
        id: String(msg.id),
        ok: !msg.error,
        body: msg.result ?? msg.error,
        ...(call.swallow
          ? { injected: { kind: "timeout_after_commit", tool: call.tool } }
          : {}),
      });
      if (call.swallow) {
        // Side effect already landed on the child. Never forward the response —
        // the real client hangs, exactly like a lost reply over the wire.
        return;
      }
    }

    process.stdout.write(line + "\n");
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  process.stdin.on("close", () => {
    child.kill();
  });
}
