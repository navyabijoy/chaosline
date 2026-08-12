// Per-world facts run.ts needs to launch a world's MCP server and grade its
// state snapshot generically. A lookup table, not a plugin system — every world
// package already exposes a uniform shape (an ./mcp-server bin export, a
// snapshot file written on every mutating call, gated by an env var), so there
// is nothing here beyond the handful of facts that differ between them.

import type { WorldKey } from "./types";

export interface WorldAdapter {
  /** Import specifier resolved via import.meta.resolve. Empty for "custom" —
   * that world launches the scenario's own customServerCommand instead. */
  binSpecifier: string;
  /** Env var the world's mcp-server bin reads to know where to write its state
   * snapshot on every mutating tool call. */
  snapshotEnvVar: string;
  /** Key used in the generated mcp-config.json's mcpServers map. */
  serverKey: string;
  /** Fingerprint for noDuplicateSideEffect — deliberately excludes per-call
   * fields like at_call_number, since a retry produces a new call index by
   * definition and including it would defeat duplicate detection entirely. */
  fingerprint: (entry: any) => string;
  /** Identifier fields for noOrphanedMutation's residue report. */
  identifierFields: string[];
  /**
   * True for a world whose only tool is a read: every call still appends to a
   * log-shaped snapshot (so snapshot length alone can't signal task
   * completion the way it does for a mutating world), and a legitimate retry
   * of the same read produces two log entries with the same fingerprint (so
   * noDuplicateSideEffect would otherwise misfire on correct behavior).
   * gradeTrial skips duplicate/orphaned-mutation checks and derives
   * taskCompleted from the trace instead of the snapshot for these worlds.
   */
  readOnly?: boolean;
}

export const WORLDS: Record<WorldKey, WorldAdapter> = {
  payments: {
    binSpecifier: "@chaosline/world-payments/mcp-server",
    snapshotEnvVar: "CHAOSLINE_LEDGER_PATH",
    serverKey: "payments",
    fingerprint: (e) =>
      e.idempotency_key ? `key:${e.idempotency_key}` : `fingerprint:${e.order_id}:${e.amount_cents}`,
    identifierFields: ["order_id", "refund_id"],
  },
  db: {
    binSpecifier: "@chaosline/world-db/mcp-server",
    snapshotEnvVar: "CHAOSLINE_DB_SNAPSHOT_PATH",
    serverKey: "db",
    fingerprint: (e) =>
      e.idempotency_key ? `key:${e.idempotency_key}` : `fingerprint:${e.customer_id}:${e.delta_cents}`,
    identifierFields: ["customer_id"],
  },
  email: {
    binSpecifier: "@chaosline/world-email/mcp-server",
    snapshotEnvVar: "CHAOSLINE_EMAIL_SNAPSHOT_PATH",
    serverKey: "email",
    fingerprint: (e) => `fingerprint:${e.to}:${e.subject}:${e.body}`,
    identifierFields: ["message_id", "to"],
  },
  fs: {
    binSpecifier: "@chaosline/world-fs/mcp-server",
    snapshotEnvVar: "CHAOSLINE_FS_SNAPSHOT_PATH",
    serverKey: "fs",
    fingerprint: (e) => `fingerprint:${e.path}`,
    identifierFields: ["path"],
  },
  http: {
    binSpecifier: "@chaosline/world-http/mcp-server",
    snapshotEnvVar: "CHAOSLINE_HTTP_SNAPSHOT_PATH",
    serverKey: "http",
    fingerprint: (e) => `fingerprint:${e.subject}:${e.body}`,
    identifierFields: ["ticket_id", "subject"],
  },
  search: {
    binSpecifier: "@chaosline/world-search/mcp-server",
    snapshotEnvVar: "CHAOSLINE_SEARCH_SNAPSHOT_PATH",
    serverKey: "search",
    fingerprint: (e) => `fingerprint:${e.query}`,
    identifierFields: ["query"],
    readOnly: true,
  },
  custom: {
    binSpecifier: "",
    snapshotEnvVar: "CHAOSLINE_CUSTOM_SNAPSHOT_PATH",
    serverKey: "custom",
    // Best-effort generic fallback: chaosline cannot know the shape of an
    // arbitrary team's tool responses. A custom scenario that needs precise
    // dedup/residue semantics should escalate to the code API and supply its
    // own grading, rather than relying on this default.
    fingerprint: (e) => JSON.stringify(e),
    identifierFields: [],
  },
};

/** world-fs snapshots as Record<path, content> instead of an array like every
 * other world — this is the one shape difference callers need to handle before
 * passing a snapshot into the (array-typed) grader invariants. */
export function normalizeWorldSnapshot(world: WorldKey, raw: unknown): unknown[] {
  if (world === "fs") {
    return Object.entries(raw as Record<string, string>).map(([path, content]) => ({ path, content }));
  }
  return raw as unknown[];
}
