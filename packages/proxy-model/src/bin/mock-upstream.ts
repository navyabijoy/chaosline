#!/usr/bin/env node
// Standalone launcher: `node bin/mock-upstream.ts --port 8788`. See mock-upstream.ts
// for what it replays and why it exists.
import { startMockUpstream } from "../mock-upstream";

const portIdx = process.argv.indexOf("--port");
const port = portIdx !== -1 ? Number(process.argv[portIdx + 1]) : 8788;

const handle = await startMockUpstream(port);
console.log(`mock-upstream: listening on ${handle.url}`);
