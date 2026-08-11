import { runBenchmark } from "./benchmark.ts";

export async function benchmarkCommand(args: string[]) {
  let scenarioId: string | undefined;
  let agents: Array<{ name: string; command: string; args: string[] }> = [];
  let reportDir = ".chaosline/benchmark";
  let modelUpstream: string | undefined;
  let budgetUsd = 1.0;
  let nTrials = 2;
  let passRate = 0.8;
  let doubleDash = false;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--") {
      doubleDash = true;
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
      while (i < args.length && args[i] !== "--agent" && args[i] !== "--") {
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
