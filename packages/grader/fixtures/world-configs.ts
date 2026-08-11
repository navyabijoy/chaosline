// Per-world shape used only to generate the Phase 4 hand-label calibration set
// (packages/grader/fixtures/generate.ts). Not a scenario DSL (docs/05-roadmap.md
// Phase 6 is where that would live) — just enough per-world knowledge to build
// varied, realistic-looking traces across all six wired worlds.
export interface WorldConfig {
  world: string;
  tool: string;
  args: (v: number) => Record<string, unknown>;
  /** Returns undefined for read-only worlds (search) that never mutate. */
  entry?: (v: number) => Record<string, unknown>;
  resultBody: (entry: Record<string, unknown> | undefined, args: Record<string, unknown>) => Record<string, unknown>;
  /** Fields that define "the same logical operation" when there's no idempotency key — serializable, unlike a fingerprint function, so it can ride along in the JSON fixture. */
  dedupeFields: string[];
  identifierFields: string[];
}

export const WORLD_CONFIGS: WorldConfig[] = [
  {
    world: "payments",
    tool: "create_refund",
    args: (v) => ({ order_id: `ord_${v}`, amount_cents: 8400 }),
    entry: (v) => ({ refund_id: `re_${v}`, order_id: `ord_${v}`, amount_cents: 8400, at_call_number: 1 }),
    resultBody: (entry) => ({ refund_id: entry?.refund_id, amount_cents: entry?.amount_cents }),
    dedupeFields: ["order_id", "amount_cents"],
    identifierFields: ["order_id", "refund_id"],
  },
  {
    world: "db",
    tool: "adjust_balance",
    args: (v) => ({ customer_id: `cust_${v}`, delta_cents: -500 }),
    entry: (v) => ({ customer_id: `cust_${v}`, delta_cents: -500, balance_after: 499500, at_call_number: 1 }),
    resultBody: (entry) => ({ customer_id: entry?.customer_id, balance_after: entry?.balance_after }),
    dedupeFields: ["customer_id", "delta_cents"],
    identifierFields: ["customer_id"],
  },
  {
    world: "email",
    tool: "send_email",
    args: (v) => ({ to: `user${v}@example.com`, subject: `Re: ticket ${v}`, body: "Your request update." }),
    entry: (v) => ({
      message_id: `em_${v}`,
      to: `user${v}@example.com`,
      subject: `Re: ticket ${v}`,
      body: "Your request update.",
      at_call_number: 1,
    }),
    resultBody: (entry) => ({ message_id: entry?.message_id, status: "sent" }),
    dedupeFields: ["to", "subject"],
    identifierFields: ["message_id", "to"],
  },
  {
    world: "fs",
    tool: "write_file",
    args: (v) => ({ path: `/tmp/report_${v}.txt`, content: "quarterly figures" }),
    entry: (v) => ({ path: `/tmp/report_${v}.txt`, content: "quarterly figures", bytes_written: 18, status: "written" }),
    resultBody: (entry) => ({ path: entry?.path, bytes_written: entry?.bytes_written, status: "written" }),
    dedupeFields: ["path"],
    identifierFields: ["path"],
  },
  {
    world: "http",
    tool: "create_ticket",
    args: (v) => ({ subject: `Issue ${v}`, body: "Customer reported a problem." }),
    entry: (v) => ({
      ticket_id: `tk_${v}`,
      subject: `Issue ${v}`,
      body: "Customer reported a problem.",
      status: "open",
      at_call_number: 1,
    }),
    resultBody: (entry) => ({ ticket_id: entry?.ticket_id, status: "open" }),
    dedupeFields: ["subject"],
    identifierFields: ["ticket_id", "subject"],
  },
  {
    world: "search",
    tool: "search_docs",
    args: (v) => ({ query: `refund policy ${v}` }),
    resultBody: (_entry, args) => ({
      query: args.query,
      results: [{ doc_id: `d_${args.query}`, title: "Refund policy", snippet: "Refunds process within..." }],
    }),
    dedupeFields: [],
    identifierFields: [],
  },
];
