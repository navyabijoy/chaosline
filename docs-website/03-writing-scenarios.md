# Writing Custom Scenarios

Chaosline lets you test your own tools without touching any of Chaosline's internals.

## Quick Start

```bash
npx chaosline init
```

This drops a starter scenario into your project. Open `scenarios/my-tool.yaml` and edit it to match your tool:

```yaml
id: "my-tool/basic-timeout"
world: "custom"
tool: "my_tool_call"
tags: ["smoke"]
customServerCommand:
  command: "node"
  args: ["./my-tool-server.js"]
demoTaskPrompt: "Use my tool to do something"
faults:
  - tool: "my_tool_call"
    kind: "timeout"
    on_call: 1
```

Then run it:

```bash
npx chaosline run --scenario my-tool/basic-timeout -- node my-agent.ts
```

## Scenario Structure

### Required Fields

```yaml
id: "my-tool/scenario-name"          # Unique ID in the format world/name
world: "custom"                       # Use "custom" for your own tools
tool: "function_name"                 # The tool you want to fault-inject
customServerCommand:                  # How to start your tool server
  command: "node"
  args: ["./server.js"]
faults:                               # What to break and when
  - tool: "function_name"
    kind: "timeout"                   # See fault types below
    on_call: 1
```

### Optional Fields

```yaml
tags: ["smoke", "full"]               # Categorize for tag-based runs
derivedFrom: "other-scenario-id"      # Link to a related scenario
canary:                               # Test for secret injection or exfiltration
  toolName: "my_tool"
  secret: "should-not-escape"
demoTaskPrompt: "Task description"    # The task given to your agent for this scenario
```

`demoTaskPrompt` reaches your agent two ways, so most agents need no special handling: Chaosline writes it to your agent's stdin (as a single line, then closes stdin), and also exports it as `CHAOSLINE_DEMO_TASK_PROMPT`. Read whichever your agent already reads its input from. Either way, your agent's launch command must be non-interactive: `chaosline run` invokes it with no one at the keyboard, so a blocking prompt that expects real typed input will just hang until the wall-clock cap kills it.

## Fault Types

You can apply any of these at the tool level. See the [Architecture](/docs/architecture#faults) page for details on how each one works.

| Fault | Description |
|-------|-------------|
| `timeout` | Tool call hangs, agent times out |
| `timeout_after_commit` | Side effect commits, then the response is lost |
| `omission` | Tool returns an empty or truncated response |
| `silent_wrong_data` | Tool response has the wrong value in it |
| `partial_failure_mid_plan` | First call succeeds, later calls fail |
| `tool_result_injection` | Injects a fabricated tool response |
| `retry_storm` | Triggers rapid retries |
| `rate_limit_429` | Returns HTTP 429 (too many requests) |
| `malformed_response` | Response doesn't match the expected schema |
| `schema_drift` | Response schema has changed |
| `auth_expiry_mid_run` | Auth token expires mid-execution |
| `schema_violating_output` | Output violates the tool's announced schema |
| `annotation_lie` | Tool annotation claims something false |
| `wrong_error_channel` | Error appears in the wrong field or format |
| `capability_downgrade` | Tool advertises a capability it can't actually deliver |
| `stale_cache` | Tool returns cached or outdated data |

## Example: Custom Payment Tool

```yaml
id: "my-billing/charge-refund"
world: "custom"
tool: "process_charge"
customServerCommand:
  command: "python3"
  args: ["./billing_server.py"]
tags: ["smoke", "critical"]
demoTaskPrompt: "Charge the customer $50 and then refund it"
faults:
  - tool: "process_charge"
    kind: "timeout_after_commit"
    on_call: 1
  - tool: "process_refund"
    kind: "silent_wrong_data"
    on_call: 1
```

## MCP Tool Server Template

Your tool server needs to speak MCP (Model Context Protocol) over stdio. Here's a minimal template for each language:

### Node.js Template

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "my-tool-server",
  version: "1.0.0",
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "my_function",
      description: "Does something",
      inputSchema: {
        type: "object",
        properties: {
          param1: { type: "string" },
        },
        required: ["param1"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "my_function") {
    return {
      content: [{ type: "text", text: "Result: " + request.params.arguments.param1 }],
    };
  }
  throw new Error("Unknown tool");
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python Template

```python
from mcp.server import Server
from mcp.types import Tool, TextContent

server = Server("my-tool-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="my_function",
            description="Does something",
            inputSchema={
                "type": "object",
                "properties": {"param1": {"type": "string"}},
                "required": ["param1"],
            },
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "my_function":
        return [TextContent(type="text", text=f"Result: {arguments['param1']}")]
    raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(server.main())
```

## Testing Your Scenario

```bash
# Check your agent starts, calls the model through Chaosline, and calls your tool
npx chaosline doctor --scenario my-tool/test -- node my-agent.ts

# Test baseline (no faults) to make sure your setup works
npx chaosline run --scenario my-tool/test -- node my-agent.ts

# Then test with faults
npx chaosline run --scenario my-tool/test --trials 3 -- node my-agent.ts

# View the fault schedule that was applied
cat .chaosline/runs/my-tool_test_t0_*/trace.jsonl | grep "fault_schedule"
```

## Debugging Scenarios

If your scenario isn't behaving as expected, work through these in order:

1. **Check your MCP server directly:**
   ```bash
   node my-tool-server.js  # Should stay running and wait for stdio input
   ```

2. **Check that Chaosline can see your scenario:**
   ```bash
   npx chaosline list | grep my-tool
   ```

3. **Look for errors in the trace:**
   ```bash
   cat .chaosline/runs/my-tool_*/trace.jsonl | jq 'select(.kind == "error")'
   ```

4. **Test your agent without any faults:**
   ```bash
   MCP_CONFIG=./test-config.json node my-agent.ts
   ```

## Composing Multiple Faults

You can chain faults in sequence:

```yaml
faults:
  - tool: "charge"
    kind: "timeout_after_commit"
    on_call: 1
  - tool: "charge"
    kind: "retry_storm"
    on_call: 2
  - tool: "refund"
    kind: "silent_wrong_data"
    on_call: 1
```

Or apply them probabilistically:

```yaml
faults:
  - tool: "api_call"
    kind: "timeout"
    probability: 0.3  # 30% of calls will timeout
```

Or conditionally based on the request:

```yaml
faults:
  - tool: "process"
    kind: "malformed_response"
    when: "request.amount > 1000"  # Only triggers for large amounts
```

## Sharing Scenarios with Your Team

Commit your scenarios to your repo's `scenarios/` directory:

```
my-project/
  scenarios/
    my-tool/
      basic.yaml
      timeout-after-commit.yaml
      invalid-response.yaml
  agent.ts
  package.json
```

Chaosline loads scenarios from both its built-in presets and from your local `./scenarios/` directory. If you give a local scenario the same ID as a built-in one, yours takes precedence.

## Next Steps

- [Running Tests](/docs/running-tests): Run your scenarios
- [Understanding Results](/docs/understanding-results): Interpret verdicts
- [Architecture](/docs/architecture): How faults work internally
