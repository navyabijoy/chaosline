# Chaosline guide

User-facing documentation for writing and running scenarios. (The `docs/` directory in this repo is internal planning material, gitignored on purpose — this `guide/` directory is the committed, public counterpart.)

- [Writing a scenario](writing-a-scenario.md) — the YAML schema, a worked example against a packaged world, a worked example against your own tool (`world: custom`), the fault reference, tags, `derivedFrom`, the code API, and troubleshooting.

## Presets

38 scenarios ship across the six packaged worlds (`payments`, `db`, `email`, `fs`, `http`, `search`), tagged `smoke` / `full` / `critical`. List them:

```bash
chaosline list
chaosline list --tag smoke
chaosline list --world http
```

## Quick start

```bash
npx chaosline init                                   # scaffold a custom scenario for your own tool
chaosline run --scenario payments/timeout-after-commit -- <agent command>
chaosline run --tag smoke -- <agent command>          # run every smoke-tagged preset
chaosline replay --bundle <repro bundle path> --explain
```
