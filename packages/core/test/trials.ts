// Unit coverage for summarizeTrials' pass/fail tally, run directly with `node`
// (same convention as packages/grader/test/invariants.ts — no test framework wired up).
import assert from "node:assert/strict";
import { summarizeTrials, isCritical, isPassingVerdict, type TrialResult, type Verdict } from "../src/trials.ts";

function trial(verdict: Verdict, index = 0): TrialResult {
  return {
    trialIndex: index,
    seed: `seed-${index}`,
    verdict,
    reason: "test fixture",
    tracePath: "",
    ledgerPath: "",
    fired: [{ verdict, reason: "test fixture" }],
  };
}

// The bug this guards: a run where every trial is a failure verdict must never
// summarize as a pass. UNSAFE_FAILURE (agent crashed/hung/never exited cleanly)
// is not critical (doesn't violate --critical-tolerance), but it is not a pass —
// conflating "not critical" with "passed" is exactly what let a fully-crashed
// run report "CONSISTENT PASS" with exit code 0.
{
  const trials = [trial("UNSAFE_FAILURE", 0), trial("UNSAFE_FAILURE", 1), trial("UNSAFE_FAILURE", 2)];
  const summary = summarizeTrials("test/scenario", trials);
  assert.equal(summary.passed, 0, "UNSAFE_FAILURE trials must not be counted as passed");
  assert.equal(summary.failed, 3);
  assert.equal(summary.passRate, 0);
}

// DEGRADED has the same shape of bug: not critical, but the product's own verdict
// model documents it as "investigate", not a pass.
{
  const trials = [trial("DEGRADED", 0), trial("DEGRADED", 1)];
  const summary = summarizeTrials("test/scenario", trials);
  assert.equal(summary.passed, 0, "DEGRADED trials must not be counted as passed");
  assert.equal(summary.passRate, 0);
}

// SAFE_FAILURE and SAFE_SUCCESS are the two verdicts the product model documents
// as passes; both must still count as passed.
{
  const trials = [trial("SAFE_SUCCESS", 0), trial("SAFE_FAILURE", 1)];
  const summary = summarizeTrials("test/scenario", trials);
  assert.equal(summary.passed, 2);
  assert.equal(summary.failed, 0);
  assert.equal(summary.passRate, 1);
}

// The two critical verdicts must be both non-passing and flagged critical.
{
  const trials = [trial("HARMFUL_ACTION", 0), trial("SILENT_FAILURE", 1)];
  const summary = summarizeTrials("test/scenario", trials);
  assert.equal(summary.passed, 0);
  assert.deepEqual(summary.criticalVerdicts.sort(), ["HARMFUL_ACTION", "SILENT_FAILURE"]);
}

// isCritical and isPassingVerdict answer different questions and must not collapse
// into complements of each other — DEGRADED and UNSAFE_FAILURE are proof: neither
// critical nor passing.
{
  assert.equal(isCritical("DEGRADED"), false);
  assert.equal(isPassingVerdict("DEGRADED"), false);
  assert.equal(isCritical("UNSAFE_FAILURE"), false);
  assert.equal(isPassingVerdict("UNSAFE_FAILURE"), false);
}

// A mixed run (some pass, some fail, none critical) must be neither a clean pass
// nor flagged critical, but the pass rate must reflect the real failures.
{
  const trials = [trial("SAFE_SUCCESS", 0), trial("UNSAFE_FAILURE", 1), trial("DEGRADED", 2), trial("SAFE_FAILURE", 3)];
  const summary = summarizeTrials("test/scenario", trials);
  assert.equal(summary.passed, 2);
  assert.equal(summary.failed, 2);
  assert.equal(summary.passRate, 0.5);
  assert.equal(summary.criticalVerdicts.length, 0);
}

console.log("packages/core/test/trials.ts: all assertions passed");
