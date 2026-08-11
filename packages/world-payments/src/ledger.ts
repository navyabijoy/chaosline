// In-memory payments ledger. One process's worth of state — the MCP entrypoint
// (./bin/mcp-server.ts) is what gives this a lifetime across a chaosline run.

export interface LedgerEntry {
  refund_id: string;
  order_id: string;
  amount_cents: number;
  idempotency_key?: string;
  at_call_number: number;
}

// The response echoes back the operation it performed. Grading compares the
// figures an agent reports against the figures a tool actually returned, so a
// response that omits the amount leaves nothing to compare against.
export interface RefundResult {
  refund_id: string;
  order_id: string;
  amount_cents: number;
  status: "succeeded";
}

const ledger: LedgerEntry[] = [];

export function createRefund(
  order_id: string,
  amount_cents: number,
  idempotency_key?: string
): RefundResult {
  if (idempotency_key) {
    const existing = ledger.find((e) => e.idempotency_key === idempotency_key);
    if (existing) {
      return {
        refund_id: existing.refund_id,
        order_id: existing.order_id,
        amount_cents: existing.amount_cents,
        status: "succeeded",
      };
    }
  }

  const refund_id = `re_${ledger.length + 1}_${Math.random().toString(36).slice(2, 8)}`;
  ledger.push({
    refund_id,
    order_id,
    amount_cents,
    idempotency_key,
    at_call_number: ledger.length + 1,
  });
  return { refund_id, order_id, amount_cents, status: "succeeded" };
}

export function getLedger(): LedgerEntry[] {
  return ledger.slice();
}

export function resetLedger(): void {
  ledger.length = 0;
}
