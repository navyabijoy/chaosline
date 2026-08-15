// stdio MCP passthrough. Wraps a real MCP stdio server as a child process and
// forwards every JSON-RPC message transparently in both directions, except where a
// seeded fault schedule (packages/faults) says otherwise.
//
// MCP stdio framing (2026-07-28): one JSON-RPC message per line, newline-delimited.
// No sessions, no initialize handshake to special-case — just messages.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { TraceWriter } from "@chaosline/core";
import {
  applyListResponse,
  applyPostCall,
  applyPreCall,
  applyRequestMutation,
  isPostCallFault,
  isPreCallFault,
  isRequestMutationFault,
  selectFault,
  type CanarySpec,
  type FaultSchedule,
  type FaultSpec,
} from "@chaosline/faults";

interface PendingCall {
  tool: string;
  args: unknown;
  callIndex: number;
  postSpec?: FaultSpec;
}

function loadSchedule(): FaultSchedule {
  const raw = process.env.CHAOSLINE_FAULT_SCHEDULE;
  if (!raw) return { seed: "no-seed", trialIndex: 0, faults: [] };
  return JSON.parse(raw) as FaultSchedule;
}

// Only these kinds are meaningful against a single tools/call invocation — list-only
// kinds (annotation_lie, stale_cache) are handled separately in applyListResponse and
// must not shadow a real per-call fault when selectFault walks the schedule in order.
function callApplicableFaults(schedule: FaultSpec[]): FaultSpec[] {
  return schedule.filter((s) => isPreCallFault(s) || isPostCallFault(s) || isRequestMutationFault(s));
}

export function runShim(childCommand: string, childArgs: string[]): void {
  const schedule = loadSchedule();
  const tracePath = process.env.CHAOSLINE_TRACE_PATH;
  const canary: CanarySpec | undefined = schedule.canary;
  const trace = tracePath ? new TraceWriter(tracePath, canary ? [canary.secret] : []) : undefined;

  const child = spawn(childCommand, childArgs, {
    stdio: ["pipe", "pipe", "inherit"],
    env: process.env,
  });

  const pending = new Map<string | number, PendingCall>();
  const pendingLists = new Set<string | number>();
  const callCounters = new Map<string, number>();

  function nextCallIndex(tool: string): number {
    const next = (callCounters.get(tool) ?? 0) + 1;
    callCounters.set(tool, next);
    return next;
  }

  // client (agent) -> child (world server)
  const fromClient = createInterface({ input: process.stdin });
  fromClient.on("line", (line) => {
    if (!line.trim()) return;
    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch {
      child.stdin.write(line + "\n");
      return;
    }

    if (msg.method === "tools/list" && msg.id !== undefined) {
      pendingLists.add(msg.id);
      child.stdin.write(line + "\n");
      return;
    }

    if (msg.method === "tools/call" && msg.id !== undefined) {
      const tool = msg.params?.name;
      const args = msg.params?.arguments;
      const callIndex = nextCallIndex(tool);
      const spec = selectFault(callApplicableFaults(schedule.faults), {
        tool,
        callIndex,
        args,
        seed: schedule.seed,
        trialIndex: schedule.trialIndex,
      });

      trace?.write({
        t: Date.now(),
        kind: "tool_call",
        id: String(msg.id),
        tool,
        args,
        ...(spec && (isPreCallFault(spec) || isRequestMutationFault(spec))
          ? { injected: { kind: spec.kind, tool, params: spec.params } }
          : {}),
      });

      if (spec && isPreCallFault(spec)) {
        const outcome = applyPreCall(msg.id, spec);
        if (outcome.action === "drop") {
          // Never reaches the child, never responds. A pure hang — no side effect
          // is possible because the tool was never invoked.
          trace?.write({
            t: Date.now(),
            kind: "tool_result",
            id: String(msg.id),
            ok: false,
            body: null,
            injected: { kind: spec.kind, tool },
          });
          return;
        }
        if (outcome.action === "short_circuit") {
          trace?.write({
            t: Date.now(),
            kind: "tool_result",
            id: String(msg.id),
            ok: !(outcome.response as any).error,
            body: (outcome.response as any).result ?? (outcome.response as any).error,
            injected: { kind: spec.kind, tool },
          });
          process.stdout.write(JSON.stringify(outcome.response) + "\n");
          return;
        }
        // passthrough — fall through to normal forwarding below.
      }

      if (spec && isRequestMutationFault(spec)) {
        const mutated = applyRequestMutation(msg, spec);
        pending.set(msg.id, { tool, args, callIndex });
        child.stdin.write(JSON.stringify(mutated) + "\n");
        return;
      }

      pending.set(msg.id, {
        tool,
        args,
        callIndex,
        postSpec: spec && isPostCallFault(spec) ? spec : undefined,
      });
    }

    child.stdin.write(line + "\n");
  });

  // child (world server) -> client (agent)
  const fromChild = createInterface({ input: child.stdout });
  fromChild.on("line", (line) => {
    if (!line.trim()) return;
    let msg: any;
    try {
      msg = JSON.parse(line);
    } catch {
      process.stdout.write(line + "\n");
      return;
    }

    if (msg.id !== undefined && pendingLists.has(msg.id)) {
      pendingLists.delete(msg.id);
      process.stdout.write(JSON.stringify(applyListResponse(msg, schedule.faults, canary)) + "\n");
      return;
    }

    const call = msg.id !== undefined ? pending.get(msg.id) : undefined;
    if (call) {
      pending.delete(msg.id);

      if (call.postSpec) {
        const outcome = applyPostCall(msg, call.postSpec, canary);
        // Trace what the agent actually receives, not what the world returned.
        // The honesty invariants compare an agent's claims against the tool
        // results it was given, so recording the pre-mutation body would credit
        // the agent with values it never saw.
        const delivered =
          outcome.action === "mutate" ? (outcome.response as any) : outcome.action === "drop" ? undefined : msg;
        trace?.write({
          t: Date.now(),
          kind: "tool_result",
          id: String(msg.id),
          ok: delivered !== undefined && !delivered.error,
          body: delivered === undefined ? null : delivered.result ?? delivered.error,
          injected: { kind: call.postSpec.kind, tool: call.tool, params: call.postSpec.params },
        });

        if (outcome.action === "drop") {
          // Side effect already landed on the child (this is only reachable for
          // commit-then-tamper kinds). Never forward the response — the real
          // client hangs, exactly like a lost reply over the wire.
          return;
        }
        if (outcome.action === "mutate") {
          process.stdout.write(JSON.stringify(outcome.response) + "\n");
          return;
        }
        // passthrough
        process.stdout.write(line + "\n");
        return;
      }

      trace?.write({
        t: Date.now(),
        kind: "tool_result",
        id: String(msg.id),
        ok: !msg.error,
        body: msg.result ?? msg.error,
      });
    }

    process.stdout.write(line + "\n");
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  process.stdin.on("close", () => {
    child.kill();
  });
}
