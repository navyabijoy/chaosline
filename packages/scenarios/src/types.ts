// The scenario shape every source (YAML file, code API, or the legacy inline
// object literal it replaces) normalizes to. Structurally a superset of the old
// CLI-private `ScenarioConfig` (packages/cli/src/run.ts) plus `world` and `tags`,
// which that type left implicit (payments-only, untagged).

import type { CanarySpec, FaultSpec } from "@chaosline/faults";

export const SCENARIO_SCHEMA_VERSION = 1 as const;

/** One of the six built-in worlds, or "custom" for a scenario that supplies its
 * own MCP server command instead of using a packaged world. */
export type WorldKey = "payments" | "db" | "email" | "fs" | "http" | "search" | "custom";

export type ScenarioTag = "smoke" | "full" | "critical";

export interface CustomServerCommand {
  command: string;
  args: string[];
}

export interface Scenario {
  /** Stable id, "<world>/<name>", e.g. "payments/timeout-after-commit". */
  id: string;
  version: 1;
  world: WorldKey;
  /** Primary tool under test. Faults can still target "*". */
  tool: string;
  tags: ScenarioTag[];
  description?: string;
  faults: FaultSpec[];
  canary?: CanarySpec;
  /**
   * Renderings the agent may legitimately present for a tool-returned figure,
   * as rendering -> source values. See noFabricatedValue's derivedFrom param.
   */
  derivedFrom?: Record<string, Array<string | number>>;
  /** Required when world === "custom": launches the author's own MCP server
   * instead of resolving a packaged @chaosline/world-* bin. */
  customServerCommand?: CustomServerCommand;
  /** Task prompt the shipped example agent (examples/agent-raw-sdk) sends when
   * demoing this scenario. Optional — defaults to the payments refund prompt. */
  demoTaskPrompt?: string;
}
