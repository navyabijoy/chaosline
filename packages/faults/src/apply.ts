// Central dispatch: given a matched FaultSpec, decide what the shim should do.
// Three hook points, matching where each fault kind naturally lives:
//   - applyPreCall:      before the child ever sees the request. Short-circuits
//                        with a synthetic response, or drops entirely (pure hang).
//   - applyRequestMutation: forwards a mutated request to the child instead of the
//                        original — the child still runs, just sees a different call.
//   - applyPostCall:     after the child's real response comes back. Mutates it,
//                        drops it (hang after commit), or passes it through.
// tools/list mutation (annotation_lie, stale_cache, canary injection) is handled
// separately by the shim, since it's keyed off method, not tool name.
import type { CanarySpec, FaultSpec } from "./types.ts";
import { applyRateLimit429 } from "./faults/rate-limit-429.ts";
import { applyMalformedResponse } from "./faults/malformed-response.ts";
import { applyAuthExpiry } from "./faults/auth-expiry.ts";
import { applyRetryStorm } from "./faults/retry-storm.ts";
import { applyCapabilityDowngrade } from "./faults/capability-downgrade.ts";
import { applySchemaDrift } from "./faults/schema-drift.ts";
import { applyOmission } from "./faults/omission.ts";
import { applySilentWrongData } from "./faults/silent-wrong-data.ts";
import { applyPartialFailureMidPlan } from "./faults/partial-failure-mid-plan.ts";
import { applyToolResultInjection } from "./faults/tool-result-injection.ts";
import { applySchemaViolatingOutput } from "./faults/schema-violating-output.ts";
import { applyWrongErrorChannel } from "./faults/wrong-error-channel.ts";

export type PreCallOutcome =
  | { action: "short_circuit"; response: unknown }
  | { action: "drop" }
  | { action: "passthrough" };

export type PostCallOutcome = { action: "drop" } | { action: "mutate"; response: unknown } | { action: "passthrough" };

const PRE_CALL_KINDS = new Set(["rate_limit_429", "malformed_response", "auth_expiry_mid_run", "retry_storm", "timeout"]);
const REQUEST_MUTATION_KINDS = new Set(["capability_downgrade"]);
const POST_CALL_KINDS = new Set([
  "timeout_after_commit",
  "omission",
  "silent_wrong_data",
  "partial_failure_mid_plan",
  "tool_result_injection",
  "schema_drift",
  "schema_violating_output",
  "wrong_error_channel",
]);

export function isPreCallFault(spec: FaultSpec): boolean {
  return PRE_CALL_KINDS.has(spec.kind);
}

export function isRequestMutationFault(spec: FaultSpec): boolean {
  return REQUEST_MUTATION_KINDS.has(spec.kind);
}

export function isPostCallFault(spec: FaultSpec): boolean {
  return POST_CALL_KINDS.has(spec.kind);
}

export function applyPreCall(id: unknown, spec: FaultSpec): PreCallOutcome {
  const params = spec.params ?? {};
  switch (spec.kind) {
    case "rate_limit_429":
      return { action: "short_circuit", response: applyRateLimit429(id, params) };
    case "malformed_response":
      return { action: "short_circuit", response: applyMalformedResponse(id) };
    case "auth_expiry_mid_run":
      return { action: "short_circuit", response: applyAuthExpiry(id) };
    case "retry_storm":
      return { action: "short_circuit", response: applyRetryStorm(id) };
    case "timeout":
      return { action: "drop" };
    default:
      return { action: "passthrough" };
  }
}

export function applyRequestMutation(request: Record<string, unknown>, spec: FaultSpec): Record<string, unknown> {
  if (spec.kind === "capability_downgrade") return applyCapabilityDowngrade(request);
  return request;
}

export function applyPostCall(
  response: any,
  spec: FaultSpec,
  canary?: CanarySpec
): PostCallOutcome {
  const params = spec.params ?? {};
  switch (spec.kind) {
    case "timeout_after_commit":
      return { action: "drop" };
    case "omission":
      return { action: "mutate", response: applyOmission(response, params as any) };
    case "silent_wrong_data":
      return { action: "mutate", response: applySilentWrongData(response, params as any) };
    case "partial_failure_mid_plan":
      return { action: "mutate", response: applyPartialFailureMidPlan(response.id) };
    case "tool_result_injection":
      if (!canary) return { action: "passthrough" };
      return {
        action: "mutate",
        response: applyToolResultInjection(response, {
          canaryToolName: canary.toolName,
          canarySecret: canary.secret,
        }),
      };
    case "schema_drift":
      return { action: "mutate", response: applySchemaDrift(response, params as any) };
    case "schema_violating_output":
      return { action: "mutate", response: applySchemaViolatingOutput(response, params as any) };
    case "wrong_error_channel":
      return { action: "mutate", response: applyWrongErrorChannel(response) };
    default:
      return { action: "passthrough" };
  }
}
