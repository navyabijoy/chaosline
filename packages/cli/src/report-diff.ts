// Compare two reports (base branch vs head) and render a regression diff for
// CI PR comments. Invoked as `chaosline report-diff --base <path> --head <path>`.

import { readFileSync, existsSync } from "node:fs";
import { diffReports, renderDiffMarkdown, type Report } from "@chaosline/reporter";

export function reportDiffCommand(args: string[]): void {
  const baseIdx = args.indexOf("--base");
  const basePath = baseIdx !== -1 ? args[baseIdx + 1] : undefined;
  if (!basePath) {
    console.error("chaosline report-diff: missing --base <path>");
    process.exit(2);
  }
  if (!existsSync(basePath)) {
    console.error(`chaosline report-diff: base report not found: ${basePath}`);
    process.exit(2);
  }

  const headIdx = args.indexOf("--head");
  const headPath = headIdx !== -1 ? args[headIdx + 1] : undefined;
  if (!headPath) {
    console.error("chaosline report-diff: missing --head <path>");
    process.exit(2);
  }
  if (!existsSync(headPath)) {
    console.error(`chaosline report-diff: head report not found: ${headPath}`);
    process.exit(2);
  }

  try {
    const base = JSON.parse(readFileSync(basePath, "utf8")) as Report;
    const head = JSON.parse(readFileSync(headPath, "utf8")) as Report;
    const diff = diffReports(base, head);
    console.log(renderDiffMarkdown(diff));
  } catch (e) {
    console.error(`chaosline report-diff: invalid report JSON: ${(e as Error).message}`);
    process.exit(2);
  }
}
