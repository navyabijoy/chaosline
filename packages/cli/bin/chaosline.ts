#!/usr/bin/env node
import { createRequire } from "node:module";
import { runCommand } from "../src/run";
import { shimCommand } from "../src/shim-cmd";
import { replayCommand } from "../src/replay";
import { listCommand } from "../src/list-cmd";
import { initCommand } from "../src/init";
import { reportDiffCommand } from "../src/report-diff";
import { benchmarkCommand } from "../src/benchmark-cmd";
import { aggregateCommand } from "../src/aggregate-cmd";
import { demoCommand } from "../src/demo";

const [, , sub, ...rest] = process.argv;

const USAGE =
  "Usage:\n  chaosline run (--scenario <id> | --tag <smoke|full|critical>) [--trials N] [--pass-rate P] [--critical-tolerance N] [--report-dir <path>] [--scenarios-dir <path>] [--scenarios-module <path>] -- <agent command...>  (runs your real agent against a real model)\n  chaosline list [--tag <tag>] [--world <world>]\n  chaosline replay --bundle <path> [--explain] [--no-rerun]\n  chaosline report-diff --base <path> --head <path>\n  chaosline benchmark --scenario <id> --agent <name> <cmd> [args...] [--agent ...] [--report-dir <path>] [--model-upstream <url>]\n  chaosline aggregate-benchmark --input-dir <path> [--output-dir <path>]\n  chaosline demo  (scripted walkthrough — the model side is a fixed, replayed transcript, not a live LLM call; use `chaosline run` to test against a real model)\n  chaosline shim -- <mcp server command...>\n  chaosline init";

if (sub === "--help" || sub === "-h" || sub === "help") {
  console.log(USAGE);
  process.exit(0);
} else if (sub === "--version" || sub === "-v" || sub === "version") {
  // Read from package.json rather than hardcoding, so this can't drift from
  // what's actually published. "../package.json" is correct both from source
  // (bin/chaosline.ts) and from the built dist/chaosline.js — both sit one
  // level below the package root.
  const require = createRequire(import.meta.url);
  const pkg = require("../package.json");
  console.log(pkg.version);
  process.exit(0);
} else if (sub === "run") {
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
  console.error(USAGE);
  process.exit(2);
}
