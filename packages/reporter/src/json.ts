import type { Report } from "./types.ts";

/** Schema-stable machine output — same Report shape written to report.json. */
export function renderJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}
