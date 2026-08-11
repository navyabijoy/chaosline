import type { Verdict } from "@chaosline/core";
import type { CanarySpec, FaultSpec } from "@chaosline/faults";
import type { CustomServerCommand, WorldKey } from "@chaosline/scenarios";

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
  world: WorldKey;
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
  customServerCommand?: CustomServerCommand;
  demoTaskPrompt?: string;
  tracePath: string;
  /** The world's state snapshot path — not necessarily a payments ledger. */
  ledgerPath: string;
  timestamp: number;
}
