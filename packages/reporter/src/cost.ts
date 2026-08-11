import { readTrace, type RunEvent } from "@chaosline/core";

export interface TraceCost {
  costUsd: number;
  latencyMs: number;
}

/** Sums real (non-cached) model spend and wall time from a trace file already on disk. */
export function traceCost(tracePath: string): TraceCost {
  let trace: RunEvent[];
  try {
    trace = readTrace(tracePath);
  } catch {
    return { costUsd: 0, latencyMs: 0 };
  }
  if (trace.length === 0) return { costUsd: 0, latencyMs: 0 };

  let costUsd = 0;
  for (const e of trace) {
    if (e.kind === "model_response" && !e.cached) {
      costUsd += e.usage.cost_usd ?? 0;
    }
  }
  const latencyMs = trace[trace.length - 1].t - trace[0].t;
  return { costUsd, latencyMs };
}
