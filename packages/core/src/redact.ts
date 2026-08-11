// Secret redaction for repro bundles and traces. Per AGENT.md, never leak
// API keys, auth tokens, or scenario-specific secrets to trace files.

const SECRET_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]+/g,  // Anthropic keys
  /sk-[a-zA-Z0-9_-]+/g,      // OpenAI keys
  /Bearer\s+[a-zA-Z0-9_-]+/g, // Bearer tokens
];

function redactString(str: string, extraSecrets: string[]): string {
  let result = str;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  for (const secret of extraSecrets) {
    result = result.split(secret).join("[REDACTED]");
  }
  return result;
}

export function redactSecrets(value: unknown, extraSecrets: string[] = []): unknown {
  if (typeof value === "string") {
    return redactString(value, extraSecrets);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item, extraSecrets));
  }
  const obj = value as Record<string, unknown>;
  const redacted: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    redacted[key] = redactSecrets(val, extraSecrets);
  }
  return redacted;
}
