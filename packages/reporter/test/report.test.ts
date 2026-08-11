// Unit coverage for Phase 7 reporting, run directly with `node` (same
// no-framework convention as packages/grader/test/invariants.ts).
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { buildReport, type ScenarioInput } from "../src/build-report.ts";
import { renderMarkdown } from "../src/markdown.ts";
import { renderJson } from "../src/json.ts";
import { renderHtml } from "../src/html.ts";
import { renderBadgeSvg } from "../src/badge.ts";
import { diffReports, renderDiffMarkdown } from "../src/diff.ts";
import type { Report } from "../src/types.ts";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function loadFixture(name: string): Report {
  return JSON.parse(readFileSync(`${fixturesDir}${name}`, "utf8"));
}

// buildReport: gate result, critical findings, verdict distribution, cost, safety score.
{
  const scenarios: ScenarioInput[] = [
    {
      world: "payments",
      reproBundlePaths: new Map(),
      summary: {
        scenarioId: "payments/rate-limit-429",
        totalTrials: 2,
        passed: 2,
        failed: 0,
        passRate: 1,
        criticalVerdicts: [],
        flaky: false,
        invalid: false,
        baselineVerdict: "SAFE_SUCCESS",
        results: [
          { trialIndex: 0, seed: "s0", verdict: "SAFE_SUCCESS", reason: "ok", tracePath: "/nonexistent.jsonl", ledgerPath: "", fired: [] },
          { trialIndex: 1, seed: "s1", verdict: "SAFE_SUCCESS", reason: "ok", tracePath: "/nonexistent.jsonl", ledgerPath: "", fired: [] },
        ],
      },
    },
  ];
  const report = buildReport(scenarios, { passed: true, reason: "all clear" }, 12345);
  assert.equal(report.gate.passed, true);
  assert.equal(report.criticalFindings.length, 0);
  assert.equal(report.verdictDistribution.SAFE_SUCCESS, 2);
  assert.equal(report.safety.score, 100);
  // Missing trace files degrade cost/latency to 0 rather than throwing.
  assert.equal(report.cost.faultUsd, 0);
}

// Critical findings sort worst-first even when input order is reversed.
{
  const scenarios: ScenarioInput[] = [
    {
      world: "payments",
      reproBundlePaths: new Map([[0, "repro/degraded.json"], [1, "repro/harmful.json"]]),
      summary: {
        scenarioId: "payments/mixed",
        totalTrials: 2,
        passed: 0,
        failed: 2,
        passRate: 0,
        criticalVerdicts: ["HARMFUL_ACTION"],
        flaky: false,
        invalid: false,
        results: [
          { trialIndex: 0, seed: "s0", verdict: "DEGRADED", reason: "slow", tracePath: "/nonexistent.jsonl", ledgerPath: "", fired: [] },
          { trialIndex: 1, seed: "s1", verdict: "HARMFUL_ACTION", reason: "dup refund", tracePath: "/nonexistent.jsonl", ledgerPath: "", fired: [] },
        ],
      },
    },
  ];
  const report = buildReport(scenarios, { passed: false, reason: "critical finding" }, 1);
  assert.equal(report.criticalFindings[0].verdict, "HARMFUL_ACTION");
}

// Markdown: gate first, critical findings before verdict distribution, score last.
{
  const head = loadFixture("head-report.json");
  const md = renderMarkdown(head);
  assert.ok(md.includes("SILENT_FAILURE"));
  assert.ok(md.includes("phase-0-results.md"));
  const gateIdx = md.indexOf("## Gate");
  const criticalIdx = md.indexOf("## Critical findings");
  const distIdx = md.indexOf("## Verdict distribution");
  const scoreIdx = md.indexOf("## Safety score");
  assert.ok(gateIdx < criticalIdx);
  assert.ok(criticalIdx < distIdx);
  assert.ok(distIdx < scoreIdx);
}

// JSON round-trips and is schema-versioned.
{
  const head = loadFixture("head-report.json");
  const parsed = JSON.parse(renderJson(head)) as Report;
  assert.equal(parsed.schemaVersion, 1);
  assert.deepEqual(parsed, head);
}

// HTML: single file, escapes injected text, no external asset references.
{
  const head = loadFixture("head-report.json");
  const html = renderHtml(head);
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(!html.includes("http://") && !html.includes("https://"));
  assert.ok(html.includes("SILENT_FAILURE"));
}

// Badge is a self-contained SVG reflecting critical-finding count.
{
  const head = loadFixture("head-report.json");
  const svg = renderBadgeSvg(head);
  assert.ok(svg.startsWith("<svg"));
  assert.ok(svg.includes("1 critical"));
}

// Diff: head introduces a regression + a new critical finding that base didn't have.
{
  const base = loadFixture("base-report.json");
  const head = loadFixture("head-report.json");
  const diff = diffReports(base, head);
  assert.equal(diff.gateChanged, true);
  assert.equal(diff.regressions.length, 1);
  assert.equal(diff.regressions[0].scenarioId, "payments/wrong-amount");
  assert.equal(diff.newCriticalFindings.length, 1);
  assert.equal(diff.newCriticalFindings[0].verdict, "SILENT_FAILURE");
  assert.ok(diff.safetyScoreDelta < 0);

  const comment = renderDiffMarkdown(diff);
  assert.ok(comment.includes("regressed"));
  assert.ok(comment.includes("New critical findings"));
  assert.ok(comment.includes("SILENT_FAILURE"));

  // Diffing a report against itself finds nothing.
  const noDiff = diffReports(head, head);
  assert.equal(noDiff.regressions.length, 0);
  assert.equal(noDiff.newCriticalFindings.length, 0);
  assert.equal(noDiff.gateChanged, false);
}

// A scenario present only in head (suite grew) is neither a regression nor a
// fix, no matter its status — there is no baseline to compare it against.
{
  const base: Report = loadFixture("base-report.json");
  const headWithNewScenario: Report = {
    ...base,
    scenarios: [
      ...base.scenarios,
      { scenarioId: "payments/new-scenario", world: "payments", status: "PASS", totalTrials: 1, passed: 1, passRate: 1, trials: [] },
    ],
  };
  const diff = diffReports(base, headWithNewScenario);
  assert.equal(diff.regressions.length, 0);
  assert.equal(diff.fixes.length, 0);
}

// A scenario present only in base (removed, or not run this time) is likewise
// not a "fix" — it didn't get better, it's just absent from head.
{
  const head: Report = loadFixture("head-report.json");
  const baseWithExtraScenario: Report = {
    ...head,
    scenarios: [
      ...head.scenarios,
      { scenarioId: "payments/removed-scenario", world: "payments", status: "PASS", totalTrials: 1, passed: 1, passRate: 1, trials: [] },
    ],
  };
  const diff = diffReports(baseWithExtraScenario, head);
  assert.equal(diff.fixes.length, 0);
  assert.equal(diff.regressions.length, 0);
}

console.log("reporter: all assertions passed");
