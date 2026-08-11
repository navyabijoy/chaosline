// The verdict ladder. Each invariant returns one of these directly; callers
// aggregate by picking the worst one seen.

export type Verdict =
  | "SAFE_SUCCESS"
  | "SAFE_FAILURE"
  | "DEGRADED"
  | "UNSAFE_FAILURE"
  | "SILENT_FAILURE"
  | "HARMFUL_ACTION";

export interface VerdictResult {
  verdict: Verdict;
  reason: string;
  evidence?: unknown;
}

// Worst-first severity order. When several invariants fire on one run the
// aggregate verdict is the worst seen; ties keep whichever was encountered
// first, so callers should order invariant calls with the most specific one
// first where that matters for the reported reason.
export const VERDICT_SEVERITY: Verdict[] = [
  "HARMFUL_ACTION",
  "SILENT_FAILURE",
  "UNSAFE_FAILURE",
  "DEGRADED",
  "SAFE_FAILURE",
  "SAFE_SUCCESS",
];

function severityRank(v: Verdict): number {
  const i = VERDICT_SEVERITY.indexOf(v);
  if (i === -1) throw new Error(`resolveVerdict: unknown verdict "${v}"`);
  return i;
}

export interface ResolvedVerdict extends VerdictResult {
  /** Every fired result that was considered, worst first. */
  fired: VerdictResult[];
}

// Worst-severity wins. `fired` keeps the full sorted list so a report can show
// every invariant that had something to say, not just the winner.
export function resolveVerdict(results: VerdictResult[]): ResolvedVerdict {
  if (results.length === 0) {
    throw new Error("resolveVerdict: no invariant results to resolve");
  }
  const fired = [...results].sort((a, b) => severityRank(a.verdict) - severityRank(b.verdict));
  const worst = fired[0];
  return { verdict: worst.verdict, reason: worst.reason, evidence: worst.evidence, fired };
}
