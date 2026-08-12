// Single-file HTML scorecard. No external assets, no server — open the file
// directly in a browser. All report strings are escaped: `reason` fields can
// contain redacted-but-otherwise-arbitrary agent output, so treat every value
// as untrusted text, not markup.

import type { Report } from "./types.ts";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const VERDICT_COLOR: Record<string, string> = {
  HARMFUL_ACTION: "#b91c1c",
  SILENT_FAILURE: "#b91c1c",
  UNSAFE_FAILURE: "#c2410c",
  DEGRADED: "#a16207",
  SAFE_FAILURE: "#15803d",
  SAFE_SUCCESS: "#15803d",
};

function badge(verdict: string): string {
  const color = VERDICT_COLOR[verdict] ?? "#374151";
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-family:monospace">${esc(verdict)}</span>`;
}

export function renderHtml(report: Report): string {
  const date = new Date(report.generatedAt).toISOString();

  const criticalRows =
    report.criticalFindings.length === 0
      ? `<p>None.</p>`
      : `<ul>${report.criticalFindings
          .map(
            (f) =>
              `<li>${badge(f.verdict)} <code>${esc(f.scenarioId)}</code> trial ${f.trialIndex}: ${esc(f.reason)}${
                f.reproBundlePath ? ` (repro: <code>${esc(f.reproBundlePath)}</code>)` : ""
              }</li>`
          )
          .join("")}</ul>`;

  const scenarioRows = report.scenarios
    .map(
      (s) =>
        `<tr><td><code>${esc(s.scenarioId)}</code></td><td>${esc(s.world)}</td><td>${esc(s.status)}</td><td>${(
          s.passRate * 100
        ).toFixed(0)}% (${s.passed}/${s.totalTrials})</td><td>${s.baselineVerdict ? badge(s.baselineVerdict) : "n/a"}</td></tr>`
    )
    .join("");

  const verdictRows = Object.entries(report.verdictDistribution)
    .filter(([, count]) => count > 0)
    .map(([verdict, count]) => `<tr><td>${badge(verdict)}</td><td>${count}</td></tr>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Chaosline report</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; color: #1f2937; }
  h1, h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  td, th { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; font-size: 14px; }
  code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
  .gate-pass { color: #15803d; font-weight: bold; }
  .gate-fail { color: #b91c1c; font-weight: bold; }
</style>
</head>
<body>
<h1>Chaosline report</h1>
<p>Generated ${esc(date)}.</p>

<h2>Gate</h2>
<p class="${report.gate.passed ? "gate-pass" : "gate-fail"}">${report.gate.passed ? "PASS" : "FAIL"}</p>
<p>${esc(report.gate.reason)}</p>

<h2>Critical findings (${report.criticalFindings.length})</h2>
${criticalRows}

<h2>Scenarios</h2>
<table>
<tr><th>Scenario</th><th>World</th><th>Status</th><th>Pass rate</th><th>Baseline</th></tr>
${scenarioRows}
</table>

<h2>Verdict distribution</h2>
<table>
<tr><th>Verdict</th><th>Count</th></tr>
${verdictRows}
</table>

<h2>Cost and latency vs baseline</h2>
<ul>
<li>Fault-condition spend: $${report.cost.faultUsd.toFixed(4)} (baseline: $${report.cost.baselineUsd.toFixed(4)})</li>
<li>Fault-condition avg latency: ${Math.round(report.cost.avgLatencyMs)}ms (baseline: ${Math.round(report.cost.baselineAvgLatencyMs)}ms)</li>
</ul>

<h2>Safety score</h2>
<p><strong>${report.safety.score.toFixed(1)} / 100</strong> — weighted by verdict severity, not scenario count. For trend tracking only.</p>

</body>
</html>
`;
}
