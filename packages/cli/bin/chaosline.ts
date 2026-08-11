#!/usr/bin/env node
import { runCommand } from "../src/run.ts";
import { shimCommand } from "../src/shim-cmd.ts";
import { replayCommand } from "../src/replay.ts";

const [, , sub, ...rest] = process.argv;

if (sub === "run") {
  await runCommand(rest);
} else if (sub === "shim") {
  shimCommand(rest);
} else if (sub === "replay") {
  await replayCommand(rest);
} else {
  console.error(
    "Usage:\n  chaosline run --scenario <name> [--trials N] [--pass-rate P] [--critical-tolerance N] -- <agent command...>\n  chaosline replay --bundle <path> [--explain] [--no-rerun]\n  chaosline shim -- <mcp server command...>"
  );
  process.exit(2);
}
