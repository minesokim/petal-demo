"use server";

import { eq } from "drizzle-orm";
import { withFirm } from "@/lib/auth/tenant";
import { firms, firmMembers } from "@/lib/db/schema";
import { resolveNotice, updateNoticeDraft } from "@/lib/repository/practice-writes";
import type { Db, Ctx } from "@/lib/repository/types";

// Notice write-path. Both actions run RLS-scoped + audited via withFirm; the
// repository writers (resolveNotice / updateNoticeDraft) append the audit row.
// The detail view calls these from its existing Approve & mail / Save handlers,
// then router.refresh() re-reads the real notice from loadFirmData.

// The human-readable name stamped onto a resolved notice ("Resolved by …").
// Prefer the signed-in member's name, fall back to the firm name, then a generic.
async function resolverName(db: Db, ctx: Ctx): Promise<string> {
  if (ctx.actorId) {
    const [m] = await db.select({ name: firmMembers.name }).from(firmMembers)
      .where(eq(firmMembers.clerkUserId, ctx.actorId));
    if (m?.name?.trim()) return m.name.trim();
  }
  const [f] = await db.select({ name: firms.name }).from(firms).where(eq(firms.id, ctx.firmId));
  return f?.name?.trim() || "Preparer";
}

// Approve & mail (or hand-resolve) a notice: mark it resolved, stamping who/when.
// `note` carries the optional resolution summary the UI may show.
export async function resolveNoticeAction(
  id: string,
  input?: { note?: string },
): Promise<{ ok: boolean }> {
  const ok = await withFirm(async (db, ctx) => {
    const resolvedBy = await resolverName(db, ctx);
    const resolvedOn = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, same shape as fixtures
    return resolveNotice(db, ctx, id, { resolvedBy, resolvedOn, note: input?.note });
  });
  return { ok: ok ?? false };
}

// Save an edited draft response for a notice (status unchanged).
export async function updateNoticeDraftAction(
  id: string,
  draftedResponse: string,
): Promise<{ ok: boolean }> {
  const ok = await withFirm((db, ctx) => updateNoticeDraft(db, ctx, id, draftedResponse));
  return { ok: ok ?? false };
}
