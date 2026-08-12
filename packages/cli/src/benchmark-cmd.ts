import { runBenchmark } from "./benchmark.ts";

// Global (chaosline-level) flags. Recognized wherever they appear in argv — including
// after a --agent clause — so a global flag typed after --agent isn't silently
// swallowed as part of the agent's own command line (see packages/core/test/trials.ts
// sibling bug writeup: benchmark --report-dir placed after --agent used to be
// absorbed into the agent's argv and silently ignored).
const GLOBAL_FLAGS = new Set(["--scenario", "--report-dir", "--model-upstream", "--budget-usd", "--trials", "--pass-rate"]);

export async function benchmarkCommand(args: string[]) {
  let scenarioId: string | undefined;
  let agents: Array<{ name: string; command: string; args: string[] }> = [];
  let reportDir = ".chaosline/benchmark";
  let modelUpstream: string | undefined;
  let budgetUsd = 1.0;
  let nTrials = 2;
  let passRate = 0.8;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--") {
      i++;
      break;
    } else if (arg === "--scenario") {
      scenarioId = args[++i];
    } else if (arg === "--report-dir") {
      reportDir = args[++i];
    } else if (arg === "--model-upstream") {
      modelUpstream = args[++i];
    } else if (arg === "--budget-usd") {
      budgetUsd = parseFloat(args[++i]);
    } else if (arg === "--trials") {
      nTrials = parseInt(args[++i]);
    } else if (arg === "--pass-rate") {
      passRate = parseFloat(args[++i]);
    } else if (arg === "--agent") {
      const name = args[++i];
      const cmd = args[++i];
      const cmdArgs: string[] = [];
      i++;
      while (i < args.length && args[i] !== "--agent" && args[i] !== "--" && !GLOBAL_FLAGS.has(args[i])) {
        cmdArgs.push(args[i]);
        i++;
      }
      agents.push({ name, command: cmd, args: cmdArgs });
      i--;
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(2);
    }
    i++;
  }

  if (!scenarioId) {
    console.error("--scenario is required");
    process.exit(2);
  }

  if (agents.length === 0) {
    console.error("at least one --agent is required");
    process.exit(2);
  }

  if (!modelUpstream) {
    console.warn("no --model-upstream specified; using real API (expensive)");
  }

  try {
    const agentInputs = agents.map((a) => ({
      name: a.name,
      framework: a.name.split("-")[0],
      frameworkVersion: "unknown",
      command: a.command,
      args: a.args,
    }));

    await runBenchmark({
      scenarioId,
      agents: agentInputs,
      reportOutputDir: reportDir,
      modelUpstream,
      budgetUsd,
      nTrials,
      passRate,
    });

    console.log("\nBenchmark complete. Check " + reportDir + " for results.");
  } catch (err) {
    console.error("Benchmark failed:", err instanceof Error ? err.message : String(err));
    process.exit(2);
  }
}
