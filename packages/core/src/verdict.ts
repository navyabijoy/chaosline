// Verdict ladder, full six values per docs/01-product-spec.md. Each invariant
// returns one of these directly; callers aggregate by picking the worst one seen.

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

// Precedence for verdict resolution (docs/04-grading-and-determinism.md, Phase 4):
// when several invariants fire on the same run, the aggregate verdict is the worst
// one seen, worst-first per docs/01-product-spec.md's severity column (critical >
// fail > warn > pass). Ties (two invariants at the same severity) keep whichever
// was encountered first — callers should order invariant calls so the most
// specific/informative one runs first when that matters for the `reason` text.
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

// Aggregates however many invariant results a run produced into one verdict:
// worst-severity wins, and `fired` preserves the full list (sorted worst-first) so
// a report can show every invariant that had something to say, not just the winner.
export function resolveVerdict(results: VerdictResult[]): ResolvedVerdict {
  if (results.length === 0) {
    throw new Error("resolveVerdict: no invariant results to resolve");
  }
  const fired = [...results].sort((a, b) => severityRank(a.verdict) - severityRank(b.verdict));
  const worst = fired[0];
  return { verdict: worst.verdict, reason: worst.reason, evidence: worst.evidence, fired };
}
