// Tier 2 `schema_drift`. Post-call: the real call landed (or didn't — this doesn't
// care), but the field the agent expects has moved. Renames one field in the
// returned JSON payload. Realistic and rising as MCP servers version
// independently.
import { readContentJson, writeContentJson } from "../content-json.ts";

export interface SchemaDriftParams {
  from: string;
  to: string;
}

export function applySchemaDrift(response: any, params: SchemaDriftParams): any {
  const payload = readContentJson(response);
  if (typeof payload !== "object" || payload === null || !(params.from in payload)) {
    return response;
  }
  const mutated = { ...(payload as Record<string, unknown>) };
  mutated[params.to] = mutated[params.from];
  delete mutated[params.from];
  return writeContentJson(response, mutated);
}
