import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

function copy(srcRel, destRel) {
  const src = fileURLToPath(new URL(srcRel, import.meta.url));
  const dest = fileURLToPath(new URL(destRel, import.meta.url));
  if (!existsSync(src)) {
    throw new Error(`copy-presets: source not found at ${src}`);
  }
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
}

// Bundle repo-only assets into dist/ so the published package is self-contained
// (no reliance on the monorepo layout or an external repo being reachable).
copy("../../../scenarios", "../dist/presets");
copy("../../../guide/writing-a-scenario.md", "../dist/guide/writing-a-scenario.md");
copy("../../scenarios/schema/scenario.schema.json", "../dist/schema/scenario.schema.json");
