// In-memory customers table. One process's worth of state — the MCP entrypoint
// (./bin/mcp-server.ts) is what gives this a lifetime across a chaosline run.

export interface CustomerRow {
  customer_id: string;
  balance_cents: number;
}

export interface Transaction {
  customer_id: string;
  delta_cents: number;
  idempotency_key?: string;
  balance_after: number;
  at_call_number: number;
}

export type BalanceQueryResult =
  | CustomerRow
  | { customer_id: string; error: "not_found" };

const customers: CustomerRow[] = [
  { customer_id: "cust_1", balance_cents: 500000 },
  { customer_id: "cust_2", balance_cents: 120000 },
];

const transactions: Transaction[] = [];

export function queryBalance(customer_id: string): BalanceQueryResult {
  const row = customers.find((c) => c.customer_id === customer_id);
  if (!row) return { customer_id, error: "not_found" };
  return { ...row };
}

export function updateBalance(
  customer_id: string,
  delta_cents: number,
  idempotency_key?: string
): Transaction {
  if (idempotency_key) {
    const existing = transactions.find((t) => t.idempotency_key === idempotency_key);
    if (existing) {
      return existing;
    }
  }

  const row = customers.find((c) => c.customer_id === customer_id);
  if (row) {
    row.balance_cents += delta_cents;
  }

  const transaction: Transaction = {
    customer_id,
    delta_cents,
    idempotency_key,
    balance_after: row ? row.balance_cents : delta_cents,
    at_call_number: transactions.length + 1,
  };
  transactions.push(transaction);
  return transaction;
}

export function getTransactions(): Transaction[] {
  return transactions.slice();
}

export function resetDb(): void {
  customers.length = 0;
  customers.push(
    { customer_id: "cust_1", balance_cents: 500000 },
    { customer_id: "cust_2", balance_cents: 120000 }
  );
  transactions.length = 0;
}
