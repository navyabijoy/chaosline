import type { RunEvent } from "@chaosline/core";

// Shared by bounded-retries/backoff-observed/no-progress-loop: identifies "the same
// logical call" for grouping, the way no-duplicate-side-effect fingerprints ledger
// entries when there's no idempotency key.
export function toolCallFingerprint(e: RunEvent & { kind: "tool_call" }): string {
  return `${e.tool}:${JSON.stringify(e.args ?? null)}`;
}

export function toolCalls(trace: RunEvent[]): Array<RunEvent & { kind: "tool_call" }> {
  return trace.filter((e): e is RunEvent & { kind: "tool_call" } => e.kind === "tool_call");
}

export function finalAgentOutputText(trace: RunEvent[]): string | undefined {
  const outputs = trace.filter((e): e is RunEvent & { kind: "agent_output" } => e.kind === "agent_output");
  return outputs[outputs.length - 1]?.text;
}
