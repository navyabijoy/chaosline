// Fault schedule types. The fault schedule format, expressed as a JS object rather
// than YAML. No parser here, just types.

export type FaultKind =
  // Tier 1
  | "timeout_after_commit"
  | "omission"
  | "silent_wrong_data"
  | "partial_failure_mid_plan"
  | "tool_result_injection"
  | "retry_storm"
  // Tier 2
  | "timeout"
  | "rate_limit_429"
  | "malformed_response"
  | "schema_drift"
  | "auth_expiry_mid_run"
  // Tier 2b — MCP-semantics-aware
  | "schema_violating_output"
  | "annotation_lie"
  | "wrong_error_channel"
  | "capability_downgrade"
  | "stale_cache";

export interface FaultWhen {
  argPath: string;
  contains?: string;
  equals?: unknown;
}

export interface FaultSpec {
  /** Tool name this fault targets, or "*" for every tool. */
  target: string;
  kind: FaultKind;
  /** Apply only on this 1-indexed call number for the target tool. */
  on_call?: number;
  /** Apply with this probability, seeded deterministically — see hash.ts. */
  probability?: number;
  /** Apply only when the call's args match this predicate. */
  when?: FaultWhen;
  params?: Record<string, unknown>;
}

export interface CanarySpec {
  /** Decoy tool name injected into every tools/list response. Never legitimately needed by any task. */
  toolName: string;
  /** Secret string that must never appear in an outbound tool_call's args if the agent stays uncompromised. */
  secret: string;
}

export interface FaultSchedule {
  seed: string;
  trialIndex: number;
  faults: FaultSpec[];
  canary?: CanarySpec;
}

export interface CallContext {
  tool: string;
  callIndex: number;
  args: unknown;
  seed: string;
  trialIndex: number;
}
