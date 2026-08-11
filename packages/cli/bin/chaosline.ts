#!/usr/bin/env node
import { runCommand } from "../src/run.ts";
import { shimCommand } from "../src/shim-cmd.ts";
import { replayCommand } from "../src/replay.ts";
import { listCommand } from "../src/list-cmd.ts";
import { initCommand } from "../src/init.ts";
import { reportDiffCommand } from "../src/report-diff.ts";
import { benchmarkCommand } from "../src/benchmark-cmd.ts";
import { aggregateCommand } from "../src/aggregate-cmd.ts";
import { demoCommand } from "../src/demo.ts";

const [, , sub, ...rest] = process.argv;

if (sub === "run") {
  // runCommand calls process.exit(0|1) itself on a clean gate result; an
  // uncaught throw here means the harness broke, not that the agent failed —
  // that's exit 2, never 1, so a CI gate can tell "your agent is unsafe"
  // apart from "our tool crashed" (docs/05-roadmap.md Phase 7).
  try {
    await runCommand(rest);
  } catch (e) {
    console.error(`chaosline run: harness error: ${(e as Error).stack ?? e}`);
    process.exit(2);
  }
} else if (sub === "shim") {
  shimCommand(rest);
} else if (sub === "replay") {
  await replayCommand(rest);
} else if (sub === "list") {
  listCommand(rest);
} else if (sub === "init") {
  initCommand(rest);
} else if (sub === "report-diff") {
  reportDiffCommand(rest);
} else if (sub === "benchmark") {
  try {
    await benchmarkCommand(rest);
  } catch (e) {
    console.error(`chaosline benchmark: harness error: ${(e as Error).stack ?? e}`);
    process.exit(2);
  }
} else if (sub === "aggregate-benchmark") {
  try {
    await aggregateCommand(rest);
  } catch (e) {
    console.error(`chaosline aggregate-benchmark: error: ${(e as Error).stack ?? e}`);
    process.exit(2);
  }
} else if (sub === "demo") {
  try {
    await demoCommand(rest);
  } catch (e) {
    console.error(`chaosline demo: error: ${(e as Error).stack ?? e}`);
    process.exit(2);
  }
} else {
  console.error(
    "Usage:\n  chaosline run (--scenario <id> | --tag <smoke|full|critical>) [--trials N] [--pass-rate P] [--critical-tolerance N] [--report-dir <path>] [--scenarios-dir <path>] [--scenarios-module <path>] -- <agent command...>\n  chaosline list [--tag <tag>] [--world <world>]\n  chaosline replay --bundle <path> [--explain] [--no-rerun]\n  chaosline report-diff --base <path> --head <path>\n  chaosline benchmark --scenario <id> --agent <name> <cmd> [args...] [--agent ...] [--report-dir <path>] [--model-upstream <url>]\n  chaosline aggregate-benchmark --input-dir <path> [--output-dir <path>]\n  chaosline demo\n  chaosline shim -- <mcp server command...>\n  chaosline init"
  );
  process.exit(2);
}
