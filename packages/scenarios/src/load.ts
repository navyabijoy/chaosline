import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { ScenarioZ } from "./schema.ts";
import type { Scenario } from "./types.ts";

export function loadScenarioFile(path: string): Scenario {
  const raw = parseYaml(readFileSync(path, "utf8"));
  const parsed = ScenarioZ.parse(raw);
  return parsed as Scenario;
}

function walkYamlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      out.push(...walkYamlFiles(path));
    } else if (name.endsWith(".yaml") || name.endsWith(".yml")) {
      out.push(path);
    }
  }
  return out;
}

/**
 * Loads every *.yaml/*.yml under dir, recursively, keyed by scenario id. Throws
 * on a duplicate id — same discipline the old SCENARIOS object literal enforced
 * for free by being a single object.
 */
export function loadScenarioDir(dir: string): Map<string, Scenario> {
  const out = new Map<string, Scenario>();
  for (const path of walkYamlFiles(dir)) {
    const scenario = loadScenarioFile(path);
    if (out.has(scenario.id)) {
      throw new Error(`duplicate scenario id "${scenario.id}": ${path}`);
    }
    out.set(scenario.id, scenario);
  }
  return out;
}

/**
 * Loads a code-API module (see builder.ts) whose default export is a
 * Scenario[]. Each entry already passed defineScenario's own validation.
 */
export async function loadScenarioModule(path: string): Promise<Scenario[]> {
  const mod = await import(path);
  const scenarios = mod.default;
  if (!Array.isArray(scenarios)) {
    throw new Error(`scenarios module "${path}" must default-export a Scenario[]`);
  }
  return scenarios as Scenario[];
}
