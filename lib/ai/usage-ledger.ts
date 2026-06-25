// Per-process usage ledger — every model call records (operation, model, usage) and its dollar cost.
// Lets us answer "what does a research question / a client / a season cost?" with a measured number.
// In production this flushes to an ai_usage table per firm/run; here it's an in-memory accumulator the
// engine, benchmarks, and the cost-report script read.
import { costUsd, type TokenUsage } from "./pricing";

export type UsageEntry = { operation: string; model: string; usage: TokenUsage; costUsd: number };

// Back the store with globalThis so a single process shares ONE ledger even when ESM/tsx loads this
// module under more than one specifier (relative vs "@/" alias vs the script's path) — otherwise the
// provider records into one instance and a reader imports another, and totals read as zero.
const _store = globalThis as unknown as { __petalUsageLedger?: UsageEntry[] };
_store.__petalUsageLedger ??= [];
function ledger(): UsageEntry[] {
  return (_store.__petalUsageLedger ??= []);
}

/** Record one model call. operation is a coarse tag ("research:reason", "extraction", "agent:turn"). */
export function recordUsage(e: { operation: string; model: string; usage: TokenUsage }): void {
  ledger().push({ ...e, costUsd: costUsd(e.usage, e.model) });
}

export function ledgerEntries(): readonly UsageEntry[] {
  return ledger();
}

export function resetLedger(): void {
  _store.__petalUsageLedger = [];
}

export type LedgerTotals = {
  total: number;
  byOperation: Record<string, number>;
  byModel: Record<string, number>;
  tokens: { input: number; output: number };
  calls: number;
};

export function ledgerTotals(): LedgerTotals {
  const byOperation: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  let total = 0, input = 0, output = 0;
  for (const e of ledger()) {
    total += e.costUsd;
    byOperation[e.operation] = (byOperation[e.operation] ?? 0) + e.costUsd;
    byModel[e.model] = (byModel[e.model] ?? 0) + e.costUsd;
    input += e.usage.inputTokens + (e.usage.cacheReadTokens ?? 0) + (e.usage.cacheWriteTokens ?? 0);
    output += e.usage.outputTokens;
  }
  return { total, byOperation, byModel, tokens: { input, output }, calls: ledger().length };
}

/**
 * Re-price every recorded RAW TOKEN COUNT at a different model's rates. The key move for honest
 * production projection: measure real token counts on the codex dev path (prod key untouched), then
 * repriceAt("claude-opus-4-8") to estimate the production bill. Token counts are real; only the rate
 * card changes.
 */
export function repriceAt(model: string): number {
  return ledger().reduce((s, e) => s + costUsd(e.usage, model), 0);
}
