// A fake, local, zero-cost stand-in for the LLM that would receive
// judge/rubric.ts's prompt. Per AGENT.md's safety rules ("never call a real
// external paid API/service... everything faked/in-memory/local"), this phase does
// not wire up a real model call for the judge — the ensemble, rubric, citation
// requirement, and disagreement tracking (the actual product surface asked for in
// docs/04-grading-and-determinism.md Tier 2) are built for real here; only the
// "send the rubric + excerpt to a model" step is mocked. Swapping in a real model
// later means replacing the body of `runPersona` with an actual call — nothing
// about JudgeVote's shape, the ensemble, or the citation-discard rule changes.
//
// Three personas apply the *same* rubric with different emphases, exactly the way
// three different real judge calls would land differently on a genuinely ambiguous
// excerpt — this is what makes the disagreement-rate metric mean something instead
// of always reading zero.
export type JudgeVerdict = "clear" | "unclear" | "unsure";

export interface JudgeVote {
  persona: string;
  verdict: JudgeVerdict;
  citedSentence: string | null;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const NEGATION_RE = /\b(did not|didn'?t|was not|wasn'?t|failed|unable to|could not|couldn'?t|has not been|hasn'?t been)\b/i;
const SUCCESS_RE = /\b(processed|succeeded|successfully|completed|has been (issued|processed|completed)|status:?\s*succeeded)\b/i;
const ACTIONABLE_RE = /\b(try again|contact support|please retry|reach out to support)\b/i;
const REASSURANCE_RE = /\b(rest assured|being handled|we('| a)re on it|don'?t worry)\b/i;

// Persona A: strict on explicit negation language, the rubric's core signal.
function negationStrict(excerpt: string): JudgeVote {
  const lines = sentences(excerpt);
  const negationLine = lines.find((s) => NEGATION_RE.test(s));
  const successLine = lines.find((s) => SUCCESS_RE.test(s));

  if (negationLine && !successLine) {
    return { persona: "negation-strict", verdict: "clear", citedSentence: negationLine };
  }
  if (successLine) {
    return { persona: "negation-strict", verdict: "unclear", citedSentence: successLine };
  }
  return { persona: "negation-strict", verdict: "unsure", citedSentence: null };
}

// Persona B: looks for a concrete next step tied to the failure — the rubric's
// "vague apology is not clear" rule, from the actionability side.
function actionability(excerpt: string): JudgeVote {
  const lines = sentences(excerpt);
  const actionLine = lines.find((s) => ACTIONABLE_RE.test(s) && NEGATION_RE.test(s));
  if (actionLine) {
    return { persona: "actionability", verdict: "clear", citedSentence: actionLine };
  }
  const reassuranceLine = lines.find((s) => REASSURANCE_RE.test(s));
  if (reassuranceLine) {
    return { persona: "actionability", verdict: "unclear", citedSentence: reassuranceLine };
  }
  const bareApology = lines.find((s) => /\bsorry\b/i.test(s) && !NEGATION_RE.test(s));
  if (bareApology) {
    return { persona: "actionability", verdict: "unclear", citedSentence: bareApology };
  }
  return { persona: "actionability", verdict: "unsure", citedSentence: null };
}

// Persona C: the rubric's mixed-signal boundary case (worked example 3) — any
// success-shaped sentence anywhere makes the whole message unclear, full stop.
function mixedSignalConservative(excerpt: string): JudgeVote {
  const lines = sentences(excerpt);
  const successLine = lines.find((s) => SUCCESS_RE.test(s));
  const negationLine = lines.find((s) => NEGATION_RE.test(s));

  if (successLine) {
    return { persona: "mixed-signal-conservative", verdict: "unclear", citedSentence: successLine };
  }
  if (negationLine) {
    return { persona: "mixed-signal-conservative", verdict: "clear", citedSentence: negationLine };
  }
  return { persona: "mixed-signal-conservative", verdict: "unsure", citedSentence: null };
}

export const PERSONAS = [negationStrict, actionability, mixedSignalConservative];

export function runPersona(persona: (excerpt: string) => JudgeVote, excerpt: string): JudgeVote {
  return persona(excerpt);
}
