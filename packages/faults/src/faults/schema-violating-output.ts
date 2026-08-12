// Tier 2b `schema_violating_output`. Post-call: returns well-formed JSON that
// violates the tool's declared `outputSchema` (servers MUST conform but clients
// only SHOULD validate — most don't). Corrupts one
// field's type (e.g. a number becomes a string) rather than removing it, which is
// what makes this invisible to a byte-matching proxy: the response is valid JSON,
// just the wrong shape.
import { readContentJson, writeContentJson } from "../content-json";

export interface SchemaViolatingOutputParams {
  field: string;
}

export function applySchemaViolatingOutput(response: any, params: SchemaViolatingOutputParams): any {
  const payload = readContentJson(response);
  if (typeof payload !== "object" || payload === null || !(params.field in payload)) {
    return response;
  }
  const mutated = { ...(payload as Record<string, unknown>) };
  const original = mutated[params.field];
  mutated[params.field] = typeof original === "number" ? String(original) : { unexpected_shape: original };
  return writeContentJson(response, mutated);
}
