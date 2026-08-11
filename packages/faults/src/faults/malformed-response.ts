// Tier 2 `malformed_response`. Pre-call: never reaches the child. Returns a raw,
// deliberately non-JSON-RPC line — tests the client library's parser robustness,
// not the agent's reasoning. A crash here is still UNSAFE_FAILURE, not a free pass
// just because it's "the library's fault."
export function applyMalformedResponse(id: unknown): string {
  // Truncated mid-object on purpose — not even balanced braces.
  return `{"jsonrpc":"2.0","id":${JSON.stringify(id)},"result":{"content":[{"type":"text","tex`;
}
