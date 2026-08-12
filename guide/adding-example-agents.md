# Adding Example Agents

This guide explains how to add a new example agent framework to chaosline for the benchmark report.

## Structure

Each example agent lives in `examples/agent-{framework-name}/`:

```
examples/agent-langchain/
  ├── package.json          # dependencies for this framework
  └── agent.ts              # the agent implementation
```

## Interface

Your agent must:

1. **Read environment variables** set by `chaosline run`:
   - `MCP_CONFIG`  -  path to JSON file with MCP server configuration
   - `CHAOSLINE_DEMO_SERVER_KEY`  -  which MCP server to connect to (e.g., "payments", "db")
   - `CHAOSLINE_DEMO_TASK_PROMPT`  -  the user task to execute
   - `ANTHROPIC_BASE_URL` (if using Anthropic) or `OPENAI_BASE_URL` (if using OpenAI)  -  model proxy endpoint
   - `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`  -  API key (loaded from `.env`)

2. **Connect to the MCP server** via stdio transport:
   ```json
   // Example MCP_CONFIG content:
   {
     "mcpServers": {
       "payments": {
         "command": "node",
         "args": ["path/to/shim"],
         "env": { /* ... */ }
       }
     }
   }
   ```
   Use `@modelcontextprotocol/sdk` to parse the config and establish a `StdioClientTransport`.

3. **Implement a tool loop**:
   - List tools from the MCP server
   - Call your framework's model with those tools
   - Process tool calls from the model
   - Pass tool results back to the model
   - Stop when the model produces no more tool calls

4. **Respect timeouts**:
   - Hard agent timeout: 120 seconds total
   - Per-call tool timeout: 20 seconds
   - Max turns: 8 (to cap runaway loops)

5. **Print a summary to stderr**:
   ```
   === AGENT ({framework-name}) SUMMARY ===
   turns: {N}, tool calls: {M}
   tokens in={input} out={output}
   final message: {text}
   ```

6. **Exit gracefully**:
   - Exit code 0 on normal completion
   - Exit code 2 if the harness fails (not the agent)

## Example: Minimal Raw SDK Agent

See `examples/agent-raw-sdk/agent.ts` for a reference implementation using the raw Anthropic SDK with zero framework retry logic.

## Model Proxying

Your agent talks to the model via the URL in `ANTHROPIC_BASE_URL` or `OPENAI_BASE_URL`. This points to:
- Real API endpoint (default `https://api.anthropic.com`) when running against real models
- Local mock server (e.g., `http://127.0.0.1:PORT`) when benchmarking with fake responses (zero cost)

The proxy also handles:
- Streaming response capture
- Token counting
- Budget enforcement (hard abort if over budget)
- Tool-call block normalization

## Benchmarking

Run a single agent through a scenario:

```bash
chaosline run --scenario payments/wrong-amount -- node examples/agent-langchain/agent.ts
```

Run all adapters and compare:

```bash
chaosline benchmark --scenario payments/wrong-amount \
  --agent raw-sdk node examples/agent-raw-sdk/agent.ts \
  --agent langchain node examples/agent-langchain/agent.ts \
  --agent openai-agents-sdk node examples/agent-openai-agents-sdk/agent.ts \
  --report-dir .chaosline/benchmark
```

Output: `benchmark-report.json` and `benchmark-report.md` in the report directory.

## package.json Requirements

List only the framework and its MCP SDK as dependencies:

```json
{
  "name": "@chaosline/example-agent-{framework}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@framework/package": "^X.Y.Z",
    "@modelcontextprotocol/sdk": "^1.30.0",
    "dotenv": "^17.4.2"
  }
}
```

Install with the monorepo:

```bash
npm install
```

## Naming Convention

- Directory: `examples/agent-{framework-short-name}/`
- Framework field in benchmark report: full marketing name (e.g., "LangChain")
- Agent name (CLI flag): lowercase, dashes, no spaces (e.g., `langchain`, `openai-agents-sdk`)
