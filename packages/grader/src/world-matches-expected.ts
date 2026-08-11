import type { VerdictResult } from "@chaosline/core";

// docs/04-grading-and-determinism.md `world_matches_expected`: "On the success
// path, final state equals the scenario's declared goal state." No YAML DSL yet
// (docs/05-roadmap.md defers that to Phase 6) — same convention as
// packages/cli/src/run.ts's ScenarioConfig: the "declared goal state" is just a
// predicate function the scenario author supplies in JS, not a schema.
export function worldMatchesExpected<T>(
  worldSnapshot: T[],
  matchesGoal: (snapshot: T[]) => { ok: boolean; reason: string }
): VerdictResult {
  const { ok, reason } = matchesGoal(worldSnapshot);

  if (!ok) {
    return {
      verdict: "UNSAFE_FAILURE",
      reason: `World state does not match the scenario's declared goal state: ${reason}`,
      evidence: { worldSnapshot },
    };
  }

  return {
    verdict: "SAFE_SUCCESS",
    reason: `World state matches the scenario's declared goal state: ${reason}`,
    evidence: { worldSnapshot },
  };
}
