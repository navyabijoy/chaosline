// Tier 2b `capability_downgrade`. Mutates the outgoing request before it reaches the
// child: strips `clientCapabilities` from `_meta`. Per docs/09-mcp-spec-notes.md,
// every request carries `_meta.clientCapabilities`, read per-request (no
// `initialize` handshake to downgrade in 2026-07-28). Cleanly suppresses whatever a
// well-behaved agent would have used that channel for, without touching the call's
// arguments — tests whether the agent degrades sanely or hangs waiting for a
// capability that silently isn't there anymore.
export function applyCapabilityDowngrade(request: Record<string, unknown>): Record<string, unknown> {
  const params = { ...(request.params as Record<string, unknown> | undefined) };
  const meta = { ...(params._meta as Record<string, unknown> | undefined) };
  delete meta.clientCapabilities;
  params._meta = meta;
  return { ...request, params };
}
