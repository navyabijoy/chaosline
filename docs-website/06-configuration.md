# Configuration

## Environment Variables

### Required

Set the key for whichever provider your agent actually uses:

- `ANTHROPIC_API_KEY`: Required if your agent calls an Anthropic model
- `OPENAI_API_KEY`: Required if your agent calls an OpenAI model

You don't need to set both, and you don't need to tell Chaosline which one you're using. The proxy looks at each request's shape (Anthropic's `/v1/messages` vs OpenAI's `/v1/chat/completions`) and forwards it to the matching real API on its own, so your agent's actual key is the one that gets used.

### Optional

- `CHAOSLINE_MODEL_UPSTREAM`: Pin every request to one endpoint instead of routing by detected provider. Useful for pointing both Anthropic- and OpenAI-shaped calls at a single local mock server (`http://127.0.0.1:18765`) so you can test without making real API calls, or for a custom gateway that fronts both providers. Leave this unset for normal use against real models.

- `CHAOSLINE_BUDGET_USD`: Maximum spend per run (default: 1.0).
  If the agent exceeds this, it gets killed and the run is marked DEGRADED. This is a safeguard against runaway costs in case your agent gets stuck in a loop.

- `CHAOSLINE_FAULT_SCHEDULE`: Overrides fault injection. This is set internally by the CLI; you won't normally need to touch it.

### Agent-Specific

Chaosline sets these automatically when it launches your agent:

- `MCP_CONFIG`: Path to the config JSON your agent reads to find the tool server
- `CHAOSLINE_DEMO_SERVER_KEY`: Which MCP server your agent should connect to
- `CHAOSLINE_DEMO_TASK_PROMPT`: The task the agent should try to complete. Also written to your agent's stdin (one line, then stdin is closed), so an agent that reads its task from stdin works without reading this variable at all.
- `ANTHROPIC_BASE_URL`: Points your agent's Anthropic client at Chaosline's proxy instead of the real API
- `OPENAI_BASE_URL`: Points your agent's OpenAI client at Chaosline's proxy instead of the real API

## CLI Flags

### run

```bash
npx chaosline run [OPTIONS] -- <agent command>
```

| Flag | Default | Description |
|------|---------|-------------|
| `--scenario ID` | Required | Scenario to run (e.g., `payments/timeout-after-commit`) |
| `--tag TAG` | Optional | Run by tag instead (`smoke`, `full`, `critical`) |
| `--world WORLD` | Optional | Run every scenario in a world instead (e.g. `email`, `payments`). Combines with `--tag` |
| `--trials N` | 3 (smoke), 5 (others) | Number of times to run the scenario |
| `--tier smoke` | Optional | Shorthand that sets `--trials 3` |
| `--pass-rate P` | 0.8 | Fraction of trials that must pass (0.0 to 1.0) |
| `--critical-tolerance N` | 0 | Tolerate N critical verdicts (not recommended) |
| `--no-baseline` | Optional | Skip the no-fault baseline trial (not recommended  -  without it, Chaosline can't tell a broken agent from a real finding) |
| `--report-dir PATH` | `.chaosline/reports` | Where to write reports |
| `--scenarios-dir PATH` | `./scenarios` | Custom scenarios directory |
| `--scenarios-module PATH` | Optional | Import scenarios from an npm module |
| `--model-upstream URL` | auto (routes by detected provider) | Pin every request to one model endpoint instead |

### doctor

```bash
npx chaosline doctor [OPTIONS] -- <agent command>
```

| Flag | Default | Description |
|------|---------|-------------|
| `--scenario ID` | Optional | Scenario to check against (picks a smoke-tagged one if omitted) |
| `--tag TAG` | Optional | Pick any scenario with this tag instead of naming one |
| `--scenarios-dir PATH` | `./scenarios` | Custom scenarios directory |

Runs a single baseline invocation (no faults) and reports whether the agent command starts, exits cleanly, calls the model through the proxy, makes a tool call via `MCP_CONFIG`, and completes the task. Exits 0 if every check passes, 1 otherwise. Doesn't run any fault trials, so it's the cheapest way to catch a broken setup before a full `run`.

### benchmark

```bash
npx chaosline benchmark [OPTIONS]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--scenario ID` | Required | Scenario to benchmark |
| `--agent NAME CMD [ARGS...]` | Required | Agent to test (repeat for multiple agents) |
| `--report-dir PATH` | `.chaosline/benchmark` | Output directory |
| `--trials N` | 2 | Trials per agent |
| `--pass-rate P` | 0.5 | Pass threshold |
| `--model-upstream URL` | auto (routes by detected provider) | Pin every request to one model endpoint instead |

### replay

```bash
npx chaosline replay [OPTIONS]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--bundle PATH` | Required | Path to repro bundle |
| `--explain` | Optional | Print a detailed trace |
| `--no-rerun` | Optional | Don't re-run; just explain the saved trace |

### report-diff

```bash
npx chaosline report-diff [OPTIONS]
```

| Flag | Default | Description |
|------|---------|-------------|
| `--base PATH` | Required | Base report (usually from the main branch) |
| `--head PATH` | Required | New report (usually from the feature branch) |

## Performance Tuning

### Reduce Cost

```bash
# Smoke tests only
npx chaosline run --tag smoke -- <agent>

# Fewer trials
npx chaosline run --scenario X --trials 1 -- <agent>

# Local mock model (free)
CHAOSLINE_MODEL_UPSTREAM=http://127.0.0.1:18765 npx chaosline run ...
```

### Speed Up Testing

```bash
# Reduce trials
npx chaosline run --trials 1 -- <agent>

# Smoke tag (faster)
npx chaosline run --tag smoke -- <agent>

# Multi-trial runs automatically reuse the first trial's responses for unchanged prefixes
```

### Collect More Data

```bash
# More trials for better flake detection
npx chaosline run --trials 10 -- <agent>

# All scenarios
npx chaosline run --tag full -- <agent>

# Multiple runs for trend analysis
for i in {1..5}; do
  npx chaosline run --scenario X --report-dir ./run-$i -- <agent>
done
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Chaosline Gate

on: [pull_request]

jobs:
  chaosline:
    runs-on: ubuntu-latest
    env:
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx chaosline run --tag smoke --report-dir ./reports -- node agent.ts
      - run: npx chaosline report-diff --base main-report.json --head ./reports/report.json
        if: always()
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: chaosline-reports
          path: reports/
```

### GitLab CI

```yaml
chaosline:
  image: node:22
  script:
    - npm install
    - npx chaosline run --tag smoke -- node agent.ts
  artifacts:
    paths:
      - .chaosline/
    expire_in: 30 days
```

## Debugging

### See what fault schedule was applied

```bash
npx chaosline run ... -- <agent> 2>&1
# Look for: "CHAOSLINE_FAULT_SCHEDULE": {...}
```

### Trace everything that happened

```bash
cat .chaosline/runs/*/trace.jsonl | jq .
```

### Re-run with a full explanation

```bash
npx chaosline replay --bundle .chaosline/repro/scenario/trial_0.json --explain
```

### Use a mock model for free testing

```bash
# Start mock server in the background
node -e "
import { startMockUpstream } from '@chaosline/proxy-model';
const m = await startMockUpstream(18765);
console.log('Mock ready at', m.url);
"

# Then run with mock
CHAOSLINE_MODEL_UPSTREAM=http://127.0.0.1:18765 npx chaosline run ...
```

## Next Steps

- [Running Tests](/docs/running-tests): Use these flags
- [Writing Scenarios](/docs/writing-scenarios): Custom scenario config
- [Architecture](/docs/architecture): How Chaosline works
