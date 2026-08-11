// The runtime-validated shape of a scenario. Kept separate from types.ts so the
// pure TS type (for compile-time use) and the zod schema (for YAML/code-API
// validation and JSON Schema generation) don't fight over the same file.
//
// FaultKind's 16 literals are duplicated here deliberately: @chaosline/faults
// exports it as a TS type, not a runtime value, so there's nothing to import at
// runtime. test/load.ts asserts this list's length stays 16, so a fault kind
// added to packages/faults/src/types.ts without a matching update here is caught.

import { z } from "zod";

export const FAULT_KINDS = [
  "timeout_after_commit",
  "omission",
  "silent_wrong_data",
  "partial_failure_mid_plan",
  "tool_result_injection",
  "retry_storm",
  "timeout",
  "rate_limit_429",
  "malformed_response",
  "schema_drift",
  "auth_expiry_mid_run",
  "schema_violating_output",
  "annotation_lie",
  "wrong_error_channel",
  "capability_downgrade",
  "stale_cache",
] as const;

export const FaultWhenZ = z.object({
  argPath: z.string(),
  contains: z.string().optional(),
  equals: z.unknown().optional(),
});

export const FaultSpecZ = z.object({
  target: z.string(),
  kind: z.enum(FAULT_KINDS),
  on_call: z.number().int().positive().optional(),
  probability: z.number().min(0).max(1).optional(),
  when: FaultWhenZ.optional(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const CanarySpecZ = z.object({
  toolName: z.string(),
  secret: z.string(),
});

export const WORLD_KEYS = ["payments", "db", "email", "fs", "http", "search", "custom"] as const;
export const SCENARIO_TAGS = ["smoke", "full", "critical"] as const;

export const CustomServerCommandZ = z.object({
  command: z.string(),
  args: z.array(z.string()),
});

export const ScenarioZ = z
  .object({
    // Present in checked-in YAML for editor completion; ignored at runtime.
    $schema: z.string().optional(),
    id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, "id must be \"<world>/<name>\", lowercase, hyphenated"),
    version: z.literal(1),
    world: z.enum(WORLD_KEYS),
    tool: z.string(),
    tags: z.array(z.enum(SCENARIO_TAGS)).min(1),
    description: z.string().optional(),
    faults: z.array(FaultSpecZ).min(1),
    canary: CanarySpecZ.optional(),
    derivedFrom: z.record(z.string(), z.array(z.union([z.string(), z.number()]))).optional(),
    customServerCommand: CustomServerCommandZ.optional(),
    demoTaskPrompt: z.string().optional(),
  })
  .refine(
    (s) => (s.world === "custom" ? s.customServerCommand !== undefined : s.customServerCommand === undefined),
    { message: "customServerCommand is required when world is \"custom\", and must be omitted otherwise" }
  )
  .refine((s) => s.world === "custom" || s.id.split("/")[0] === s.world, {
    // "custom" scenarios are free to namespace their id by domain (e.g.
    // "billing/webhook-timeout") rather than the literal word "custom" — the
    // check only makes sense for the 6 registered worlds, where the id's
    // prefix is expected to match the packaged world it targets.
    message: "id's \"<world>/<name>\" prefix must match the world field for a registered world",
  });

export function generateJsonSchema(): unknown {
  return z.toJSONSchema(ScenarioZ, { target: "draft-7" });
}
