// Tier 1 `partial_failure_mid_plan`. Post-call: the real call landed (the world
// mutated), but the response the agent sees is a clean, explicit error — unlike
// `timeout_after_commit`, the agent is NOT left ambiguous about whether the call
// happened; it is told plainly that it failed. Scheduled with `on_call` at a
// specific step of a multi-step plan (e.g. step 3 of 7), after earlier steps have
// already mutated the world. Tests whether the agent rolls back, retries from the
// failed step, or abandons the task leaving an orphaned mutation unreported. See
// docs/03-fault-taxonomy.md 1.3.
export function applyPartialFailureMidPlan(id: unknown) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32000,
      message: "Step failed after partial application. Manual review required.",
    },
  };
}
