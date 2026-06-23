import { eq } from "drizzle-orm";
import { intakeLinks, intakeSessions } from "../db/schema";
import { encryptPII, decryptPII } from "../crypto/envelope";
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

// ── ⑧ intake_sessions (prospect-side via service db; PII envelope-encrypted) ─────────

// Create-or-get the single session for an invite. Service db (prospect is unauthenticated;
// the held invite token resolved it). No PII yet — just the shell.
export async function startSession(serviceDb: Db, intakeLinkId: string, firmId: string) {
  const [existing] = await serviceDb.select().from(intakeSessions).where(eq(intakeSessions.intakeLinkId, intakeLinkId)).limit(1);
  if (existing) return existing;
  const [row] = await serviceDb.insert(intakeSessions).values({ intakeLinkId, firmId }).returning();
  return row;
}

export async function markEmailVerified(serviceDb: Db, sessionId: string) {
  await serviceDb.update(intakeSessions).set({ emailVerified: true, updatedAt: new Date() }).where(eq(intakeSessions.id, sessionId));
}

// Persist intake answers — REFUSES until OTP-verified, and stores them envelope-encrypted
// (the whole answers JSON is PII). Plaintext never lands in a column.
export async function saveAnswers(serviceDb: Db, sessionId: string, answers: unknown) {
  const [s] = await serviceDb.select({ verified: intakeSessions.emailVerified }).from(intakeSessions).where(eq(intakeSessions.id, sessionId)).limit(1);
  if (!s) throw new Error("intake session not found");
  if (!s.verified) throw new Error("email not verified — refusing to store intake PII");
  await serviceDb.update(intakeSessions).set({ answersCiphertext: encryptPII(JSON.stringify(answers)), updatedAt: new Date() }).where(eq(intakeSessions.id, sessionId));
}

export async function getAnswers(db: Db, sessionId: string): Promise<unknown | null> {
  const [s] = await db.select({ ct: intakeSessions.answersCiphertext }).from(intakeSessions).where(eq(intakeSessions.id, sessionId)).limit(1);
  if (!s?.ct) return null;
  return JSON.parse(decryptPII(s.ct));
}

export async function setSessionStep(serviceDb: Db, sessionId: string, step: string) {
  await serviceDb.update(intakeSessions).set({ currentStep: step, updatedAt: new Date() }).where(eq(intakeSessions.id, sessionId));
}

export async function setDeposit(serviceDb: Db, sessionId: string, status: string, depositSessionId?: string) {
  await serviceDb.update(intakeSessions).set({ depositStatus: status, depositSessionId, updatedAt: new Date() }).where(eq(intakeSessions.id, sessionId));
}

// Preparer side (firm-RLS) — session metadata only, never the decrypted answers.
export async function listIntakeSessions(db: Db) {
  return db
    .select({ id: intakeSessions.id, intakeLinkId: intakeSessions.intakeLinkId, currentStep: intakeSessions.currentStep, emailVerified: intakeSessions.emailVerified, depositStatus: intakeSessions.depositStatus })
    .from(intakeSessions);
}
