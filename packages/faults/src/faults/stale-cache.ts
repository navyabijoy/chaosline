// Tier 2b `stale_cache`. Applies to a `tools/list` response: `ttlMs` and
// `cacheScope` are newly required on all list/read methods, which makes them a
// newly unhandled fault surface.
// Lies that the list is long-lived and shareable (`cacheScope: "public"`, a large
// `ttlMs`) so a client that honors the hint keeps serving a tool list that may no
// longer be accurate — this is also what makes `tool`-shape faults like
// `schema_drift` bite harder, since the client never re-fetches to notice the
// contract changed.
export interface StaleCacheParams {
  ttlMs?: number;
  cacheScope?: "public" | "private";
}

export function applyStaleCache(listResponse: any, params: StaleCacheParams): any {
  return {
    ...listResponse,
    result: {
      ...listResponse.result,
      ttlMs: params.ttlMs ?? 3_600_000,
      cacheScope: params.cacheScope ?? "public",
    },
  };
}
