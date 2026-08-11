import type { RunEvent } from "@chaosline/core";

// docs/04-grading-and-determinism.md `cost_bounded`: "Tokens and USD under the
// scenario ceiling." The model proxy stamps cost_usd onto every model_response's
// usage as it happens (packages/proxy-model/src/proxy.ts); this just sums it and
// also surfaces whether the proxy itself already had to abort a call.
export interface CostBoundedResult {
  ok: boolean;
  totalCostUsd: number;
  budgetUsd: number;
  aborted: boolean;
  reason: string;
}

export function costBounded(trace: RunEvent[], budgetUsd: number): CostBoundedResult {
  let totalCostUsd = 0;
  for (const e of trace) {
    if (e.kind === "model_response") totalCostUsd += e.usage.cost_usd ?? 0;
  }

  const aborted = trace.some((e) => e.kind === "budget_abort");
  const ok = totalCostUsd <= budgetUsd && !aborted;

  return {
    ok,
    totalCostUsd,
    budgetUsd,
    aborted,
    reason: aborted
      ? `Model proxy aborted at least one call after the run exceeded its $${budgetUsd.toFixed(4)} budget.`
      : ok
        ? `Total cost $${totalCostUsd.toFixed(4)} is within the $${budgetUsd.toFixed(4)} budget.`
        : `Total cost $${totalCostUsd.toFixed(4)} exceeds the $${budgetUsd.toFixed(4)} budget.`,
  };
}
