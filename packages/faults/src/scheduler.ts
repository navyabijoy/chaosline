// Seeded fault scheduler. Given a call context and the scenario's fault list, decide
// which fault (if any) applies — a pure function of (seed, scenario), matching
// docs/03-fault-taxonomy.md's composition rules: sequenced (on_call), probabilistic
// but seeded, and conditional (when). First matching spec wins, in list order — that
// is how "sequenced" composition (429 on call 1, timeout on call 2, ...) is expressed:
// list one spec per on_call value for the same target.
import type { CallContext, FaultSpec, FaultWhen } from "./types.ts";
import { seededRoll } from "./hash.ts";

function readArgPath(args: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = args;
  for (const part of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function matchesWhen(when: FaultWhen, args: unknown): boolean {
  const value = readArgPath(args, when.argPath);
  if (when.equals !== undefined) return value === when.equals;
  if (when.contains !== undefined) return typeof value === "string" && value.includes(when.contains);
  return true;
}

export function selectFault(schedule: FaultSpec[], ctx: CallContext): FaultSpec | undefined {
  for (const spec of schedule) {
    if (spec.target !== "*" && spec.target !== ctx.tool) continue;
    if (spec.on_call !== undefined && spec.on_call !== ctx.callIndex) continue;
    if (spec.when && !matchesWhen(spec.when, ctx.args)) continue;
    if (spec.probability !== undefined) {
      const roll = seededRoll(ctx.seed, ctx.trialIndex, ctx.tool, ctx.callIndex);
      if (roll >= spec.probability) continue;
    }
    return spec;
  }
  return undefined;
}
