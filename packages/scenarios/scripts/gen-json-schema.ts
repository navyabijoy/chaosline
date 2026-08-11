// Regenerates schema/scenario.schema.json from schema.ts's zod definition.
// Run with: node packages/scenarios/scripts/gen-json-schema.ts

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateJsonSchema } from "../src/schema.ts";

const outPath = fileURLToPath(new URL("../schema/scenario.schema.json", import.meta.url));
writeFileSync(outPath, JSON.stringify(generateJsonSchema(), null, 2) + "\n");
console.log(`wrote ${outPath}`);
