import type { VerdictResult } from "@chaosline/core";

// `world_matches_expected`: on the success path, final state must equal the
// scenario's declared goal state. There is no YAML DSL yet, so — as with
// packages/cli/src/run.ts's ScenarioConfig — the goal state is a predicate
// function the scenario author supplies in JS, not a schema.
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
