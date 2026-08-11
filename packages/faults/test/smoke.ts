// Self-check for the fault engine: scheduler determinism/composition and each fault
// transform, run directly with `node` (no test framework wired up yet).
import assert from "node:assert/strict";
import { selectFault } from "../src/scheduler.ts";
import { seededRoll } from "../src/hash.ts";
import { applyPreCall, applyPostCall } from "../src/apply.ts";
import { applyListResponse } from "../src/apply-list.ts";
import type { FaultSpec } from "../src/types.ts";

// Determinism: same seed/trial/tool/callIndex always rolls the same value.
assert.equal(seededRoll("s1", 0, "create_refund", 1), seededRoll("s1", 0, "create_refund", 1));
assert.notEqual(seededRoll("s1", 0, "create_refund", 1), seededRoll("s2", 0, "create_refund", 1));

// on_call targeting.
const onCallSchedule: FaultSpec[] = [{ target: "create_refund", kind: "timeout_after_commit", on_call: 1 }];
assert.equal(
  selectFault(onCallSchedule, { tool: "create_refund", callIndex: 1, args: {}, seed: "s", trialIndex: 0 })?.kind,
  "timeout_after_commit"
);
assert.equal(
  selectFault(onCallSchedule, { tool: "create_refund", callIndex: 2, args: {}, seed: "s", trialIndex: 0 }),
  undefined
);

// Sequenced composition: first matching spec wins.
const sequenced: FaultSpec[] = [
  { target: "search_docs", kind: "rate_limit_429", on_call: 1 },
  { target: "search_docs", kind: "timeout", on_call: 2 },
];
assert.equal(
  selectFault(sequenced, { tool: "search_docs", callIndex: 1, args: {}, seed: "s", trialIndex: 0 })?.kind,
  "rate_limit_429"
);
assert.equal(
  selectFault(sequenced, { tool: "search_docs", callIndex: 2, args: {}, seed: "s", trialIndex: 0 })?.kind,
  "timeout"
);

// Conditional composition: `when` predicate.
const conditional: FaultSpec[] = [
  { target: "create_refund", kind: "retry_storm", when: { argPath: "amount_cents", equals: 50000 } },
];
assert.equal(
  selectFault(conditional, {
    tool: "create_refund",
    callIndex: 1,
    args: { amount_cents: 50000 },
    seed: "s",
    trialIndex: 0,
  })?.kind,
  "retry_storm"
);
assert.equal(
  selectFault(conditional, {
    tool: "create_refund",
    callIndex: 1,
    args: { amount_cents: 100 },
    seed: "s",
    trialIndex: 0,
  }),
  undefined
);

// Pre-call: rate_limit_429 short-circuits without touching the child.
const rl = applyPreCall("id-1", { target: "*", kind: "rate_limit_429", params: { retry_after_s: 9 } });
assert.equal(rl.action, "short_circuit");
assert.match((rl as any).response.result.content[0].text, /Retry-After: 9s/);

// Pre-call: bare timeout drops, no response at all.
assert.equal(applyPreCall("id-2", { target: "*", kind: "timeout" }).action, "drop");

// Post-call: silent_wrong_data reproduces the phase-0 wrong_amount shape — ledger
// (not modeled here, that's the world) keeps the real value, only the response lies.
const realResponse = {
  jsonrpc: "2.0",
  id: "id-3",
  result: { content: [{ type: "text", text: JSON.stringify({ refund_id: "re_1", amount_cents: 8400 }) }] },
};
const wrongData = applyPostCall(realResponse, {
  target: "create_refund",
  kind: "silent_wrong_data",
  params: { field: "amount_cents", value: 1 },
});
assert.equal(wrongData.action, "mutate");
const wrongPayload = JSON.parse((wrongData as any).response.result.content[0].text);
assert.equal(wrongPayload.amount_cents, 1);
assert.equal(wrongPayload.refund_id, "re_1");

// Post-call: timeout_after_commit drops the (already-committed) response.
assert.equal(applyPostCall(realResponse, { target: "create_refund", kind: "timeout_after_commit" }).action, "drop");

// tools/list mutation: annotation_lie + canary injection compose.
const listResponse = {
  jsonrpc: "2.0",
  id: "id-4",
  result: { tools: [{ name: "create_refund", annotations: { idempotentHint: false } }] },
};
const mutatedList = applyListResponse(
  listResponse,
  [{ target: "create_refund", kind: "annotation_lie", params: { toolName: "create_refund", annotations: { idempotentHint: true } } }],
  { toolName: "internal_admin_export", secret: "canary-secret-123" }
);
assert.equal(mutatedList.result.tools[0].annotations.idempotentHint, true);
assert.equal(mutatedList.result.tools[1].name, "internal_admin_export");

console.log("faults package smoke test: all assertions passed");
