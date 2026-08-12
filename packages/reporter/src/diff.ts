// Regression diff between two reports (base branch vs head), the input to
// the CI PR comment. Compares at scenario-status granularity rather than
// matching individual trials 1:1 — trial seeds differ between separate `run`
// invocations, so "did this scenario's status get worse" is the only
// comparison that's meaningful across two independent runs.

import type { Report, ScenarioReportEntry } from "./types";

export interface ScenarioDelta {
  scenarioId: string;
  baseStatus?: ScenarioReportEntry["status"];
  headStatus?: ScenarioReportEntry["status"];
}

export interface RegressionDiff {
  gateChanged: boolean;
  baseGatePassed: boolean;
  headGatePassed: boolean;
  regressions: ScenarioDelta[]; // got worse or newly critical
  fixes: ScenarioDelta[]; // got better
  newCriticalFindings: Report["criticalFindings"];
  resolvedCriticalFindings: Report["criticalFindings"];
  safetyScoreDelta: number;
}

const STATUS_RANK: Record<ScenarioReportEntry["status"], number> = {
  PASS: 0,
  FLAKY: 1,
  FAIL: 2,
  INVALID: 2,
};

function findingKey(f: { scenarioId: string; verdict: string }): string {
  return `${f.scenarioId}::${f.verdict}`;
}

export function diffReports(base: Report, head: Report): RegressionDiff {
  const baseById = new Map(base.scenarios.map((s) => [s.scenarioId, s]));
  const headById = new Map(head.scenarios.map((s) => [s.scenarioId, s]));
  const allIds = new Set([...baseById.keys(), ...headById.keys()]);

  const regressions: ScenarioDelta[] = [];
  const fixes: ScenarioDelta[] = [];

  for (const id of allIds) {
    const b = baseById.get(id);
    const h = headById.get(id);
    // A scenario present on only one side was added or removed, not regressed
    // or fixed — comparing its status against a nonexistent baseline/head
    // would flag every newly-added passing scenario as a false regression.
    if (!b || !h) continue;
    const baseRank = STATUS_RANK[b.status];
    const headRank = STATUS_RANK[h.status];
    if (headRank > baseRank) {
      regressions.push({ scenarioId: id, baseStatus: b.status, headStatus: h.status });
    } else if (headRank < baseRank) {
      fixes.push({ scenarioId: id, baseStatus: b.status, headStatus: h.status });
    }
  }

  const baseFindingKeys = new Set(base.criticalFindings.map(findingKey));
  const headFindingKeys = new Set(head.criticalFindings.map(findingKey));

  return {
    gateChanged: base.gate.passed !== head.gate.passed,
    baseGatePassed: base.gate.passed,
    headGatePassed: head.gate.passed,
    regressions: regressions.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId)),
    fixes: fixes.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId)),
    newCriticalFindings: head.criticalFindings.filter((f) => !baseFindingKeys.has(findingKey(f))),
    resolvedCriticalFindings: base.criticalFindings.filter((f) => !headFindingKeys.has(findingKey(f))),
    safetyScoreDelta: head.safety.score - base.safety.score,
  };
}

export function renderDiffMarkdown(diff: RegressionDiff): string {
  const lines: string[] = [];
  lines.push(`### Chaosline: resilience diff vs base`, "");

  if (diff.regressions.length === 0 && diff.newCriticalFindings.length === 0) {
    lines.push(`No resilience regressions detected.`, "");
  } else {
    lines.push(`**${diff.regressions.length} scenario(s) regressed:**`, "");
    for (const r of diff.regressions) {
      lines.push(`- \`${r.scenarioId}\`: ${r.baseStatus ?? "n/a"} → ${r.headStatus ?? "n/a"}`);
    }
    lines.push("");
  }

  if (diff.newCriticalFindings.length > 0) {
    lines.push(`**New critical findings (${diff.newCriticalFindings.length}):**`, "");
    for (const f of diff.newCriticalFindings) {
      lines.push(
        `- **${f.verdict}** \`${f.scenarioId}\` trial ${f.trialIndex}: ${f.reason}` +
          (f.reproBundlePath ? ` (repro: \`${f.reproBundlePath}\`)` : "")
      );
    }
    lines.push("");
  }

  if (diff.fixes.length > 0) {
    lines.push(`Improved: ${diff.fixes.map((f) => `\`${f.scenarioId}\``).join(", ")}`, "");
  }

  if (diff.resolvedCriticalFindings.length > 0) {
    lines.push(`Resolved critical findings: ${diff.resolvedCriticalFindings.length}`, "");
  }

  lines.push(
    `Gate: ${diff.baseGatePassed ? "PASS" : "FAIL"} → ${diff.headGatePassed ? "PASS" : "FAIL"}` +
      (diff.gateChanged ? " (changed)" : ""),
    `Safety score delta: ${diff.safetyScoreDelta >= 0 ? "+" : ""}${diff.safetyScoreDelta.toFixed(1)}`
  );

  return lines.join("\n") + "\n";
}
