// Service-role writer for ai_usage — the DB-bound half of the cost meter (keeps usage-persist.ts pure).
// Resolves the firm from its Clerk org id, then inserts the scoped usage entries. ai_usage RLS is
// READ-only for tenants and write-only for the service role, so this MUST use getServiceDb(). Carries
// no taxpayer data — only operation tag, model, token counts, and cost.
import { eq } from "drizzle-orm";
import { getServiceDb } from "@/lib/db/client";
import { aiUsage, firms } from "@/lib/db/schema";
import { entriesToRows } from "./usage-persist";
import type { UsageEntry } from "./usage-ledger";

/**
 * Persist a request's scoped usage entries to ai_usage, attributed to the firm behind `clerkOrgId`.
 * Returns rows written (0 if nothing to record or the org has no firm row yet — never throws on a
 * missing firm; callers treat cost accounting as best-effort and must not fail the user response on it).
 */
export async function persistUsageForOrg(
  clerkOrgId: string,
  entries: readonly UsageEntry[],
  runId: string | null = null,
): Promise<number> {
  if (!entries.length) return 0;
  const db = getServiceDb();
  const firm = await db.select({ id: firms.id }).from(firms).where(eq(firms.clerkOrgId, clerkOrgId)).limit(1);
  if (!firm.length) return 0;
  const rows = entriesToRows(entries, firm[0].id, runId).map((r) => ({
    firmId: r.firmId,
    runId: r.runId,
    operation: r.operation,
    model: r.model,
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    cacheReadTokens: r.cacheReadTokens,
    cacheWriteTokens: r.cacheWriteTokens,
    costUsd: String(r.costUsd), // numeric column → string in drizzle-postgres
  }));
  await db.insert(aiUsage).values(rows);
  return rows.length;
}
