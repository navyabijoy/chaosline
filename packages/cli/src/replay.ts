import { readFileSync, existsSync } from "node:fs";
import { readTrace } from "@chaosline/core";
import type { ReproBundle } from "./repro-bundle.ts";
import { gradeTrial, runSingleTrial } from "./run.ts";

export async function replayCommand(args: string[]): Promise<void> {
  const bundleIdx = args.indexOf("--bundle");
  const bundlePath = bundleIdx !== -1 ? args[bundleIdx + 1] : undefined;
  if (!bundlePath) {
    console.error("chaosline replay: missing --bundle <path>");
    process.exit(2);
  }

  if (!existsSync(bundlePath)) {
    console.error(`chaosline replay: bundle not found: ${bundlePath}`);
    process.exit(2);
  }

  const bundle = JSON.parse(readFileSync(bundlePath, "utf8")) as ReproBundle;
  const explain = args.includes("--explain");
  const noRerun = args.includes("--no-rerun");

  console.log(`chaosline: replaying ${bundle.scenarioId} trial ${bundle.trialIndex}`);
  console.log(`original verdict: ${bundle.verdict} — ${bundle.reason}`);

  if (noRerun) {
    // Grading is pure over the recorded trace and world snapshot, so the saved
    // run can be scored again without spending anything on the agent.
    if (!existsSync(bundle.tracePath)) {
      console.error(`chaosline replay: --no-rerun requires the original trace, not found at ${bundle.tracePath}`);
      process.exit(2);
    }
    const ledgerSnapshot = existsSync(bundle.ledgerPath)
      ? JSON.parse(readFileSync(bundle.ledgerPath, "utf8"))
      : [];
    const regraded = gradeTrial({
      trace: readTrace(bundle.tracePath),
      ledgerSnapshot,
      toolName: bundle.toolName,
      canary: bundle.faultSchedule.canary,
      budgetUsd: bundle.budgetUsd,
      stepCap: bundle.stepCap,
      maxRetries: bundle.maxRetries,
      derivedFrom: bundle.derivedFrom,
      killedByHarness: false,
    });

    if (regraded.verdict === bundle.verdict) {
      console.log(`\nREGRADED — verdict unchanged: ${regraded.verdict}`);
    } else {
      console.log(`\nREGRADED — verdict changed: ${bundle.verdict} -> ${regraded.verdict}`);
      console.log(`The trace is unchanged, so the grader itself has changed since this bundle was written.`);
    }

    if (explain) {
      printExplanation(bundle.tracePath, regraded.verdict, regraded.reason, regraded.fired);
    }
    return;
  }

  console.log(`re-invoking agent with the exact seed and fault schedule from the bundle...`);
  // No response cache here: replay is a one-shot correctness check, and serving a
  // cached response would prove only that the cache is consistent.
  const result = await runSingleTrial({
    trialIndex: bundle.trialIndex,
    seed: bundle.seed,
    scenarioId: bundle.scenarioId,
    faults: bundle.faultSchedule.faults,
    canary: bundle.faultSchedule.canary,
    toolName: bundle.toolName,
    agentCmd: bundle.agentCommand,
    agentArgs: bundle.agentArgs,
    budgetUsd: bundle.budgetUsd,
    modelUpstream: bundle.modelUpstream,
    wallClockCapMs: bundle.wallClockCapMs,
    stepCap: bundle.stepCap,
    maxRetries: bundle.maxRetries,
    derivedFrom: bundle.derivedFrom,
  });

  if (result.verdict === bundle.verdict) {
    console.log(`\nREPRODUCED — verdict matches: ${result.verdict}`);
  } else {
    // Same seed and same fault schedule, different outcome: the failure depends
    // on agent-side non-determinism, which is itself worth reporting.
    console.log(`\nDID NOT REPRODUCE — original: ${bundle.verdict}, replay: ${result.verdict}`);
  }

  if (explain) {
    printExplanation(result.tracePath, result.verdict, result.reason, result.fired);
  }
}

function printExplanation(
  tracePath: string,
  verdict: string,
  reason: string,
  fired?: Array<{ verdict: string; reason: string }>
): void {
  console.log(`\nexplaining failure:`);
  console.log(`verdict: ${verdict}`);
  console.log(`reason: ${reason}`);
  console.log(`trace file: ${tracePath}`);

  if (fired && fired.length > 0) {
    console.log(`\ninvariants fired, worst first:`);
    for (const r of fired) console.log(`  ${r.verdict} — ${r.reason}`);
  }

  if (!existsSync(tracePath)) return;

  const trace = readTrace(tracePath);
  console.log(`\ntrace events (${trace.length}):`);
  let toolCallNum = 0;
  for (const event of trace) {
    if (event.kind === "tool_call") {
      toolCallNum++;
      console.log(`  [${toolCallNum}] tool_call: ${event.tool}`);
      if (event.injected) {
        console.log(`       ↳ injected fault: ${event.injected.kind}`);
      }
    } else if (event.kind === "tool_result") {
      console.log(`  [${toolCallNum}] tool_result: ok=${event.ok}`);
      if (event.injected) {
        console.log(`       ↳ injected fault: ${event.injected.kind}`);
      }
    } else if (event.kind === "world_mutation") {
      console.log(`  [world] ${event.world}.${event.op}`);
    } else if (event.kind === "agent_output") {
      console.log(`  [output] final text: ${(event.text || "").substring(0, 200)}`);
    }
  }
}
