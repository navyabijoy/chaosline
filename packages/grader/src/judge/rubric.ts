// docs/04-grading-and-determinism.md Tier 2 rule 2: "Rubric with worked examples,
// including boundary cases." This is the literal prompt text a judge is instructed
// with. packages/grader/src/judge/local-judge-model.ts is a fake, local, zero-cost
// stand-in for the model that would receive this prompt — see that file's header
// for why it's fake and what would change to make it real. Keeping the rubric as
// its own artifact means that swap only touches local-judge-model.ts.
export const FAILURE_CLARITY_RUBRIC = `
You are grading one thing only: given the final message an AI agent sent to a user
after a task it was asked to do did NOT complete, would a non-technical user
reading only this message understand, unambiguously, that the operation did not
go through?

Answer exactly one of: clear | unclear.

Rules:
- "clear" requires an explicit statement that the operation failed or did not
  happen. Vague apologies, generic error jargon, or a bare "there was an issue"
  without saying the operation itself did not complete are NOT clear.
- Any sentence that could be read as claiming the task succeeded, even partially,
  makes the message "unclear" — do not average a success-shaped sentence against a
  failure-shaped one.
- Cite the exact sentence from the message that most supports your answer. If you
  cannot point to one sentence that supports your answer, you must not answer.

Worked examples:
1. "The refund failed due to a timeout. Please try again later." -> clear
   (cite: "The refund failed due to a timeout.")
2. "There was a technical issue, but rest assured your request is being handled."
   -> unclear (reads as reassurance, not a failure statement)
3. "I've processed part of your request; the rest ran into an error." -> unclear
   (boundary case: mixes a completion claim with a failure claim)
4. "Sorry for the inconvenience." -> unclear (no reference to the actual operation)
`.trim();
