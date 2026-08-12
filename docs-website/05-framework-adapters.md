# Framework Adapters

Chaosline lets you run the same scenarios against multiple agent frameworks side by side, so you can see exactly how each one handles tool failures.

## Included Adapters

Chaosline ships with example adapters for three popular frameworks:

- **Raw Anthropic SDK**: A baseline with no framework-level retry logic
- **LangChain**: A popular framework with built-in tool handling
- **OpenAI Agents SDK**: The native agent framework from OpenAI

Each example is a minimal agent (around 100 lines) that does the same basic loop:

1. Reads `MCP_CONFIG` to find available tools
2. Calls the model in a loop
3. Handles tool responses
4. Stops when the model signals it's done

## Running a Benchmark

To compare how multiple frameworks handle the same scenario:

```bash
npx chaosline benchmark \
  --scenario payments/timeout-after-commit \
  --agent raw-sdk node examples/agent-raw-sdk/agent.ts \
  --agent langchain node examples/agent-langchain/agent.ts \
  --agent openai-agents-sdk node examples/agent-openai-agents-sdk/agent.ts \
  --trials 2 \
  --report-dir ./benchmark-results
```

The output goes to `benchmark-results/benchmark-report.md` and looks like this:

```
# Chaosline Benchmark Report

| Agent | Framework | Safety Score |
|-------|-----------| ------------|
| raw-sdk | raw | 10.0/100 |
| langchain | langchain | 50.0/100 |
| openai-agents-sdk | openai | 50.0/100 |

## Scenario Results

| Scenario | raw-sdk | langchain | openai-agents-sdk |
|----------|---|---|---|
| payments/timeout-after-commit | FAIL (0%) | PASS (100%) | PASS (100%) |
```

## Building Your Own Adapter

Create a new directory at `examples/agent-my-framework/`:

```
examples/agent-my-framework/
  package.json
  agent.ts
```

### package.json

```json
{
  "name": "@chaosline/example-agent-my-framework",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@my-framework/package": "^X.Y.Z",
    "@modelcontextprotocol/sdk": "^1.30.0",
    "dotenv": "^17.4.2"
  }
}
```

### agent.ts

Your agent needs to implement this interface:

```typescript
// Load environment
const mcpConfigPath = process.env.MCP_CONFIG;
const serverKey = process.env.CHAOSLINE_DEMO_SERVER_KEY ?? "payments";
const taskPrompt = process.env.CHAOSLINE_DEMO_TASK_PROMPT ?? "...";

// 1. Connect to MCP
const client = new Client();
await client.connect(new StdioClientTransport({
  command: mcpConfig.mcpServers[serverKey].command,
  args: mcpConfig.mcpServers[serverKey].args,
}));

// 2. Get tools from MCP
const { tools: mcpTools } = await client.listTools();

// 3. Create agent with framework, bind tools
const agent = new MyFrameworkAgent({
  tools: mcpTools.map(t => ({ name: t.name, ... })),
  model: "claude-...",
});

// 4. Run agent loop
const result = await agent.run(taskPrompt);

// 5. Print summary
console.error("=== AGENT (my-framework) SUMMARY ===");
console.error(`turns: ${result.turns}, tool calls: ${result.toolCalls}`);
console.error(`tokens in=${result.inputTokens} out=${result.outputTokens}`);
console.error(`final message: ${result.output}`);

// 6. Exit
await client.close();
process.exit(0);
```

### Requirements Your Adapter Must Meet

**Read these env vars:**
- `MCP_CONFIG`: path to JSON config
- `CHAOSLINE_DEMO_SERVER_KEY`: which server to connect to
- `CHAOSLINE_DEMO_TASK_PROMPT`: the user task to execute
- `ANTHROPIC_BASE_URL` or `OPENAI_BASE_URL`: model endpoint (may be a mock)
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`: credentials

**Connect via MCP stdlib:**
```typescript
import { StdioClientTransport } from "@modelcontextprotocol/sdk";
```

**Respect these timeouts:**
- 120 seconds hard wall-clock total
- 20 seconds per tool call
- Maximum 8 turns

**Print a summary to stderr when done:**
```
=== AGENT (name) SUMMARY ===
turns: N, tool calls: M
tokens in=X out=Y
final message: ...
```

**Exit with code 0 on success or code 2 on agent error.**

## Framework Behavior Patterns

Understanding how each framework handles failure by default is the whole point of this comparison.

### Retry Logic

- **Raw SDK:** No built-in retry. The model makes all retry decisions itself.
- **LangChain:** Tool-use binding includes retry hooks.
- **OpenAI Agents SDK:** The native agent loop has built-in retry suppression.

### Error Handling

- **Raw SDK:** Errors are returned as plain strings inside `tool_result`.
- **LangChain:** Errors come as `ToolError` objects; the framework can catch and retry.
- **OpenAI Agents SDK:** Errors are marked with the `tool_error` type and handled natively.

### Tool Result Processing

- **Raw SDK:** JSON parsing is the agent's responsibility.
- **LangChain:** The framework parses and validates against the schema.
- **OpenAI Agents SDK:** The framework handles schema validation.

## Comparing Results

Here's a summary of what to look for across frameworks by default, before any custom configuration:

| Behavior | RAW | LangChain | OpenAI SDK |
|----------|-----|-----------| -----------|
| Retry on timeout | ✗ | ✓* | ✓* |
| Validate schema | ✗ | ✓ | ✓ |
| Detect wrong data | ✗ | ✗ | ✗ |
| Circuit breaker | ✗ | ✗ | ✗ |
| Idempotency keys | ✗ | ✗ | ✗ |

*Only if configured. Safe retry behavior is not the default.

## Publication Rules

If you're planning to publish benchmark results publicly, please follow these guidelines:

1. **Pin framework versions**: Test against specific releases, not latest
2. **Notify maintainers**: Share results with framework authors before publishing
3. **Frame as default-config**: Frame it as "safe retry behavior is not the default" rather than "Framework X is unsafe"
4. **Show success cases too**: Don't cherry-pick failures
5. **Provide reproducibility**: Include the exact seed, date, commit hash, and versions used

Example notice:

> We tested LangChain v0.2.16 at default configuration against Chaosline's email/retry-storm scenario. This scenario is not a general test of LangChain's quality, but a specific measurement of retry storm handling at defaults. We found [results].

## Next Steps

- [Running Tests](02-running-tests.md): Run benchmarks
- [Understanding Results](04-understanding-results.md): Interpret framework behavior
- [Architecture](07-architecture.md): How faults are injected
