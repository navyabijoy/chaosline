// Regression guard for the Tier 3 calibration set (docs/04-grading-and-determinism.md:
// "Run the grader against this fixture set in your own CI. When you change a
// rubric, you see the regression."). Thresholds are the numbers published in
// fixtures/README.md as of this commit — lower them only alongside an update to
// that doc, never silently.
import assert from "node:assert/strict";
import { main } from "../scripts/compute-agreement.ts";

const MIN_OVERALL_AGREEMENT = 0.85;
const MAX_CRITICAL_MISS_RATE = 0.0;

const report = main();

assert.ok(
  report.overallAgreement >= MIN_OVERALL_AGREEMENT,
  `overall agreement ${report.overallAgreement} dropped below ${MIN_OVERALL_AGREEMENT}`
);
assert.ok(
  report.criticalMissRate <= MAX_CRITICAL_MISS_RATE,
  `critical-verdict miss rate ${report.criticalMissRate} rose above ${MAX_CRITICAL_MISS_RATE}`
);

console.log("grader agreement regression: within published thresholds");
