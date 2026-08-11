#!/usr/bin/env node
import { runCommand } from "../src/run.ts";
import { shimCommand } from "../src/shim-cmd.ts";
import { replayCommand } from "../src/replay.ts";
import { listCommand } from "../src/list-cmd.ts";
import { initCommand } from "../src/init.ts";

const [, , sub, ...rest] = process.argv;

if (sub === "run") {
  await runCommand(rest);
} else if (sub === "shim") {
  shimCommand(rest);
} else if (sub === "replay") {
  await replayCommand(rest);
} else if (sub === "list") {
  listCommand(rest);
} else if (sub === "init") {
  initCommand(rest);
} else {
  console.error(
    "Usage:\n  chaosline run (--scenario <id> | --tag <smoke|full|critical>) [--trials N] [--pass-rate P] [--critical-tolerance N] [--scenarios-dir <path>] [--scenarios-module <path>] -- <agent command...>\n  chaosline list [--tag <tag>] [--world <world>]\n  chaosline replay --bundle <path> [--explain] [--no-rerun]\n  chaosline shim -- <mcp server command...>\n  chaosline init"
  );
  process.exit(2);
}
