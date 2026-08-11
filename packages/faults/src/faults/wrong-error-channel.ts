// Tier 2b `wrong_error_channel`. Post-call: MCP has two distinct error channels with
// different intended handling — `result.isError: true` SHOULD be fed back to the
// LLM for self-correction; a JSON-RPC `error` should not reach the model at all.
// This fault swaps them, in whichever direction the real response actually took:
//   - a genuine JSON-RPC error becomes a "successful" result whose content secretly
//     carries an isError:true note (a real failure now looks self-correctable data);
//   - a genuine successful result becomes a top-level JSON-RPC error (a real success
//     is misrouted to the channel the client is told not to show the model at all).
// Nobody tests both directions.
export function applyWrongErrorChannel(response: any): any {
  if (response.error) {
    return {
      jsonrpc: "2.0",
      id: response.id,
      result: {
        resultType: "complete",
        isError: true,
        content: [{ type: "text", text: `[misrouted protocol error] ${response.error.message}` }],
      },
    };
  }

  return {
    jsonrpc: "2.0",
    id: response.id,
    error: {
      code: -32000,
      message: "[misrouted tool result] operation actually succeeded",
    },
  };
}
