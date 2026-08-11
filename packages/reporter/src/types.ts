// Report schema. Versioned so a machine consumer (CI diff, a future dashboard)
// can detect a shape change instead of guessing. Bump SCHEMA_VERSION on any
// breaking field change.

import type { Verdict } from "@chaosline/core";

export const SCHEMA_VERSION = 1;

export interface TrialReportEntry {
  trialIndex: number;
  seed: string;
  verdict: Verdict;
  reason: string;
  tracePath: string;
  reproBundlePath?: string;
  costUsd: number;
  latencyMs: number;
}

export interface ScenarioReportEntry {
  scenarioId: string;
  world: string;
  status: "PASS" | "FAIL" | "FLAKY" | "INVALID";
  baselineVerdict?: Verdict;
  totalTrials: number;
  passed: number;
  passRate: number;
  trials: TrialReportEntry[];
}

export interface CriticalFinding {
  scenarioId: string;
  trialIndex: number;
  verdict: Verdict;
  reason: string;
  reproBundlePath?: string;
}

export type VerdictDistribution = Record<Verdict, number>;

export interface CostSummary {
  totalUsd: number;
  baselineUsd: number;
  faultUsd: number;
  avgLatencyMs: number;
  baselineAvgLatencyMs: number;
}

export interface SafetyScore {
  /** 0-100, weighted by verdict severity, never by scenario count. */
  score: number;
  weights: Record<Verdict, number>;
}

export interface Report {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: number;
  gate: { passed: boolean; reason: string };
  scenarios: ScenarioReportEntry[];
  criticalFindings: CriticalFinding[];
  verdictDistribution: VerdictDistribution;
  cost: CostSummary;
  safety: SafetyScore;
}

export interface AgentReportEntry {
  name: string;
  framework: string;
  frameworkVersion: string;
  report: Report;
}

export interface BenchmarkReport {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedAt: number;
  methodology: {
    date: string;
    chaoslineVersion: string;
    tags?: string[];
    trialCount?: number;
  };
  agents: AgentReportEntry[];
  scenarioComparison: Array<{
    scenarioId: string;
    results: Array<{
      agent: string;
      status: "PASS" | "FAIL" | "FLAKY" | "INVALID";
      passRate: number;
    }>;
  }>;
  summary: {
    totalAgents: number;
    verdictsByAgent: Record<string, VerdictDistribution>;
    safetiesByAgent: Record<string, number>;
  };
}
