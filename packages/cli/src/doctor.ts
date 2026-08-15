// `chaosline doctor` — validates the agent contract (does the command start,
// does it read MCP_CONFIG and make tool calls, is a provider key present)
// against one real baseline invocation, without running any fault trials.
// Meant to be the first thing a new user runs after `init`, so a broken
// contract is caught in one invocation instead of being discovered six trials
// deep with an identical, unexplained failure every time.
import {
  readTrace,
  type RunEvent,
} from "@chaosline/core";
import { ResponseCache } from "@chaosline/proxy-model";
import type { ScenarioTag } from "@chaosline/scenarios";
import {
  loadAllScenarios,
  runSingleTrial,
  WALL_CLOCK_CAP_MS,
  DEFAULT_BUDGET_USD,
  STEP_CAP,
  MAX_RETRIES,
} from "./run.ts";

interface CheckResult {
  label: string;
  ok: boolean;
  detail?: string;
}

function printCheck(c: CheckResult): void {
  console.log(`  [${c.ok ? "PASS" : "FAIL"}] ${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
}

export async function doctorCommand(args: string[]): Promise<void> {
  const scenarioIdx = args.indexOf("--scenario");
  const scenarioId = scenarioIdx !== -1 ? args[scenarioIdx + 1] : undefined;

  const tagIdx = args.indexOf("--tag");
  const tag = tagIdx !== -1 ? (args[tagIdx + 1] as ScenarioTag) : undefined;

  const scenariosDirIdx = args.indexOf("--scenarios-dir");
  const scenariosDirOverride = scenariosDirIdx !== -1 ? args[scenariosDirIdx + 1] : undefined;

  const modelUpstreamIdx = args.indexOf("--model-upstream");
  const modelUpstreamArg = modelUpstreamIdx !== -1 ? args[modelUpstreamIdx + 1] : undefined;

  const sepIdx = args.indexOf("--");
  if (sepIdx === -1) {
    console.error("chaosline doctor: expected `-- <agent command...>`");
    process.exit(2);
  }
  const [agentCmd, ...agentArgs] = args.slice(sepIdx + 1);
  if (!agentCmd) {
    console.error("chaosline doctor: no agent command given after `--`");
    process.exit(2);
  }

  const scenarios = loadAllScenarios(scenariosDirOverride);
  let scenario;
  if (scenarioId) {
    scenario = scenarios.get(scenarioId);
    if (!scenario) {
      console.error(`chaosline doctor: unknown scenario "${scenarioId}". Known: ${[...scenarios.keys()].join(", ")}`);
      process.exit(2);
    }
  } else if (tag) {
    scenario = [...scenarios.values()].find((s) => s.tags.includes(tag));
    if (!scenario) {
      console.error(`chaosline doctor: no scenario tagged "${tag}"`);
      process.exit(2);
    }
  } else {
    // No scenario given — pick any smoke-tagged one as a representative check.
    scenario = [...scenarios.values()].find((s) => s.tags.includes("smoke")) ?? [...scenarios.values()][0];
    if (!scenario) {
      console.error("chaosline doctor: no scenarios available to check against. Pass --scenario <id> or --tag <tag>.");
      process.exit(2);
    }
  }

  console.log(`chaosline doctor: checking agent contract against scenario "${scenario.id}" (baseline only, no faults)`);
  console.log(`chaosline doctor: spawning: ${agentCmd} ${agentArgs.join(" ")}`);

  // No default here on purpose: with no explicit override, the proxy routes
  // each request to the real host matching its detected provider (Anthropic
  // calls to api.anthropic.com, OpenAI calls to api.openai.com), so which key
  // is actually needed depends on which SDK the agent uses, not a fixed
  // upstream. Only warn up front when an explicit override is absent and
  // *neither* key is set — that agent is going to fail no matter which SDK it uses.
  const modelUpstream = modelUpstreamArg ?? process.env.CHAOSLINE_MODEL_UPSTREAM;
  const checks: CheckResult[] = [];

  if (modelUpstream) {
    checks.push({ label: `model upstream explicitly set to ${modelUpstream}`, ok: true });
  } else {
    const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);
    const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
    checks.push({
      label: "ANTHROPIC_API_KEY or OPENAI_API_KEY is set",
      ok: hasAnthropicKey || hasOpenAiKey,
      detail:
        hasAnthropicKey || hasOpenAiKey
          ? undefined
          : "neither is set — the proxy forwards Anthropic-shaped calls to api.anthropic.com and OpenAI-shaped calls to api.openai.com, using whichever key matches your agent's SDK",
    });
  }

  let spawnFailed: string | undefined;
  let trace: RunEvent[] = [];
  let verdict: string | undefined;
  let reason: string | undefined;
  let stderrTail: string | undefined;
  let exitCode: number | undefined;

  try {
    const result = await runSingleTrial({
      trialIndex: -1,
      seed: "doctor",
      scenarioId: scenario.id,
      world: scenario.world,
      faults: [],
      canary: scenario.canary,
      toolName: scenario.tool,
      agentCmd,
      agentArgs,
      budgetUsd: DEFAULT_BUDGET_USD,
      modelUpstream,
      wallClockCapMs: WALL_CLOCK_CAP_MS,
      stepCap: STEP_CAP,
      maxRetries: MAX_RETRIES,
      derivedFrom: scenario.derivedFrom,
      cache: new ResponseCache(),
      customServerCommand: scenario.customServerCommand,
      demoTaskPrompt: scenario.demoTaskPrompt,
    });
    verdict = result.verdict;
    reason = result.reason;
    stderrTail = result.stderrTail;
    exitCode = result.exitCode;
    trace = readTrace(result.tracePath);
  } catch (e) {
    spawnFailed = (e as Error).message;
  }

  checks.push({
    label: "agent command starts",
    ok: !spawnFailed,
    detail: spawnFailed,
  });

  if (!spawnFailed) {
    checks.push({
      label: "agent exits cleanly (exit code 0)",
      ok: exitCode === 0,
      detail: exitCode === 0 ? undefined : `exited ${exitCode}${stderrTail ? ` — last stderr line: "${stderrTail}"` : ""}`,
    });

    const toolCalls = trace.filter((e) => e.kind === "tool_call").length;
    checks.push({
      label: "agent makes at least one tool call via MCP_CONFIG",
      ok: toolCalls > 0,
      detail:
        toolCalls > 0
          ? `${toolCalls} tool call(s) recorded`
          : "no tool_call events in the trace — the agent may not be reading MCP_CONFIG, or never reached the point of calling a tool",
    });

    const modelRequests = trace.filter((e) => e.kind === "model_request").length;
    checks.push({
      label: "agent calls the model through the proxy (ANTHROPIC_BASE_URL/OPENAI_BASE_URL)",
      ok: modelRequests > 0,
      detail: modelRequests > 0 ? undefined : "no model_request events — the agent may be using a hardcoded base URL instead of reading the env var",
    });

    checks.push({
      label: "baseline (no faults) completes the task safely",
      ok: verdict === "SAFE_SUCCESS",
      detail: verdict === "SAFE_SUCCESS" ? undefined : `verdict ${verdict}: ${reason}`,
    });

    // The trace doesn't record which provider a model call targeted, so this
    // can't be a precise check — it's a heuristic over the agent's own stderr,
    // grounded in what was actually captured rather than guessed up front.
    const authFailure = /\b(401|invalid api key|unauthorized|authentication_error)\b/i.test(stderrTail ?? "");
    if (authFailure) {
      checks.push({
        label: "no authentication error from the model API",
        ok: false,
        detail: `last stderr line looks like an auth failure: "${stderrTail}" — check that the key for the provider your agent's SDK actually uses (ANTHROPIC_API_KEY or OPENAI_API_KEY) is set and valid`,
      });
    }
  }

  console.log("");
  for (const c of checks) printCheck(c);

  const allOk = checks.every((c) => c.ok);
  console.log("");
  if (allOk) {
    console.log("chaosline doctor: all checks passed — the agent contract looks correct. Safe to run `chaosline run`.");
  } else {
    console.log("chaosline doctor: one or more checks failed — fix these before running full scenarios/trials.");
  }
  process.exit(allOk ? 0 : 1);
}
