// Per-process usage ledger — every model call records (operation, model, usage) and its dollar cost.
// Lets us answer "what does a research question / a client / a season cost?" with a measured number.
// In production this flushes to an ai_usage table per firm/run; here it's an in-memory accumulator the
// engine, benchmarks, and the cost-report script read.
import { AsyncLocalStorage } from "node:async_hooks";
import { costUsd, type TokenUsage } from "./pricing";

export type UsageEntry = { operation: string; model: string; usage: TokenUsage; costUsd: number };

// Two storage tiers so the meter is correct in BOTH worlds:
//   - AsyncLocalStorage (request scope): in a concurrent server, runWithUsageScope() gives each request
//     its own entries array, so two firms' simultaneous research calls never cross-contaminate. This is
//     the multi-tenant-correct path — per-firm cost must not leak across requests.
//   - globalThis (process fallback): scripts/benchmarks with no scope share ONE ledger. globalThis (not
//     a module-level let) so a single process shares it even when ESM/tsx loads this module under more
//     than one specifier (relative vs "@/" alias vs a script path) — else a recorder and a reader get
//     separate instances and totals read as zero.
const als = new AsyncLocalStorage<UsageEntry[]>();
const _store = globalThis as unknown as { __petalUsageLedger?: UsageEntry[] };
_store.__petalUsageLedger ??= [];
function ledger(): UsageEntry[] {
  return als.getStore() ?? (_store.__petalUsageLedger ??= []);
}

/**
 * Run `fn` with a request-scoped ledger. recordUsage() inside fn (including in awaited provider calls)
 * records ONLY into this scope's entries; the global ledger is untouched. Returns the fn result plus the
 * scoped entries (snapshot) — flush those to ai_usage with the firm context. Use at every server entry
 * point (research route, agent run) so per-firm cost is accurate under concurrency.
 */
export async function runWithUsageScope<T>(fn: () => Promise<T>): Promise<{ result: T; entries: UsageEntry[] }> {
  const entries: UsageEntry[] = [];
  const result = await als.run(entries, fn);
  return { result, entries: [...entries] };
}

/** Record one model call. operation is a coarse tag ("research:reason", "extraction", "agent:turn"). */
export function recordUsage(e: { operation: string; model: string; usage: TokenUsage }): void {
  ledger().push({ ...e, costUsd: costUsd(e.usage, e.model) });
}

export function ledgerEntries(): readonly UsageEntry[] {
  return ledger();
}

export function resetLedger(): void {
  ledger().length = 0; // clears the active store (request scope if present, else the global one)
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
