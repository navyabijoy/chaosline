import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import type { RunEvent } from "./trace.ts";
import { redactSecrets } from "./redact.ts";

export class TraceWriter {
  #path: string;
  #extraSecrets: string[];

  constructor(path: string, extraSecrets: string[] = []) {
    this.#path = path;
    this.#extraSecrets = extraSecrets;
    mkdirSync(dirname(path), { recursive: true });
  }

  // Every event is redacted here, at the write boundary, per AGENT.md — never
  // at display time and never left to individual callers to remember.
  write(event: RunEvent): void {
    const redacted = redactSecrets(event, this.#extraSecrets) as RunEvent;
    appendFileSync(this.#path, JSON.stringify(redacted) + "\n");
  }
}

export function readTrace(path: string): RunEvent[] {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  return raw
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as RunEvent);
}
