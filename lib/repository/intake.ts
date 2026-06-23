import { eq } from "drizzle-orm";
import { intakeLinks } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// ⑧ Portal intake — preparer side (firm-scoped, RLS + audited).

export async function listIntakeLinks(db: Db) {
  return db
    .select({
      id: intakeLinks.id,
      token: intakeLinks.token,
      prospectName: intakeLinks.prospectName,
      prospectEmail: intakeLinks.prospectEmail,
      status: intakeLinks.status,
      engagementId: intakeLinks.engagementId,
    })
    .from(intakeLinks);
}

export async function createIntakeLink(
  db: Db,
  ctx: Ctx,
  input: { token: string; prospectName?: string; prospectEmail?: string },
) {
  const [row] = await db
    .insert(intakeLinks)
    .values({ firmId: ctx.firmId, token: input.token, prospectName: input.prospectName, prospectEmail: input.prospectEmail })
    .returning();
  await writeAudit(db, ctx, {
    action: "intake.invite",
    resourceType: "intake_link",
    resourceId: row.id,
    metadata: { prospectEmail: input.prospectEmail ?? null },
  });
  return row;
}

export async function setIntakeStatus(db: Db, ctx: Ctx, token: string, status: string) {
  await db.update(intakeLinks).set({ status, updatedAt: new Date() }).where(eq(intakeLinks.token, token));
  await writeAudit(db, ctx, { action: "intake.status", resourceType: "intake_link", resourceId: token, metadata: { status } });
}

// Prospect side: resolve an invite by its capability token using the SERVICE db (RLS
// bypassed — the unauthenticated prospect has no firm claims). Returns the minimum the
// portal needs; the token IS the authorization, so callers must hold the exact token.
export async function resolveLinkByToken(serviceDb: Db, token: string) {
  const [row] = await serviceDb
    .select({ id: intakeLinks.id, firmId: intakeLinks.firmId, prospectEmail: intakeLinks.prospectEmail, status: intakeLinks.status })
    .from(intakeLinks)
    .where(eq(intakeLinks.token, token))
    .limit(1);
  return row ?? null;
}
