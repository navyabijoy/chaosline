import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildBenchmarkReport, renderBenchmarkMarkdown } from "@chaosline/reporter";
import type { Report, AgentReportEntry, BenchmarkReport } from "@chaosline/reporter";

export interface BenchmarkRunInput {
  scenarioId: string;
  agents: Array<{
    name: string;
    framework: string;
    frameworkVersion: string;
    command: string;
    args: string[];
  }>;
  reportOutputDir?: string;
  modelUpstream?: string;
  budgetUsd?: number;
  nTrials?: number;
  passRate?: number;
}

async function runAgentScenario(agentName: string, cmd: string, args: string[], scenarioId: string, opts: { modelUpstream?: string; budgetUsd?: number; nTrials?: number; passRate?: number; reportDir?: string }): Promise<Report> {
  const reportDir = opts.reportDir || `.chaosline/benchmark-${agentName}-${Date.now()}`;
  const agentArgs = [cmd, ...args];

  const cliArgs = [
    "run",
    "--scenario",
    scenarioId,
    "--report-dir",
    reportDir,
    ...(opts.nTrials ? ["--trials", String(opts.nTrials)] : []),
    ...(opts.passRate ? ["--pass-rate", String(opts.passRate)] : []),
    ...(opts.modelUpstream ? ["--model-upstream", opts.modelUpstream] : []),
  ];

  if (opts.budgetUsd) {
    process.env.CHAOSLINE_BUDGET_USD = String(opts.budgetUsd);
  }

  console.log(`[benchmark] running ${agentName}: chaosline ${cliArgs.join(" ")} -- ${agentArgs.join(" ")}`);

  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn("node", [process.argv[1], ...cliArgs, "--", ...agentArgs], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    console.warn(`[benchmark] agent ${agentName} exited with code ${exitCode}`);
  }

  const reportPath = `${reportDir}/report.json`;
  let report: Report;
  try {
    const reportText = readFileSync(reportPath, "utf8");
    report = JSON.parse(reportText);
  } catch (err) {
    throw new Error(`Failed to read report for ${agentName} from ${reportPath}: ${err instanceof Error ? err.message : String(err)}`);
  }

  return report;
}

export async function runBenchmark(input: BenchmarkRunInput): Promise<BenchmarkReport> {
  const reportDir = input.reportOutputDir || `.chaosline/benchmark-${Date.now()}`;
  const agentReports: AgentReportEntry[] = [];

  for (const agent of input.agents) {
    const report = await runAgentScenario(agent.name, agent.command, agent.args, input.scenarioId, {
      modelUpstream: input.modelUpstream,
      budgetUsd: input.budgetUsd,
      nTrials: input.nTrials,
      passRate: input.passRate,
      reportDir: `${reportDir}/${agent.name}`,
    });

    agentReports.push({
      name: agent.name,
      framework: agent.framework,
      frameworkVersion: agent.frameworkVersion,
      report,
    });
  }

  const benchmarkReport = buildBenchmarkReport(agentReports, {
    date: new Date().toISOString(),
    tags: [input.scenarioId],
    trialCount: input.nTrials,
  });

  const reportJsonPath = `${reportDir}/benchmark-report.json`;
  const reportMarkdownPath = `${reportDir}/benchmark-report.md`;

  writeFileSync(reportJsonPath, JSON.stringify(benchmarkReport, null, 2));
  writeFileSync(reportMarkdownPath, renderBenchmarkMarkdown(benchmarkReport));

  console.log(`\n[benchmark] report written to ${reportDir}/`);
  console.log(`[benchmark] JSON: ${reportJsonPath}`);
  console.log(`[benchmark] Markdown: ${reportMarkdownPath}`);

  return benchmarkReport;
}
