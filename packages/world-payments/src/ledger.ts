// In-memory payments ledger. One process's worth of state — the MCP entrypoint
// (./bin/mcp-server.ts) is what gives this a lifetime across a chaosline run.

export interface LedgerEntry {
  refund_id: string;
  order_id: string;
  amount_cents: number;
  idempotency_key?: string;
  at_call_number: number;
}

export interface RefundResult {
  refund_id: string;
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
      return { refund_id: existing.refund_id, status: "succeeded" };
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
  return { refund_id, status: "succeeded" };
}

export function getLedger(): LedgerEntry[] {
  return ledger.slice();
}

export function resetLedger(): void {
  ledger.length = 0;
}
