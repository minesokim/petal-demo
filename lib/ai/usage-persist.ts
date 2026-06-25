// Flush the in-memory usage ledger to durable storage (the ai_usage table). Driver-agnostic: the
// caller supplies the writer (service-role insert), so this stays pure + unit-testable and the DB
// wiring lives at the call site (after a research call / agent run, with the firm context in hand).
import { ledgerEntries, resetLedger, type UsageEntry } from "./usage-ledger";

export type PersistRow = {
  firmId: string;
  runId: string | null;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
};

export type UsageWriter = (rows: PersistRow[]) => Promise<void>;

/** Shape ledger entries into ai_usage rows tagged with the firm (+ optional run correlation). */
export function entriesToRows(entries: readonly UsageEntry[], firmId: string, runId: string | null): PersistRow[] {
  return entries.map((e) => ({
    firmId,
    runId,
    operation: e.operation,
    model: e.model,
    inputTokens: e.usage.inputTokens,
    outputTokens: e.usage.outputTokens,
    cacheReadTokens: e.usage.cacheReadTokens ?? 0,
    cacheWriteTokens: e.usage.cacheWriteTokens ?? 0,
    costUsd: e.costUsd,
  }));
}

/** Persist the current ledger for a firm via `write`, then reset it. Returns the number of rows written. */
export async function flushUsage(write: UsageWriter, firmId: string, runId: string | null = null): Promise<number> {
  const rows = entriesToRows(ledgerEntries(), firmId, runId);
  if (!rows.length) return 0;
  await write(rows);
  resetLedger();
  return rows.length;
}
