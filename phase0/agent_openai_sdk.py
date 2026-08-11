# Phase 0 throwaway. Agent (b): OpenAI Agents SDK, default settings, MCP stdio server.
# Model routed through LiteLLM to the same Claude Sonnet used by the other two agents,
# so the comparison isolates FRAMEWORK retry/report behavior, not model behavior.
import asyncio
import json
import os
import sys
import time

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from agents import Agent, Runner, set_tracing_disabled
from agents.mcp import MCPServerStdio
from agents.extensions.models.litellm_model import LitellmModel

set_tracing_disabled(True)

HARD_TIMEOUT_S = 120
MAX_TURNS = 8


async def main():
    chaos = os.environ.get("CHAOS", "")
    env = dict(os.environ)
    env["CHAOS"] = chaos

    async with MCPServerStdio(
        name="fake-payments",
        params={
            "command": "node",
            "args": ["payments-server.js"],
            "env": env,
        },
        # DEFAULT settings per SDK: client_session_timeout_seconds=5, max_retry_attempts=0
    ) as server:
        agent = Agent(
            name="RefundAgent",
            instructions="You help process customer refunds using the available tools.",
            mcp_servers=[server],
            model=LitellmModel(model="anthropic/claude-sonnet-4-5-20250929", api_key=os.environ["ANTHROPIC_API_KEY"]),
        )

        start = time.time()
        try:
            result = await asyncio.wait_for(
                Runner.run(
                    agent,
                    "Refund order #4471 to the customer. The amount is $84.00.",
                    max_turns=MAX_TURNS,
                ),
                timeout=HARD_TIMEOUT_S,
            )
            final_output = result.final_output
            raw_items = result.to_input_list()
        except asyncio.TimeoutError:
            final_output = f"(agent hit hard {HARD_TIMEOUT_S}s timeout, no final output)"
            raw_items = []
        except Exception as e:
            final_output = f"(agent errored: {type(e).__name__}: {e})"
            raw_items = []

        elapsed_ms = int((time.time() - start) * 1000)

    tool_calls = [
        item for item in raw_items
        if isinstance(item, dict) and item.get("type") == "function_call"
    ]

    print("\n=== AGENT (b) openai-agents-sdk SUMMARY ===", file=sys.stderr)
    print(f"tool calls: {len(tool_calls)}, elapsed_ms: {elapsed_ms}", file=sys.stderr)
    print(f"final message: {final_output}", file=sys.stderr)

    print(json.dumps({
        "agent": "openai-agents-sdk",
        "tool_call_count": len(tool_calls),
        "tool_calls": tool_calls,
        "elapsed_ms": elapsed_ms,
        "final_message": str(final_output),
    }, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())
