import type { Verdict } from "@chaosline/core";
import type { CanarySpec, FaultSpec } from "@chaosline/faults";

/**
 * Everything needed to re-run a single failing trial: the fault schedule and
 * seed that produced it, the agent command, and the caps it ran under. Written
 * for critical verdicts only, and redacted before it reaches disk.
 */
export interface ReproBundle {
  scenarioId: string;
  trialIndex: number;
  seed: string;
  verdict: Verdict;
  reason: string;
  faultSchedule: { faults: FaultSpec[]; canary?: CanarySpec };
  toolName: string;
  agentCommand: string;
  agentArgs: string[];
  budgetUsd: number;
  modelUpstream: string;
  wallClockCapMs: number;
  stepCap: number;
  maxRetries: number;
  derivedFrom?: Record<string, Array<string | number>>;
  tracePath: string;
  ledgerPath: string;
  timestamp: number;
}
