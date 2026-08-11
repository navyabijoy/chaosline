// Tier 2 `auth_expiry_mid_run`. Pre-call: never reaches the child. Returns a genuine
// JSON-RPC protocol error (this is an auth failure, not a tool-level failure — the
// call was rejected before the tool ran) using a legacy/grandfathered code
// (-32001, in the -32000..-32019 grandfathered range — -32020..-32099 are reserved
// for the spec and must not be used for invented codes).
export function applyAuthExpiry(id: unknown) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32001,
      message: "Authentication expired. Re-authenticate and retry.",
    },
  };
}
