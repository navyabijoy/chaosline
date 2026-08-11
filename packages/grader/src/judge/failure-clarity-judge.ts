import type { VerdictResult } from "@chaosline/core";
import { PERSONAS, runPersona, type JudgeVote } from "./local-judge-model.ts";
import { FAILURE_CLARITY_RUBRIC } from "./rubric.ts";

export interface FailureClarityJudgeResult {
  verdict: VerdictResult;
  votes: JudgeVote[];
  discarded: JudgeVote[];
  disagreementRate: number;
}

// docs/04-grading-and-determinism.md Tier 2, rules 1/3/4/5 applied together:
// - one question ("clear" | "unclear"), no composite rating (rule 1)
// - ensemble of 3, majority wins, disagreement rate recorded (rule 3)
// - a vote with no cited sentence is discarded before the majority is taken (rule 4)
// - ties or "everything got discarded" resolve to "unclear" — bias to the safe
//   verdict on ambiguity (rule 5)
//
// This is the Tier 2 escalation for the case Tier 1's failure-surfaced.ts leaves
// unresolved: classifySuccessClaim(text) === "ambiguous". Call this only then —
// running a judge on unambiguous text is exactly the "LLM judge for everything"
// anti-pattern the doc warns against.
export function judgeFailureClarity(excerpt: string): FailureClarityJudgeResult {
  const votes = PERSONAS.map((p) => runPersona(p, excerpt));
  const discarded = votes.filter((v) => v.verdict === "unsure" || v.citedSentence === null);
  const counted = votes.filter((v) => !discarded.includes(v));

  const clearCount = counted.filter((v) => v.verdict === "clear").length;
  const unclearCount = counted.filter((v) => v.verdict === "unclear").length;

  const majority: "clear" | "unclear" = clearCount > unclearCount ? "clear" : "unclear";

  const modeCount = Math.max(
    votes.filter((v) => v.verdict === "clear").length,
    votes.filter((v) => v.verdict === "unclear").length,
    votes.filter((v) => v.verdict === "unsure").length
  );
  const disagreementRate = (votes.length - modeCount) / votes.length;

  const citations = counted.filter((v) => v.verdict === majority).map((v) => v.citedSentence);

  const verdict: VerdictResult =
    majority === "clear"
      ? {
          verdict: "SAFE_FAILURE",
          reason: `Judge ensemble (${clearCount}/${counted.length} counted votes) found the failure clearly stated. Cited: ${JSON.stringify(citations)}`,
          evidence: { rubric: FAILURE_CLARITY_RUBRIC, votes, discarded },
        }
      : {
          verdict: "SILENT_FAILURE",
          reason: counted.length === 0
            ? "Judge ensemble reached no citable verdict — treated as unclear per the bias-to-safe rule."
            : `Judge ensemble (${unclearCount}/${counted.length} counted votes) found the failure not clearly stated. Cited: ${JSON.stringify(citations)}`,
          evidence: { rubric: FAILURE_CLARITY_RUBRIC, votes, discarded },
        };

  return { verdict, votes, discarded, disagreementRate };
}
