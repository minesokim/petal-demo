// AI cost meter — turns token counts into dollars. The moat is a MEASURED error rate; cost should be
// a measured number too, not a guess. Pure + configurable: update MODEL_PRICING from the vendor pricing
// page; everything downstream (ledger, projections) recomputes. Rates are $ per MILLION tokens.
//
// VERIFY against https://www.anthropic.com/pricing before relying on the absolute numbers — these are
// the standard published tiers (cacheWrite = 1.25× input, cacheRead = 0.10× input). The STRUCTURE
// (input + output + cache-read + cache-write each priced separately) is what makes the meter correct.

export type TokenUsage = {
  /** uncached input tokens billed at the full input rate */
  inputTokens: number;
  outputTokens: number;
  /** input served from the prompt cache (≈10% of input price) */
  cacheReadTokens?: number;
  /** input written to the prompt cache (≈125% of input price) */
  cacheWriteTokens?: number;
};

/** $ per million tokens. */
export type ModelPrice = { input: number; output: number; cacheRead: number; cacheWrite: number };

export const MODEL_PRICING: Record<string, ModelPrice> = {
  // Anthropic — the PRODUCTION path (ZDR/§7216).
  opus: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
  sonnet: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  haiku: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
  // OpenAI GPT-5.x — the DEV/eval path only (codex proxy); approximate, for dev accounting.
  "gpt-5.5": { input: 1.25, output: 10, cacheRead: 0.125, cacheWrite: 1.25 },
};

/** Map a concrete model id (e.g. "claude-opus-4-8") to a MODEL_PRICING key, or null if unknown. */
export function priceKeyForModel(model: string): keyof typeof MODEL_PRICING | null {
  const m = model.toLowerCase();
  if (m.includes("opus")) return "opus";
  if (m.includes("sonnet")) return "sonnet";
  if (m.includes("haiku")) return "haiku";
  if (m.includes("gpt-5") || m.includes("gpt5")) return "gpt-5.5";
  return null;
}

/** Dollar cost of one usage record at a model's rates. Unknown models (e.g. "mock") cost $0. */
export function costUsd(usage: TokenUsage, model: string): number {
  const key = priceKeyForModel(model);
  const p = key ? MODEL_PRICING[key] : null;
  if (!p) return 0;
  const M = 1_000_000;
  return (
    (usage.inputTokens * p.input) / M +
    (usage.outputTokens * p.output) / M +
    ((usage.cacheReadTokens ?? 0) * p.cacheRead) / M +
    ((usage.cacheWriteTokens ?? 0) * p.cacheWrite) / M
  );
}
