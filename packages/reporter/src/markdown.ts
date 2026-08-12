// Markdown scorecard. Section order follows docs/04-grading-and-determinism.md's
// "Report shape" verbatim: gate result, critical findings (top of the report),
// verdict distribution, cost/latency impact, safety score last.

import type { Report } from "./types";

function fmtUsd(n: number): string {
  return `$${n.toFixed(4)}`;
}

function fmtMs(n: number): string {
  return `${Math.round(n)}ms`;
}

export function renderMarkdown(report: Report): string {
  const lines: string[] = [];
  const date = new Date(report.generatedAt).toISOString();

  lines.push(`# Chaosline report`, "", `Generated ${date}.`, "");

  lines.push(`## Gate: ${report.gate.passed ? "PASS" : "FAIL"}`, "", report.gate.reason, "");

  lines.push(`## Critical findings (${report.criticalFindings.length})`, "");
  if (report.criticalFindings.length === 0) {
    lines.push("None.", "");
  } else {
    for (const f of report.criticalFindings) {
      lines.push(
        `- **${f.verdict}** — \`${f.scenarioId}\` trial ${f.trialIndex}: ${f.reason}` +
          (f.reproBundlePath ? ` (repro: \`${f.reproBundlePath}\`)` : "")
      );
    }
    lines.push("");
  }

  lines.push(`## Scenarios`, "");
  lines.push("| Scenario | World | Status | Pass rate | Baseline |", "|---|---|---|---|---|");
  for (const s of report.scenarios) {
    lines.push(
      `| \`${s.scenarioId}\` | ${s.world} | ${s.status} | ${(s.passRate * 100).toFixed(0)}% (${s.passed}/${s.totalTrials}) | ${s.baselineVerdict ?? "n/a"} |`
    );
  }
  lines.push("");

  lines.push(`## Verdict distribution`, "");
  lines.push("| Verdict | Count |", "|---|---|");
  for (const [verdict, count] of Object.entries(report.verdictDistribution)) {
    if (count > 0) lines.push(`| ${verdict} | ${count} |`);
  }
  lines.push("");

  lines.push(`## Cost and latency vs baseline`, "");
  lines.push(
    `- Fault-condition spend: ${fmtUsd(report.cost.faultUsd)} (baseline: ${fmtUsd(report.cost.baselineUsd)})`,
    `- Fault-condition avg latency: ${fmtMs(report.cost.avgLatencyMs)} (baseline: ${fmtMs(report.cost.baselineAvgLatencyMs)})`,
    ""
  );

  lines.push(`## Safety score`, "");
  lines.push(
    `**${report.safety.score.toFixed(1)} / 100** — weighted by verdict severity, not scenario count. For trend tracking only; the gate result and critical findings above are the actual product.`,
    "",
    "Weights: " +
      Object.entries(report.safety.weights)
        .map(([v, w]) => `${v}=${w}`)
        .join(", ")
  );

  return lines.join("\n") + "\n";
}
