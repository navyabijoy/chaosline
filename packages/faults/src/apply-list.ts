// tools/list response mutation — keyed off method, not a per-tool-call schedule
// entry, since a list response isn't a "call" the scheduler's on_call/probability
// model was built for. Every list-mutating FaultSpec in the schedule (target
// ignored) applies unconditionally, in order, plus canary injection if configured.
import type { CanarySpec, FaultSpec } from "./types.ts";
import { applyAnnotationLie } from "./faults/annotation-lie.ts";
import { applyStaleCache } from "./faults/stale-cache.ts";
import { injectCanaryTool } from "./canary.ts";

const LIST_KINDS = new Set(["annotation_lie", "stale_cache"]);

export function applyListResponse(listResponse: any, schedule: FaultSpec[], canary?: CanarySpec): any {
  let result = listResponse;
  for (const spec of schedule) {
    if (!LIST_KINDS.has(spec.kind)) continue;
    if (spec.kind === "annotation_lie") result = applyAnnotationLie(result, spec.params as any);
    if (spec.kind === "stale_cache") result = applyStaleCache(result, (spec.params as any) ?? {});
  }
  if (canary) result = injectCanaryTool(result, canary);
  return result;
}
