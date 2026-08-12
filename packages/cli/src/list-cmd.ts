import { loadAllScenarios } from "./run";
import type { ScenarioTag, WorldKey } from "@chaosline/scenarios";

export function listCommand(args: string[]): void {
  const tagIdx = args.indexOf("--tag");
  const tag = tagIdx !== -1 ? (args[tagIdx + 1] as ScenarioTag) : undefined;
  const worldIdx = args.indexOf("--world");
  const world = worldIdx !== -1 ? (args[worldIdx + 1] as WorldKey) : undefined;

  const scenarios = [...loadAllScenarios().values()]
    .filter((s) => !tag || s.tags.includes(tag))
    .filter((s) => !world || s.world === world)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (scenarios.length === 0) {
    console.log("chaosline list: no scenarios matched");
    return;
  }

  for (const s of scenarios) {
    const line = `${s.id.padEnd(32)} [${s.world.padEnd(8)}] ${s.tags.join(", ")}`;
    console.log(s.description ? `${line}\n  ${s.description.trim()}` : line);
  }
}
