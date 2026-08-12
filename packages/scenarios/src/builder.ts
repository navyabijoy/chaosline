// The code API for custom scenarios: a typed constructor producing the exact
// same Scenario shape the YAML loader produces, validated by the same zod
// schema, so both paths feed run.ts identically and there's one source of
// truth for what makes a scenario valid.

import type { CanarySpec, FaultSpec } from "@chaosline/faults";
import { ScenarioZ } from "./schema.ts";
import type { CustomServerCommand, Scenario, ScenarioTag, WorldKey } from "./types.ts";

export interface DefineScenarioInput {
  id: string;
  world: WorldKey;
  tool: string;
  tags: ScenarioTag[];
  faults: FaultSpec[];
  canary?: CanarySpec;
  derivedFrom?: Record<string, Array<string | number>>;
  description?: string;
  customServerCommand?: CustomServerCommand;
  demoTaskPrompt?: string;
}

export function defineScenario(input: DefineScenarioInput): Scenario {
  return ScenarioZ.parse({ version: 1, ...input }) as Scenario;
}
