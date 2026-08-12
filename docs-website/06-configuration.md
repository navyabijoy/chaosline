# Configuration

## Environment Variables

### Required

Set one of these depending on which model provider you're using:

- `ANTHROPIC_API_KEY`: Required if using any Anthropic model
- `OPENAI_API_KEY`: Required if using any OpenAI model

### Optional

- `CHAOSLINE_MODEL_UPSTREAM`: Override the model endpoint (default: `https://api.anthropic.com`).
  Useful for pointing at a local mock server (`http://127.0.0.1:18765`) so you can test without making real API calls.

- `CHAOSLINE_BUDGET_USD`: Maximum spend per run (default: 1.0).
  If the agent exceeds this, it gets killed and the run is marked DEGRADED. This is a safeguard against runaway costs in case your agent gets stuck in a loop.

- `CHAOSLINE_FAULT_SCHEDULE`: Overrides fault injection. This is set internally by the CLI; you won't normally need to touch it.

### Agent-Specific

Chaosline sets these automatically when it launches your agent:

- `MCP_CONFIG`: Path to the config JSON your agent reads to find the tool server
- `CHAOSLINE_DEMO_SERVER_KEY`: Which MCP server your agent should connect to
- `CHAOSLINE_DEMO_TASK_PROMPT`: The task the agent should try to complete
- `ANTHROPIC_BASE_URL`: Custom Anthropic endpoint (used when a mock is configured)
- `OPENAI_BASE_URL`: Custom OpenAI endpoint (used when a mock is configured)

## CLI Flags

### run

```bash
npx chaosline run [OPTIONS] -- <agent command>
```

| Flag | Default | Description |
|------|---------|-------------|
| `--scenario ID` | Required | Scenario to run (e.g., `payments/timeout-after-commit`) |
| `--tag TAG` | Optional | Run by tag instead (`smoke`, `full`, `critical`) |
| `--trials N` | 3 (smoke), 5 (others) | Number of times to run the scenario |
| `--pass-rate P` | 0.8 | Fraction of trials that must pass (0.0 to 1.0) |
| `--critical-tolerance N` | 0 | Tolerate N critical verdicts (not recommended) |
| `--report-dir PATH` | `.chaosline/reports` | Where to write reports |
| `--scenarios-dir PATH` | `./scenarios` | Custom scenarios directory |
| `--scenarios-module PATH` | Optional | Import scenarios from an npm module |
| `--model-upstream URL` | https://api.anthropic.com | Custom model endpoint |

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
| `--model-upstream URL` | https://api.anthropic.com | Custom model endpoint |

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

- [Running Tests](02-running-tests.md): Use these flags
- [Writing Scenarios](03-writing-scenarios.md): Custom scenario config
- [Architecture](07-architecture.md): How Chaosline works
