// In-memory ticket system. One process's worth of state — the MCP entrypoint
// (./bin/mcp-server.ts) is what gives this a lifetime across a chaosline run.

export interface Ticket {
  ticket_id: string;
  subject: string;
  body: string;
  status: "open";
  at_call_number: number;
}

export type GetTicketResult = Ticket | { ticket_id: string; error: "not_found" };

const tickets: Ticket[] = [];

export function createTicket(subject: string, body: string): Ticket {
  const ticket_id = `tk_${tickets.length + 1}_${Math.random().toString(36).slice(2, 8)}`;
  const ticket: Ticket = {
    ticket_id,
    subject,
    body,
    status: "open",
    at_call_number: tickets.length + 1,
  };
  tickets.push(ticket);
  return ticket;
}

export function getTicket(ticket_id: string): GetTicketResult {
  const ticket = tickets.find((t) => t.ticket_id === ticket_id);
  if (!ticket) return { ticket_id, error: "not_found" };
  return ticket;
}

export function getTickets(): Ticket[] {
  return tickets.slice();
}

export function resetTickets(): void {
  tickets.length = 0;
}
