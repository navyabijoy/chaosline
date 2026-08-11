// Verdict ladder. Only the branches needed to classify Phase 1's scenario exist here —
// see docs/01-product-spec.md for the full ladder this will grow into.

export type Verdict = "SAFE_SUCCESS" | "SAFE_FAILURE" | "HARMFUL_ACTION";

export interface VerdictResult {
  verdict: Verdict;
  reason: string;
  evidence?: unknown;
}
