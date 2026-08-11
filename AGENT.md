# Agent instructions for this repo

Read this before doing anything else in this project. If you are starting a new phase of work, also read [`docs/12-phase-prompt-template.md`](docs/12-phase-prompt-template.md) — you were likely given a prompt generated from it, and it explains the discipline that prompt is enforcing.

## What this project is

A pre-deployment safety gate for AI agents with real tool access. It deliberately breaks an agent's tools (timeouts, lost responses, wrong data) and grades what the agent does — not "did it recover gracefully," but "did it cause real, harmful side effects, or lie about what happened." See [`docs/01-product-spec.md`](docs/01-product-spec.md) for the full spec and [`docs/00-verdict.md`](docs/00-verdict.md) for why the project is shaped the way it is.

**Naming: the project name is `chaosline`.** npm scope `@chaosline/*`, root package `chaosline-monorepo`, CLI binary and `.gitignore` entry `chaosline`, README says "Chaosline." Reconciled in a full-repo rename — do not reintroduce `faultline` anywhere (old name, still referenced by URL slug/example paths in some docs; that's expected, don't "fix" it there).

## `docs/` exists on disk but is gitignored — read it anyway

The planning docs (`docs/00` through `docs/12`, plus `docs/PRD.md` and `docs/phase-0-results.md`) are intentionally excluded from git — the project owner doesn't want internal planning process visible to people viewing the repo. They are **not deleted**. They are the design source of truth. Read them from the local filesystem regardless of what `git ls-files` shows you. Never assume something doesn't exist just because `git status`/`git ls-files` doesn't list it — check the actual directory.

Key docs, in the order you'll need them:

| Doc | When to read it |
|---|---|
| [`00-verdict.md`](docs/00-verdict.md) | Always first. The reasoning behind every major decision below. |
| [`01-product-spec.md`](docs/01-product-spec.md) | The verdict taxonomy (`SAFE_SUCCESS` / `SAFE_FAILURE` / `DEGRADED` / `UNSAFE_FAILURE` / `SILENT_FAILURE` / `HARMFUL_ACTION`) — every grader decision maps to one of these. |
| [`02-architecture.md`](docs/02-architecture.md) | Two-boundary interception (tool proxy + model proxy), package layout, trace schema. Read before touching `packages/shim` or anything MCP-facing. |
| [`03-fault-taxonomy.md`](docs/03-fault-taxonomy.md) | Every fault, ranked by what it actually reveals. Don't invent a new fault without checking whether it's already specified here. |
| [`04-grading-and-determinism.md`](docs/04-grading-and-determinism.md) | How verdicts are computed, why LLM judges are used sparingly, how trials/flake-detection work. Read before touching `packages/grader`. |
| [`05-roadmap.md`](docs/05-roadmap.md) | The phase plan. Tells you what's in scope for the phase you're on, and — just as important — what is explicitly deferred to a later phase. |
| [`06-gaps-and-risks.md`](docs/06-gaps-and-risks.md) | Known weaknesses in the plan itself. Check here before "fixing" something that's a known, accepted tradeoff. |
| [`08-competitive-landscape.md`](docs/08-competitive-landscape.md) / [`09-mcp-spec-notes.md`](docs/09-mcp-spec-notes.md) | Competitive positioning and hard MCP spec constraints (target spec `2026-07-28` only — no sessions, no `initialize` handshake to rely on). Read before implementing anything MCP-protocol-facing. |
| [`phase-0-results.md`](docs/phase-0-results.md) | The real, verified finding this whole project reproduces in code. Every later phase's "prove it works" step ties back to a number in this doc. |

## The one rule that matters most: stay inside the current phase's scope

This project is built one narrow vertical slice at a time on purpose — see [`05-roadmap.md`](docs/05-roadmap.md). Each phase lists exactly what to build and explicitly what to defer. If you were handed a phase prompt, its scope section is not a suggestion — building something from a later phase "while you're in there" is the single most common way this kind of project goes sideways. If a later-phase feature would obviously help the current task, name it and defer it; don't build it.

## Safety rules, no exceptions

- **Never call a real external paid API or real payment/production service.** Every "world" (payments ledger, database, etc.) is fake and in-memory. If a task seems to require hitting something real, stop and ask.
- **Never point the tool at a non-mock/production MCP server.** This is a fault-injection tool; running it against something real is the one mistake that would actually hurt someone.
- **Ask before adding a new paid dependency or anything requiring a new API key.**
- Redact secrets before writing anything to a trace file or repro bundle — assume every trace/repro file will eventually be pasted into a public GitHub issue by a user.

## Current state (update this section as phases land)

- **Phase 0** (throwaway, not shipped): hand-built proof that a real agent, unmodified, double/triple-charges a customer after a lost tool response, and separately, confidently reports a fabricated dollar amount after receiving a tool result with the wrong number. Both are real, logged findings — see `docs/phase-0-results.md` and `phase0/`.
- **Phase 1** (shipped): npm workspaces monorepo. `packages/core` (trace schema + JSONL writer), `packages/world-payments` (fake ledger + MCP server), `packages/shim` (MCP stdio passthrough with the `timeout_after_commit` fault hook), `packages/grader` (`no_duplicate_side_effect` invariant), `packages/cli` (`chaosline run --scenario ... -- <agent command>`). Reproduces the Phase 0 double-charge finding through the real tool, printing `HARMFUL_ACTION`.
- **Phase 2** (shipped): `packages/proxy-model` — Anthropic Messages API and OpenAI Chat Completions API compatible passthrough, both streaming and non-streaming, tool-call blocks normalized to one shape for the trace. Token/USD accounting including Anthropic prompt-cache multipliers, hard budget cap with abort (`budget_abort` trace event, provider-shaped error body), final-output capture (`agent_output`). Grader invariants `no_false_success_claim` and `cost_bounded` wired into `chaosline run`. Known scope gap: the shipped scenario (`timeout_after_commit`) cannot exercise `no_false_success_claim` end-to-end — per `docs/phase-0-results.md`, that fault produces honest failures, not false success claims; `wrong_amount` (Phase 3 territory) is the fault that does. The invariant is implemented and unit-verified, just not demonstrable via the one scenario Phase 1 shipped.
- **Not started yet**: fault/world breadth (Phase 3), the rest of the grader (Phase 4), determinism/trials (Phase 5), scenario DSL (Phase 6), reporting/CI (Phase 7), the framework benchmark report (Phase 8), polish/launch (Phase 9). Also not started: the landing page at `apps/site` (see [`11-landing-page.md`](docs/11-landing-page.md)) — independent track, doesn't block or get blocked by the phases above.

## How work gets kicked off in this repo

Each phase is started in a **fresh session** using a prompt built from [`12-phase-prompt-template.md`](docs/12-phase-prompt-template.md), not by continuing the previous phase's session. If you were dropped into this repo mid-phase without that context, treat this file plus the docs above as the authoritative substitute — don't ask the user to re-explain the project, read the docs first.
