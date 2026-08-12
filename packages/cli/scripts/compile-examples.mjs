import { readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

// Node refuses to strip TypeScript types for .ts files under node_modules
// (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING) — and once this package is
// installed, examples/ ends up inside node_modules/chaosline. So the shipped
// example agents must be plain, pre-compiled .js, not raw .ts.
//
// No bundling here: these files only import node: builtins and bare package
// specifiers (their own package.json declares those deps for a real install),
// no relative imports — so this is a type-strip-and-transpile, not a bundle.
const examplesDir = fileURLToPath(new URL("../examples", import.meta.url));

for (const dir of readdirSync(examplesDir, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const tsPath = `${examplesDir}/${dir.name}/agent.ts`;
  const jsPath = `${examplesDir}/${dir.name}/agent.js`;
  const result = await esbuild.transform(readFileSync(tsPath, "utf8"), {
    loader: "ts",
    format: "esm",
    target: "node20",
    sourcefile: tsPath,
  });
  rmSync(jsPath, { force: true });
  writeFileSync(jsPath, result.code);
}
