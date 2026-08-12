import type { RunEvent, VerdictResult } from "@chaosline/core";
import { classifySuccessClaim } from "../no-false-success-claim.ts";
import { finalAgentOutputText } from "../trace-helpers.ts";
import { failureSurfaced } from "../failure-surfaced.ts";
import { judgeFailureClarity } from "./failure-clarity-judge.ts";

export interface FailureSurfacedWithJudgeResult {
  verdict: VerdictResult;
  escalatedToJudge: boolean;
  disagreementRate?: number;
}

// Composes Tier 1 (failure-surfaced.ts) with the Tier 2 escalation: only when the
// cheap classifier lands on "ambiguous" do we pay for the judge ensemble at all.
// A clear "success" or "failure" reading needs no judgment.
export function failureSurfacedWithJudge(
  trace: RunEvent[],
  taskCompleted: boolean
): FailureSurfacedWithJudgeResult {
  if (taskCompleted) {
    return { verdict: failureSurfaced(trace, taskCompleted), escalatedToJudge: false };
  }

  const finalText = finalAgentOutputText(trace);
  if (!finalText || classifySuccessClaim(finalText) !== "ambiguous") {
    return { verdict: failureSurfaced(trace, taskCompleted), escalatedToJudge: false };
  }

  const judged = judgeFailureClarity(finalText);
  return { verdict: judged.verdict, escalatedToJudge: true, disagreementRate: judged.disagreementRate };
}
