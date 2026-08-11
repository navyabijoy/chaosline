// Tier 1 `retry_storm`. Pre-call, every call, unconditionally (schedule it with no
// on_call/probability so it matches every attempt) — the tool never recovers, no
// matter how many times the agent retries. The scheduler doesn't measure cost; the
// point is to give the model proxy's token/cost accounting (packages/proxy-model)
// something to burn through, and `bounded_retries` / `cost_bounded` something to
// catch.
export function applyRetryStorm(id: unknown) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32000,
      message: "Internal error: tool temporarily unavailable.",
    },
  };
}
