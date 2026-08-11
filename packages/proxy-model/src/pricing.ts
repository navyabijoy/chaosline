// USD/token pricing for cost accounting. Prices are $ per million tokens. Unknown models fall back to the Sonnet rate
// rather than throwing — a missing price entry should degrade the accounting,
// not crash the proxy mid-run.

interface ModelPrice {
  inputPerMTok: number;
  outputPerMTok: number;
}

const PRICING: Record<string, ModelPrice> = {
  "claude-sonnet-4-5-20250929": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-sonnet-5": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-opus-5": { inputPerMTok: 15, outputPerMTok: 75 },
  "claude-haiku-4-5-20251001": { inputPerMTok: 0.8, outputPerMTok: 4 },
  "gpt-4o": { inputPerMTok: 2.5, outputPerMTok: 10 },
  "gpt-4o-mini": { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  "gpt-4.1": { inputPerMTok: 2, outputPerMTok: 8 },
  "gpt-4.1-mini": { inputPerMTok: 0.4, outputPerMTok: 1.6 },
  "o3": { inputPerMTok: 2, outputPerMTok: 8 },
};

const FALLBACK: ModelPrice = { inputPerMTok: 3, outputPerMTok: 15 };

// Anthropic prompt-cache multipliers, applied against the base input rate:
// a cache write costs 1.25x a normal input token, a cache read costs 0.1x.
// https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

export interface TokenUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export function costUsd(model: string, usage: TokenUsage): number {
  const price = PRICING[model] ?? FALLBACK;
  return (
    ((usage.input_tokens ?? 0) / 1_000_000) * price.inputPerMTok +
    ((usage.output_tokens ?? 0) / 1_000_000) * price.outputPerMTok +
    ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * price.inputPerMTok * CACHE_WRITE_MULTIPLIER +
    ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * price.inputPerMTok * CACHE_READ_MULTIPLIER
  );
}
