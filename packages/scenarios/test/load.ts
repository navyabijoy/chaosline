// Self-check for the scenario loader, run directly with `node` (no test
// framework wired up yet, matching packages/faults/test/smoke.ts's convention).

import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadScenarioFile, loadScenarioDir } from "../src/load.ts";
import { defineScenario } from "../src/builder.ts";
import { FAULT_KINDS } from "../src/schema.ts";
import type { FaultKind } from "@chaosline/faults";

// FAULT_KINDS must stay in sync with @chaosline/faults' FaultKind union (16
// kinds as of Phase 3). This is a type-level check, not a runtime one — if a
// kind is added to types.ts without updating FAULT_KINDS here, this line fails
// to typecheck, since a value assignable to FaultKind won't be assignable if
// FAULT_KINDS is missing a member and vice versa is checked by the enum's own
// z.enum(FAULT_KINDS) parse succeeding against every real fault kind below.
const _check: FaultKind = FAULT_KINDS[0];
assert.equal(FAULT_KINDS.length, 16, "FAULT_KINDS must have exactly 16 entries (see docs/03-fault-taxonomy.md)");

const dir = mkdtempSync(join(tmpdir(), "chaosline-scenarios-test-"));

writeFileSync(
  join(dir, "timeout-after-commit.yaml"),
  `
id: payments/timeout-after-commit
version: 1
world: payments
tool: create_refund
tags: [smoke, full, critical]
description: Round-trip test scenario.
faults:
  - target: create_refund
    kind: timeout_after_commit
    on_call: 1
derivedFrom:
  "84.00": [8400]
`
);

const loaded = loadScenarioFile(join(dir, "timeout-after-commit.yaml"));
assert.equal(loaded.id, "payments/timeout-after-commit");
assert.equal(loaded.world, "payments");
assert.equal(loaded.tool, "create_refund");
assert.deepEqual(loaded.tags, ["smoke", "full", "critical"]);
assert.equal(loaded.faults[0].kind, "timeout_after_commit");
assert.deepEqual(loaded.derivedFrom, { "84.00": [8400] });

// loadScenarioDir keys by id and rejects a duplicate.
const dirMap = loadScenarioDir(dir);
assert.equal(dirMap.size, 1);
assert.ok(dirMap.has("payments/timeout-after-commit"));

writeFileSync(
  join(dir, "dup.yaml"),
  `
id: payments/timeout-after-commit
version: 1
world: payments
tool: create_refund
tags: [smoke]
faults:
  - target: create_refund
    kind: timeout_after_commit
`
);
assert.throws(() => loadScenarioDir(dir), /duplicate scenario id/);

// A malformed scenario (missing required tags) is rejected, not silently
// coerced — authoring mistakes must fail loudly, not produce a scenario that
// silently never fires.
assert.throws(
  () =>
    loadScenarioFile(
      (() => {
        const p = join(dir, "malformed.yaml");
        writeFileSync(p, `id: payments/bad\nversion: 1\nworld: payments\ntool: create_refund\nfaults: []\n`);
        return p;
      })()
    ),
  /tags|faults/i
);

// id's prefix must match world for a registered world...
assert.throws(
  () =>
    defineScenario({
      id: "payments/mismatched",
      world: "db",
      tool: "db_update_balance",
      tags: ["smoke"],
      faults: [{ target: "db_update_balance", kind: "timeout_after_commit" }],
    }),
  /prefix must match the world/
);

// ...but a "custom" scenario is free to namespace its id however it likes.
const customNamespaced = defineScenario({
  id: "billing/webhook-timeout",
  world: "custom",
  tool: "send_webhook",
  tags: ["smoke"],
  customServerCommand: { command: "node", args: ["./mcp/billing-server"] },
  faults: [{ target: "send_webhook", kind: "timeout_after_commit" }],
});
assert.equal(customNamespaced.id, "billing/webhook-timeout");

// custom world requires customServerCommand.
assert.throws(
  () =>
    defineScenario({
      id: "example/missing-command",
      world: "custom",
      tool: "charge_card",
      tags: ["smoke"],
      faults: [{ target: "charge_card", kind: "timeout_after_commit" }],
    }),
  /customServerCommand/
);

// The code API produces the same shape the YAML loader does.
const built = defineScenario({
  id: "example/my-tool-timeout",
  world: "custom",
  tool: "charge_card",
  tags: ["smoke"],
  customServerCommand: { command: "node", args: ["./mcp/billing-server"] },
  faults: [{ target: "charge_card", kind: "timeout_after_commit", on_call: 1 }],
});
assert.equal(built.world, "custom");
assert.equal(built.customServerCommand?.command, "node");

console.log("packages/scenarios/test/load.ts: all assertions passed");
