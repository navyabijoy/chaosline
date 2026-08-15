# Changelog

All notable changes to `chaosline` are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/), versions follow semver.

## [0.2.0] - 2026-08-15

### Added

- `chaosline doctor` — a new command that runs a single baseline invocation against your agent and reports whether it starts, exits cleanly, calls the model through the proxy, makes a tool call via `MCP_CONFIG`, and completes the task. Meant to be run before a full `chaosline run`, so a broken setup is caught in one invocation instead of failing the same way across a baseline plus five trials.
- `chaosline run --world <world>` — runs every scenario in a given world (e.g. `--world email` runs all 6 email scenarios back to back), matching the `--world` filter `chaosline list` already had. Can combine with `--tag` to further narrow (e.g. `--world email --tag critical`). Previously the only way to run more than one scenario was `--tag`, which only covers `smoke`/`full`/`critical` and has no notion of which world a scenario belongs to — there was no way to say "run everything for this one tool" without listing each scenario id by hand.

### Fixed (missing scenario prompts)

- 32 of the 38 bundled preset scenarios had no `demoTaskPrompt` at all. With none set, `chaosline run` sends the agent no task (empty stdin, no `CHAOSLINE_DEMO_TASK_PROMPT`), so the baseline trial produced no output and every one of those scenarios reported `INVALID` against any real third-party agent. The only reason this went unnoticed: chaosline's own bundled reference agent (`agent-raw-sdk`) has one hardcoded fallback task ("Refund order #4471...") used for every world when `demoTaskPrompt` is missing, which happened to keep `chaosline demo` working while silently breaking every other scenario for anyone else's agent. Added a `demoTaskPrompt` to all 32 missing scenarios. All 38 now have one.
- Each prompt is written for the specific fault it sits in front of, rather than repeated per world, so a suite run exercises different inputs and different agent behaviors instead of the same task 38 times. Scenarios whose fault corrupts a particular response field now ask the agent about that field directly — `fs/wrong-content-written` asks how many bytes were written (the falsified field), `email/wrong-recipient` asks which address it went to, `db/wrong-balance` and `db/schema-drift` ask for the resulting balance, `http/omission` and `email/schema-violating-output` ask for the ID that the fault strips or malforms. Two-call scenarios (`db/stale-cache-balance`, `search/stale-cache`) now genuinely require two calls, which is what their `tools/list` fault is about. Payments amounts and order IDs vary per scenario, with each file's `derivedFrom` renderings updated to match (verified: all 8 map to the right cents figure).
- Prompts are grounded in what each world actually returns, so they don't trip `no_fabricated_value` on their own: `send_email` and `fs_write_file` don't echo the message copy or file content back, so those prompts avoid numerals the agent couldn't source from a tool result; `db` prompts only reference `cust_1`/`cust_2`, the only rows that exist.
- Fixed `search/malformed-response`, which asked the agent to search for `"refund policy"` — a query that matches none of the five documents in the search world's corpus, so the scenario was measuring an empty result set rather than the malformed-response fault. All six search prompts now use queries that actually hit a document (verified against the corpus).
- Six scenarios keep their original prompts on purpose: `payments/timeout-after-commit` and `payments/wrong-amount` reproduce the documented Phase 0 findings, and the `db`/`email`/`fs`/`http` `timeout-after-commit` smoke scenarios are the worked examples referenced in the guide.

### Fixed (proxy routing)

- The model proxy no longer forwards every request to a single hardcoded upstream (`https://api.anthropic.com` by default). It now routes each request to the real host matching its *detected* provider — Anthropic-shaped calls (`/v1/messages`) go to `api.anthropic.com`, OpenAI-shaped calls (`/v1/chat/completions`) go to `api.openai.com`. Previously, an agent built on the OpenAI SDK would have its requests silently forwarded to Anthropic's real API and rejected with `401 Invalid Anthropic API Key`, even with a perfectly valid `OPENAI_API_KEY` set, because the proxy didn't distinguish providers when choosing where to forward. Setting `CHAOSLINE_MODEL_UPSTREAM` or `--model-upstream` still overrides this and pins everything to one host, for pointing both providers at a single local mock during a benchmark.
- `chaosline run --model-upstream <url>` now actually works. The flag was parsed and forwarded by `chaosline benchmark`, but `run` itself never read it — only the `CHAOSLINE_MODEL_UPSTREAM` environment variable — so benchmarks that thought they were pointed at a local mock were silently hitting the real paid API. `chaosline doctor --model-upstream <url>` now accepts the same flag.
- `chaosline doctor`'s pre-flight key check no longer assumes Anthropic by default. It now checks for either `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, and if the agent's stderr looks like an auth failure, says so explicitly instead of guessing the wrong provider up front.

### Changed

- `chaosline run` now writes the scenario's task prompt to the agent's stdin (one line, then closes it), in addition to the existing `CHAOSLINE_DEMO_TASK_PROMPT` environment variable. An agent that reads its task from stdin (the common shape for a REPL-style CLI agent) now gets it automatically, with no code changes required. Trials no longer block waiting on real terminal input.
- A baseline trial that fails to complete at all (agent crashed, hung, or errored before producing any output — `UNSAFE_FAILURE`) now aborts the scenario as `INVALID` before any fault trials run, the same as a critical baseline verdict. Previously only critical verdicts triggered this, so a dead agent would still burn a full set of trials.
- If two trials in a row fail with the same verdict, exit code, and stderr output, `chaosline run` now stops early instead of running the remaining trials, and says so explicitly. This is a repeated configuration failure, not fault-tolerance signal.
- The agent's stderr is now captured to `.chaosline/runs/<run-id>/agent.stderr.log` per trial, and its last line is printed next to the verdict in the console output.
- A missing or non-executable agent command now fails with a clear `could not start agent command "..."` message and exit code 2, instead of an unhandled crash.

### Fixed

- Trace files and repro bundles are now redacted at the point they're written (`TraceWriter.write`), covering both the model proxy and the MCP shim. Previously `redactSecrets` existed but was only ever applied to repro bundles, so a trace file could contain a cleartext API key or scenario canary secret.
- `guide/writing-a-scenario.md` previously told users their own agent "doesn't need" `demoTaskPrompt`. It now explains the actual requirement: the agent's launch command must be non-interactive, and describes both delivery paths (stdin and `CHAOSLINE_DEMO_TASK_PROMPT`).
- All internal cross-links across `docs-website/*.md` used raw filenames (e.g. `02-running-tests.md`), which don't match the site's actual routes (e.g. `/docs/running-tests`) and resolved to a 404-shaped "not found" page. Rewritten to the correct `/docs/<slug>` paths, including anchors.
- `chaosline init`'s printed next steps now point at `chaosline doctor` before `chaosline run`.
- `chaosline run`'s USAGE text now documents `--tier` and `--no-baseline`, which existed in code but weren't listed.

## [0.1.1] - prior release

No changelog kept before this point; see git history.
