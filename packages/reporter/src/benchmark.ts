import type { BenchmarkReport, AgentReportEntry, VerdictDistribution } from "./types.ts";
import type { Report } from "./types.ts";

export function buildBenchmarkReport(agents: AgentReportEntry[], options?: { date?: string; chaoslineVersion?: string; tags?: string[]; trialCount?: number }): BenchmarkReport {
  const generatedAt = Date.now();
  const date = options?.date ?? new Date(generatedAt).toISOString();
  const chaoslineVersion = options?.chaoslineVersion ?? "0.1.0-phase8";

  const scenarioMap = new Map<string, Array<{ agent: string; status: "PASS" | "FAIL" | "FLAKY" | "INVALID"; passRate: number }>>();

  for (const agentEntry of agents) {
    for (const scenario of agentEntry.report.scenarios) {
      if (!scenarioMap.has(scenario.scenarioId)) {
        scenarioMap.set(scenario.scenarioId, []);
      }
      scenarioMap.get(scenario.scenarioId)!.push({
        agent: agentEntry.name,
        status: scenario.status,
        passRate: scenario.passRate,
      });
    }
  }

  const verdictsByAgent: Record<string, VerdictDistribution> = {};
  const safetiesByAgent: Record<string, number> = {};

  for (const agentEntry of agents) {
    verdictsByAgent[agentEntry.name] = agentEntry.report.verdictDistribution;
    safetiesByAgent[agentEntry.name] = agentEntry.report.safety.score;
  }

  return {
    schemaVersion: 1 as const,
    generatedAt,
    methodology: {
      date,
      chaoslineVersion,
      tags: options?.tags,
      trialCount: options?.trialCount,
    },
    agents,
    scenarioComparison: Array.from(scenarioMap.entries()).map(([scenarioId, results]) => ({
      scenarioId,
      results,
    })),
    summary: {
      totalAgents: agents.length,
      verdictsByAgent,
      safetiesByAgent,
    },
  };
}

export function renderBenchmarkMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [];

  lines.push("# Chaosline Benchmark Report");
  lines.push("");
  lines.push(`Generated: ${report.methodology.date}`);
  lines.push(`Framework versions tested: ${report.agents.map((a) => `${a.framework} ${a.frameworkVersion}`).join(", ")}`);
  lines.push("");

  lines.push("## Agent Summary");
  lines.push("");
  lines.push("| Agent | Framework | Safety Score |");
  lines.push("|-------|-----------|--------------|");
  for (const agent of report.agents) {
    const safety = report.summary.safetiesByAgent[agent.name];
    lines.push(`| ${agent.name} | ${agent.framework} ${agent.frameworkVersion} | ${safety.toFixed(1)}/100 |`);
  }
  lines.push("");

  lines.push("## Scenario Results");
  lines.push("");
  lines.push("| Scenario | " + report.agents.map((a) => a.name).join(" | ") + " |");
  lines.push("|----------|" + report.agents.map(() => "---|").join(""));

  for (const comp of report.scenarioComparison) {
    const cells: string[] = [comp.scenarioId];
    for (const agent of report.agents) {
      const result = comp.results.find((r) => r.agent === agent.name);
      const status = result ? `${result.status} (${(result.passRate * 100).toFixed(0)}%)` : "N/A";
      cells.push(status);
    }
    lines.push("| " + cells.join(" | ") + " |");
  }
  lines.push("");

  lines.push("## Methodology");
  lines.push(`- Tested: ${report.agents.map((a) => a.framework + " " + a.frameworkVersion).join(", ")}`);
  lines.push(`- Date: ${report.methodology.date}`);
  lines.push(`- Chaosline: ${report.methodology.chaoslineVersion}`);
  if (report.methodology.tags) lines.push(`- Tags: ${report.methodology.tags.join(", ")}`);
  if (report.methodology.trialCount) lines.push(`- Trials per scenario: ${report.methodology.trialCount}`);
  lines.push("");

  return lines.join("\n");
}
