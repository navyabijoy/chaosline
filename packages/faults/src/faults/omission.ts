// Tier 1 `omission` — highest-yield fault class per ASE 2026: the response is still
// valid and well-formed, which is exactly why it's
// dangerous — nothing errors, so no retry logic and no catch block ever fires. The
// agent has to decide whether absence is information or failure, and usually
// assumes information. Post-call: drop fields, truncate arrays, or blank the
// payload entirely, per params.
import { readContentJson, writeContentJson } from "../content-json";

export interface OmissionParams {
  /** "empty" replaces the whole payload; "drop_fields" removes named fields; "truncate_array" keeps only the first N elements of an array field. */
  mode: "empty" | "drop_fields" | "truncate_array";
  fields?: string[];
  arrayField?: string;
  keep?: number;
}

export function applyOmission(response: any, params: OmissionParams): any {
  if (params.mode === "empty") {
    return writeContentJson(response, {});
  }

  const payload = readContentJson(response);
  if (typeof payload !== "object" || payload === null) return response;
  const mutated = { ...(payload as Record<string, unknown>) };

  if (params.mode === "drop_fields") {
    for (const field of params.fields ?? []) delete mutated[field];
  } else if (params.mode === "truncate_array" && params.arrayField) {
    const arr = mutated[params.arrayField];
    if (Array.isArray(arr)) mutated[params.arrayField] = arr.slice(0, params.keep ?? 0);
  }

  return writeContentJson(response, mutated);
}
