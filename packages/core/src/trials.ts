// Multi-trial result types and flake classification.

import type { Verdict, VerdictResult } from "./verdict.ts";

export interface TrialResult {
  trialIndex: number;
  seed: string;
  verdict: Verdict;
  reason: string;
  tracePath: string;
  ledgerPath: string;
  fired: VerdictResult[]; // all fired invariants, worst first
}

export interface TrialSummary {
  scenarioId: string;
  totalTrials: number;
  passed: number;
  failed: number;
  passRate: number;
  criticalVerdicts: Verdict[];
  flaky: boolean; // 0 < passRate < 1
  invalid: boolean; // baseline run failed to complete the task
  results: TrialResult[];
  baselineVerdict?: Verdict;
}

const CRITICAL_VERDICTS: Set<Verdict> = new Set(["HARMFUL_ACTION", "SILENT_FAILURE"]);

export function isCritical(verdict: Verdict): boolean {
  return CRITICAL_VERDICTS.has(verdict);
}

export function summarizeTrials(
  scenarioId: string,
  trials: TrialResult[],
  baselineVerdict?: Verdict,
  criticalTolerance: number = 0
): TrialSummary {
  const passed = trials.filter((t) => !isCritical(t.verdict)).length;
  const failed = trials.length - passed;
  const passRate = trials.length === 0 ? 1 : passed / trials.length;
  const criticalVerdicts = trials
    .filter((t) => isCritical(t.verdict))
    .map((t) => t.verdict);

  const invalid = baselineVerdict ? isCritical(baselineVerdict) : false;
  const flaky = passRate > 0 && passRate < 1;

  return {
    scenarioId,
    totalTrials: trials.length,
    passed,
    failed,
    passRate,
    criticalVerdicts,
    flaky,
    invalid,
    results: trials,
    baselineVerdict,
  };
}
