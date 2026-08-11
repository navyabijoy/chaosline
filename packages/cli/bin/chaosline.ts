#!/usr/bin/env node
import { runCommand } from "../src/run.ts";
import { shimCommand } from "../src/shim-cmd.ts";

const [, , sub, ...rest] = process.argv;

if (sub === "run") {
  await runCommand(rest);
} else if (sub === "shim") {
  shimCommand(rest);
} else {
  console.error(
    "Usage:\n  chaosline run --scenario <name> -- <agent command...>\n  chaosline shim -- <mcp server command...>"
  );
  process.exit(2);
}
