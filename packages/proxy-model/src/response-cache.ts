import { createHash } from "node:crypto";
import type { AnthropicContentBlock } from "./proxy";

export interface TokenUsage {
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface CachedResponse {
  status: number;
  headers: Record<string, string | string[]>;
  bodyBuf: Buffer;
  content: AnthropicContentBlock[];
  usage: TokenUsage;
}

export class ResponseCache {
  private store = new Map<string, CachedResponse>();

  key(model: string, provider: string, messages: unknown, tools: unknown): string {
    // Stable hash of the request shape, excluding volatile fields (auth, request ID, etc.)
    // Use SHA256 since cache key collision silently serves wrong response (unlike fault scheduler's djb2)
    // No replacer array here — JSON.stringify's replacer, when it's an array, keeps only
    // property names listed in it at EVERY level of the object, not just the top. Passing
    // top-level key names as a replacer silently strips every nested field (role, content,
    // name, ...) from messages/tools, collapsing distinct requests onto the same hash.
    const canonical = JSON.stringify({ model, provider, messages, tools });
    return createHash("sha256").update(canonical).digest("hex");
  }

  get(key: string): CachedResponse | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: CachedResponse): void {
    this.store.set(key, entry);
  }
}
