// Tier 2 `rate_limit_429`. Pre-call: never reaches the child, returns a tool-level
// error (isError:true, not a JSON-RPC error — a rate limit is the server's tool
// answering "not now", not a protocol failure) carrying a Retry-After hint in the
// text. Tests whether the agent honors the advertised interval rather than
// immediately retrying.
export interface RateLimit429Params {
  retry_after_s?: number;
}

export function applyRateLimit429(id: unknown, params: RateLimit429Params = {}) {
  const retryAfterS = params.retry_after_s ?? 5;
  return {
    jsonrpc: "2.0",
    id,
    result: {
      resultType: "complete",
      isError: true,
      content: [
        {
          type: "text",
          text: `429 Too Many Requests. Retry-After: ${retryAfterS}s`,
        },
      ],
    },
  };
}
