import { and, eq } from "drizzle-orm";
import { aiSuggestions } from "../db/schema";
import { writeAudit } from "./audit";
import { requireRole, type Role } from "../auth/roles";
import type { Db, Ctx } from "./types";

export type ReviewCtx = Ctx & { role: Role };

export type SuggestionInput = {
  targetType: string;
  targetId?: string;
  kind: string;
  payload: Record<string, unknown>;
  model?: string;
  confidence?: number;
  rationale?: string;
  createdBy?: string;
};

// AI writes land ONLY here, always pending_review — never a production table.
export async function createSuggestion(db: Db, ctx: Ctx, input: SuggestionInput) {
  const [row] = await db
    .insert(aiSuggestions)
    .values({
      firmId: ctx.firmId, targetType: input.targetType, targetId: input.targetId, kind: input.kind,
      payload: input.payload, status: "pending_review", model: input.model, confidence: input.confidence,
      rationale: input.rationale, createdBy: input.createdBy,
    })
    .returning();
  await writeAudit(db, ctx, { action: "ai.suggest", resourceType: "ai_suggestion", resourceId: row.id, metadata: { kind: input.kind } });
  return row.id;
}

export async function listPending(db: Db) {
  return db.select().from(aiSuggestions).where(eq(aiSuggestions.status, "pending_review"));
}

// Human gate: only reviewer/admin/owner may promote. The applier writes the
// payload to the real table; it runs in the same tenant transaction, so
// apply + mark-approved is atomic — a failed apply leaves the suggestion pending.
export async function promoteSuggestion(
  db: Db,
  ctx: ReviewCtx,
  id: string,
  applier: (s: { targetType: string; targetId: string | null; kind: string; payload: unknown }) => Promise<void>,
) {
  requireRole(ctx, ["owner", "admin", "reviewer"]);
  const [s] = await db
    .select()
    .from(aiSuggestions)
    .where(and(eq(aiSuggestions.id, id), eq(aiSuggestions.status, "pending_review")));
  if (!s) return false;
  await applier({ targetType: s.targetType, targetId: s.targetId, kind: s.kind, payload: s.payload });
  await db
    .update(aiSuggestions)
    .set({ status: "approved", reviewedBy: ctx.actorId, reviewedAt: new Date() })
    .where(eq(aiSuggestions.id, id));
  await writeAudit(db, ctx, { action: "ai.promote", resourceType: "ai_suggestion", resourceId: id });
  return true;
}

export async function rejectSuggestion(db: Db, ctx: ReviewCtx, id: string, reason?: string) {
  requireRole(ctx, ["owner", "admin", "reviewer"]);
  const rows = await db
    .update(aiSuggestions)
    .set({ status: "rejected", reviewedBy: ctx.actorId, reviewedAt: new Date() })
    .where(and(eq(aiSuggestions.id, id), eq(aiSuggestions.status, "pending_review")))
    .returning();
  if (rows.length) {
    await writeAudit(db, ctx, { action: "ai.reject", resourceType: "ai_suggestion", resourceId: id, metadata: reason ? { reason } : {} });
  }
  return rows.length > 0;
}
