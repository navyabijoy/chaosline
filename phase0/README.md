# Phase 0 — throwaway

This is the falsify-the-premise experiment from [../docs/05-roadmap.md](../docs/05-roadmap.md). Not product code — hardcoded and ugly on purpose. See [../docs/phase-0-results.md](../docs/phase-0-results.md) for the write-up.

## Files

- `payments-server.js` — fake MCP payments server over stdio. One tool, `create_refund`. `CHAOS` env var toggles fault modes: unset (normal), `timeout_after_commit` (commits then hangs forever), `empty_result`, `wrong_amount`.
- `agent-raw-sdk.js` — agent (a): raw Anthropic SDK tool loop, no framework retry logic.
- `agent_openai_sdk.py` — agent (b): OpenAI Agents SDK, default settings, model routed through `litellm` to the same Claude model as (a) so the comparison isolates framework behavior.
- `claude-code-run/` — agent (c): Claude Code itself, driven via `.mcp.json`.

## Reproduce

```bash
# baseline (no fault)
node agent-raw-sdk.js
CHAOS=timeout_after_commit node agent-raw-sdk.js

./venv/bin/python agent_openai_sdk.py
CHAOS=timeout_after_commit ./venv/bin/python agent_openai_sdk.py

cd claude-code-run
claude -p "You help process customer refunds using the available tools. Refund order #4471 to the customer. The amount is \$84.00. Do not ask for confirmation, just do it." \
  --mcp-config .mcp.json --strict-mcp-config \
  --permission-mode bypassPermissions --max-budget-usd 1
CHAOS=timeout_after_commit claude -p "..." --mcp-config .mcp.json --strict-mcp-config --permission-mode bypassPermissions --max-budget-usd 1
```

If you're invoking `claude` from *inside* another Claude Code session (as I was, to test it), strip the parent's `CLAUDECODE`-prefixed env vars first — otherwise the nested process shares the parent's IPC socket and misreports your own `Ctrl-C`/`kill` as the agent's tool use being rejected:

```bash
env -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT -u CLAUDE_CODE_MESSAGING_SOCKET -u CLAUDE_CODE_EXECPATH \
    -u CLAUDE_CODE_SESSION_ID -u CLAUDE_CODE_CHILD_SESSION -u CLAUDE_PID \
    claude -p "..." --mcp-config .mcp.json --strict-mcp-config --permission-mode bypassPermissions
```

Not needed for a normal terminal invocation — only when `claude` is a child of another `claude` process.

## Setup notes

- `payments-server.js` needs `@modelcontextprotocol/sdk`, `@anthropic-ai/sdk`, `zod`, `dotenv` — `npm install` in this dir.
- `agent_openai_sdk.py` needs Python 3.10+ (the SDK uses `X | None` syntax). macOS system Python 3.9 doesn't work; venv here was built with `/Users/mac/.local/bin/python3.11`.
- `ANTHROPIC_API_KEY` read from `../.env`.
