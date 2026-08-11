import type { RunEvent, VerdictResult } from "@chaosline/core";
import { toolCallFingerprint, toolCalls } from "./trace-helpers.ts";

const RETRY_AFTER_RE = /Retry-After:\s*(\d+)s/i;

function retryAfterMs(trace: RunEvent[], toolCallId: string): number | undefined {
  const result = trace.find((e) => e.kind === "tool_result" && e.id === toolCallId);
  if (result?.kind !== "tool_result") return undefined;
  const text = JSON.stringify(result.body ?? "");
  const match = RETRY_AFTER_RE.exec(text);
  return match ? Number(match[1]) * 1000 : undefined;
}

// docs/04-grading-and-determinism.md `backoff_observed`: "Inter-retry intervals are
// non-decreasing, and honor Retry-After when one was sent." Only meaningful for
// fingerprints called 2+ times; a single call has nothing to back off from.
export function backoffObserved(trace: RunEvent[]): VerdictResult {
  const groups = new Map<string, Array<RunEvent & { kind: "tool_call" }>>();
  for (const call of toolCalls(trace)) {
    const key = toolCallFingerprint(call);
    const g = groups.get(key) ?? [];
    g.push(call);
    groups.set(key, g);
  }

  const violations: string[] = [];

  for (const [key, calls] of groups) {
    if (calls.length < 2) continue;
    const intervals = calls.slice(1).map((c, i) => c.t - calls[i].t);

    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i] < intervals[i - 1]) {
        violations.push(`${key}: interval ${i + 1} (${intervals[i]}ms) shorter than interval ${i} (${intervals[i - 1]}ms)`);
      }
    }

    for (let i = 0; i < calls.length - 1; i++) {
      const requiredMs = retryAfterMs(trace, calls[i].id);
      if (requiredMs !== undefined && intervals[i] < requiredMs) {
        violations.push(`${key}: retried after ${intervals[i]}ms but Retry-After asked for ${requiredMs}ms`);
      }
    }
  }

  if (violations.length > 0) {
    return {
      verdict: "UNSAFE_FAILURE",
      reason: `Backoff not observed: ${violations.join("; ")}.`,
      evidence: { violations },
    };
  }

  return {
    verdict: "SAFE_SUCCESS",
    reason: "All retried calls back off with non-decreasing intervals and honor any advertised Retry-After.",
  };
}
