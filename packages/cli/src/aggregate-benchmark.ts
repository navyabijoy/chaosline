import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { buildBenchmarkReport, renderBenchmarkMarkdown } from "@chaosline/reporter";
import type { AgentReportEntry, Report } from "@chaosline/reporter";

export async function aggregateBenchmarkReports(inputDir: string, outputDir: string): Promise<void> {
  mkdirSync(outputDir, { recursive: true });

  const scenarios = new Map<string, Map<string, Report>>();

  // Find all scenario subdirectories
  const entries = await readdir(inputDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const scenarioPath = join(inputDir, entry.name);
    const scenarioName = entry.name.replace(/_/g, "/");

    // For each scenario, find agent reports
    const scenarioSubdirs = await readdir(scenarioPath, { withFileTypes: true }).catch(() => []);

    for (const subentry of scenarioSubdirs) {
      if (!subentry.isDirectory()) continue;

      const agentName = subentry.name;
      const reportPath = join(scenarioPath, subentry.name, "report.json");

      try {
        const reportData = await readFile(reportPath, "utf8");
        const report = JSON.parse(reportData);

        if (!scenarios.has(scenarioName)) {
          scenarios.set(scenarioName, new Map());
        }
        scenarios.get(scenarioName)!.set(agentName, report);
      } catch (err) {
        // Skip missing or invalid reports
      }
    }
  }

  // Build unified benchmark report with all scenarios and agents
  const agents = new Set<string>();
  const allScenarios = Array.from(scenarios.keys()).sort();

  // Collect all unique agent names
  for (const agentMap of scenarios.values()) {
    for (const agentName of agentMap.keys()) {
      agents.add(agentName);
    }
  }

  const agentList = Array.from(agents).sort();
  const agentReports: AgentReportEntry[] = [];

  // Build agent entries with a synthetic combined report
  for (const agentName of agentList) {
    const agentReportsPerScenario = Array.from(scenarios.values())
      .map((agentMap) => agentMap.get(agentName))
      .filter((r): r is Report => !!r);

    if (agentReportsPerScenario.length === 0) continue;

    // Use the first report as a template and combine scenario data
    const baseReport = agentReportsPerScenario[0];
    const allScenarioEntries = agentReportsPerScenario.flatMap((r) => r.scenarios);
    const allCriticalFindings = agentReportsPerScenario.flatMap((r) => r.criticalFindings);

    // Aggregate verdict distribution
    const verdictDist: Record<string, number> = {
      HARMFUL_ACTION: 0,
      SILENT_FAILURE: 0,
      UNSAFE_FAILURE: 0,
      DEGRADED: 0,
      SAFE_FAILURE: 0,
      SAFE_SUCCESS: 0,
    };

    for (const report of agentReportsPerScenario) {
      for (const [verdict, count] of Object.entries(report.verdictDistribution)) {
        verdictDist[verdict] = (verdictDist[verdict] || 0) + count;
      }
    }

    // Calculate safety score (worst scenario wins)
    let minSafety = 100;
    for (const report of agentReportsPerScenario) {
      minSafety = Math.min(minSafety, report.safety.score);
    }

    const combinedReport: Report = {
      schemaVersion: 1 as const,
      generatedAt: Date.now(),
      gate: {
        passed: allCriticalFindings.length === 0,
        reason: allCriticalFindings.length === 0 ? "no critical findings" : `${allCriticalFindings.length} critical findings`,
      },
      scenarios: allScenarioEntries,
      criticalFindings: allCriticalFindings,
      verdictDistribution: verdictDist as Record<string, number>,
      cost: agentReportsPerScenario.reduce(
        (acc, r) => ({
          totalUsd: acc.totalUsd + r.cost.totalUsd,
          baselineUsd: acc.baselineUsd + r.cost.baselineUsd,
          faultUsd: acc.faultUsd + r.cost.faultUsd,
          avgLatencyMs: acc.avgLatencyMs + r.cost.avgLatencyMs,
          baselineAvgLatencyMs: acc.baselineAvgLatencyMs + r.cost.baselineAvgLatencyMs,
        }),
        { totalUsd: 0, baselineUsd: 0, faultUsd: 0, avgLatencyMs: 0, baselineAvgLatencyMs: 0 }
      ),
      safety: { score: minSafety, weights: baseReport.safety.weights },
    };

    agentReports.push({
      name: agentName,
      framework: agentName.split("-")[0],
      frameworkVersion: "unknown",
      report: combinedReport,
    });
  }

  // Build and write benchmark report
  const benchmarkReport = buildBenchmarkReport(agentReports, {
    date: new Date().toISOString(),
    tags: allScenarios,
    trialCount: 2,
  });

  const markdownReport = renderBenchmarkMarkdown(benchmarkReport);

  writeFileSync(join(outputDir, "benchmark-report.json"), JSON.stringify(benchmarkReport, null, 2));
  writeFileSync(join(outputDir, "benchmark-report.md"), markdownReport);

  console.log(`Aggregated report written to ${outputDir}/`);
  console.log(`  Scenarios: ${allScenarios.length}`);
  console.log(`  Agents: ${agentList.length}`);
}
