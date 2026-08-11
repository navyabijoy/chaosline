// Fixed in-memory document corpus, never mutated. The query log is the only
// state that changes — the MCP entrypoint (./bin/mcp-server.ts) is what gives
// it a lifetime across a chaosline run.

export interface Doc {
  doc_id: string;
  title: string;
  body: string;
}

export interface QueryLogEntry {
  query: string;
  result_count: number;
  at_call_number: number;
}

export interface SearchMatch {
  doc_id: string;
  title: string;
  snippet: string;
}

export interface SearchResult {
  query: string;
  results: SearchMatch[];
}

const corpus: Doc[] = [
  {
    doc_id: "doc_1",
    title: "Getting Started",
    body: "Install the CLI and run init to scaffold a new project in seconds.",
  },
  {
    doc_id: "doc_2",
    title: "Authentication",
    body: "Use API keys or OAuth tokens to authenticate requests to the platform.",
  },
  {
    doc_id: "doc_3",
    title: "Rate Limits",
    body: "Requests are limited per minute per API key; exceeding the limit returns a 429.",
  },
  {
    doc_id: "doc_4",
    title: "Webhooks",
    body: "Configure a webhook URL to receive event notifications in real time.",
  },
  {
    doc_id: "doc_5",
    title: "Billing",
    body: "View invoices and manage payment methods from the billing dashboard.",
  },
];

const queryLog: QueryLogEntry[] = [];

export function searchDocs(query: string): SearchResult {
  const needle = query.toLowerCase();
  const matches = corpus.filter(
    (d) => d.title.toLowerCase().includes(needle) || d.body.toLowerCase().includes(needle)
  );

  queryLog.push({
    query,
    result_count: matches.length,
    at_call_number: queryLog.length + 1,
  });

  return {
    query,
    results: matches.map((d) => ({
      doc_id: d.doc_id,
      title: d.title,
      snippet: d.body,
    })),
  };
}

export function getQueryLog(): QueryLogEntry[] {
  return queryLog.slice();
}

export function resetSearch(): void {
  queryLog.length = 0;
}
