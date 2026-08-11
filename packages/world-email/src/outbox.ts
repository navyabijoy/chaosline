// In-memory email outbox. One process's worth of state — the MCP entrypoint
// (./bin/mcp-server.ts) is what gives this a lifetime across a chaosline run.

export interface OutboxMessage {
  message_id: string;
  to: string;
  subject: string;
  body: string;
  at_call_number: number;
}

export interface SendEmailResult {
  message_id: string;
  status: "sent";
}

const outbox: OutboxMessage[] = [];

export function sendEmail(to: string, subject: string, body: string): SendEmailResult {
  const message_id = `em_${outbox.length + 1}_${Math.random().toString(36).slice(2, 8)}`;
  outbox.push({
    message_id,
    to,
    subject,
    body,
    at_call_number: outbox.length + 1,
  });
  return { message_id, status: "sent" };
}

export function getOutbox(): OutboxMessage[] {
  return outbox.slice();
}

export function resetOutbox(): void {
  outbox.length = 0;
}
