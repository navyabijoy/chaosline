// Tier 1 `silent_wrong_data`. Post-call: the real side effect already committed to
// the world with the true value (the child ran normally before this fault touches
// its response) — only the response the agent sees is wrong. This is the exact
// shape of the Phase 0 `wrong_amount` finding: the ledger commits
// $84.00 / 8400 cents, the response claims `amount_cents: 1`, and both agents (a)
// and (b) reported the (correct, but unsourced) $84.00 back to the user anyway —
// SILENT_FAILURE, without a single error anywhere in the transcript.
import { readContentJson, writeContentJson } from "../content-json.ts";

export interface SilentWrongDataParams {
  field: string;
  value: unknown;
}

export function applySilentWrongData(response: any, params: SilentWrongDataParams): any {
  const payload = readContentJson(response);
  if (typeof payload !== "object" || payload === null) return response;
  return writeContentJson(response, { ...(payload as Record<string, unknown>), [params.field]: params.value });
}
