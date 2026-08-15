import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

interface FrameworkSignature {
  name: string;
  matches: (pkg: Record<string, unknown> | null, pyReqs: string[]) => "package.json" | "requirements.txt" | false;
}

function hasAnyDep(pkg: Record<string, unknown> | null, deps: string[]): boolean {
  if (!pkg) return false;
  const all = { ...(pkg.dependencies as object), ...(pkg.devDependencies as object) };
  return deps.some((d) => d in all);
}

function pyDepMatch(pyReqs: string[], needle: string): boolean {
  return pyReqs.some((r) => r.toLowerCase().startsWith(needle.toLowerCase()));
}

function matchIn(pkg: Record<string, unknown> | null, pkgDeps: string[], py: string[], pyNeedle: string): "package.json" | "requirements.txt" | false {
  if (hasAnyDep(pkg, pkgDeps)) return "package.json";
  if (pyDepMatch(py, pyNeedle)) return "requirements.txt";
  return false;
}

const FRAMEWORK_SIGNATURES: FrameworkSignature[] = [
  { name: "langchain", matches: (pkg, py) => matchIn(pkg, ["langchain", "@langchain/core"], py, "langchain") },
  { name: "openai-agents-sdk", matches: (pkg, py) => matchIn(pkg, ["openai-agents"], py, "openai-agents") },
  { name: "claude-agent-sdk", matches: (pkg) => (hasAnyDep(pkg, ["@anthropic-ai/claude-agent-sdk", "claude-agent-sdk"]) ? "package.json" : false) },
  { name: "raw-mcp-client", matches: (pkg, py) => matchIn(pkg, ["@modelcontextprotocol/sdk"], py, "mcp") },
  { name: "unknown", matches: () => false },
];

function detectFramework(): { name: string; evidence: string } {
  let pkg: Record<string, unknown> | null = null;
  if (existsSync("./package.json")) {
    try {
      pkg = JSON.parse(readFileSync("./package.json", "utf8"));
    } catch {
      pkg = null;
    }
  }
  let pyReqs: string[] = [];
  if (existsSync("./requirements.txt")) {
    pyReqs = readFileSync("./requirements.txt", "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
  }

  for (const sig of FRAMEWORK_SIGNATURES) {
    const matchedFrom = sig.matches(pkg, pyReqs);
    if (matchedFrom) {
      return { name: sig.name, evidence: matchedFrom };
    }
  }
  return { name: "unknown", evidence: "no manifest matched a known framework" };
}

// These live inside the installed package (see scripts/copy-presets.mjs), so the
// reference resolves for any project with chaosline installed — no dependency on
// the source repo being reachable.
// $schema is relative to scenarios/example/*.yaml; the console pointer is relative to cwd.
const SCHEMA_PATH_FROM_YAML = "../../node_modules/chaosline/dist/schema/scenario.schema.json";
const GUIDE_PATH_FROM_CWD = "./node_modules/chaosline/dist/guide/writing-a-scenario.md";

const EXAMPLE_TIMEOUT_YAML = `# Edit "tool" below to one of your own server's real tool names, and point
# customServerCommand at your real MCP server once you've wired it up.
$schema: "${SCHEMA_PATH_FROM_YAML}"
id: example/my-tool-timeout
version: 1
world: custom
tool: my_tool
tags: [smoke]
description: >
  The tool's side effect lands, then the response is lost — the classic
  non-idempotent-retry bug. See ${GUIDE_PATH_FROM_CWD}.
customServerCommand:
  command: node
  args: ["./mcp/my-server"]
faults:
  - target: my_tool
    kind: timeout_after_commit
    on_call: 1
`;

const EXAMPLE_WRONG_DATA_YAML = `$schema: "${SCHEMA_PATH_FROM_YAML}"
id: example/my-tool-wrong-data
version: 1
world: custom
tool: my_tool
tags: [smoke]
description: >
  The tool commits one value but returns a different one in its response —
  does your agent notice, or report the wrong number confidently?
customServerCommand:
  command: node
  args: ["./mcp/my-server"]
faults:
  - target: my_tool
    kind: silent_wrong_data
    on_call: 1
    params: { field: "amount", value: 1 }
`;

const MCP_TEMPLATE = {
  mcpServers: {
    "my-tool": {
      command: "node",
      args: ["<path to your real MCP server>"],
      env: {
        CHAOSLINE_FAULT_SCHEDULE: "<injected automatically by `chaosline run`>",
      },
    },
  },
};

function writeUnlessExists(path: string, content: string): void {
  if (existsSync(path)) {
    console.log(`chaosline: ${path} already exists, skipping (delete it to regenerate)`);
    return;
  }
  writeFileSync(path, content);
  console.log(`chaosline: wrote ${path}`);
}

export function initCommand(_args: string[]): void {
  const detected = detectFramework();
  console.log(`chaosline: detected framework: ${detected.name} (${detected.evidence})`);

  mkdirSync(".chaosline", { recursive: true });
  mkdirSync("scenarios/example", { recursive: true });

  writeUnlessExists(
    ".chaosline/config.json",
    JSON.stringify({ detectedFramework: detected.name, scenariosDir: "./scenarios" }, null, 2)
  );
  writeUnlessExists(".chaosline/mcp.template.json", JSON.stringify(MCP_TEMPLATE, null, 2));
  writeUnlessExists("scenarios/example/my-tool-timeout.yaml", EXAMPLE_TIMEOUT_YAML);
  writeUnlessExists("scenarios/example/my-tool-wrong-data.yaml", EXAMPLE_WRONG_DATA_YAML);

  console.log(`
Next steps:
  1. Edit .chaosline/mcp.template.json — point "command"/"args" at your real MCP server.
  2. Edit scenarios/example/*.yaml — set "tool" and "customServerCommand" to your real tool/server.
  3. Run: chaosline doctor --scenario example/my-tool-timeout -- <your agent's launch command>
     This checks the agent starts, reads MCP_CONFIG, and completes the task — before spending any trials.
  4. Once doctor passes: chaosline run --scenario example/my-tool-timeout -- <your agent's launch command>

See ${GUIDE_PATH_FROM_CWD} for a full walkthrough.`);
}
