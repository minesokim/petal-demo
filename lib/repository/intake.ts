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

// Prospect-side mutations run on the SERVICE db (RLS bypassed — the unauthenticated
// prospect has no firm claims). They still must leave an audit trail, so we synthesize
// a Ctx from the session's own firm_id: actor is the prospect (the held capability token
// is the authorization) or, where there is no prospect intent, the system. NEVER put PII
// in metadata — only ids/status (the answers JSON is crown-jewel PII).
function prospectCtx(firmId: string): Ctx {
  return { firmId, actorId: "prospect", actorType: "client" };
}
function systemCtx(firmId: string): Ctx {
  return { firmId, actorId: "system", actorType: "system" };
}

// Create-or-get the single session for an invite. Service db (prospect is unauthenticated;
// the held invite token resolved it). No PII yet — just the shell.
export async function startSession(serviceDb: Db, intakeLinkId: string, firmId: string) {
  const [existing] = await serviceDb.select().from(intakeSessions).where(eq(intakeSessions.intakeLinkId, intakeLinkId)).limit(1);
  if (existing) return existing;
  const [row] = await serviceDb.insert(intakeSessions).values({ intakeLinkId, firmId }).returning();
  await writeAudit(serviceDb, systemCtx(firmId), {
    action: "intake.session.start",
    resourceType: "intake_session",
    resourceId: row.id,
    metadata: { intakeLinkId },
  });
  return row;
}

export async function markEmailVerified(serviceDb: Db, sessionId: string) {
  const [s] = await serviceDb.select({ firmId: intakeSessions.firmId }).from(intakeSessions).where(eq(intakeSessions.id, sessionId)).limit(1);
  if (!s) throw new Error("intake session not found");
  await serviceDb.update(intakeSessions).set({ emailVerified: true, updatedAt: new Date() }).where(eq(intakeSessions.id, sessionId));
  await writeAudit(serviceDb, prospectCtx(s.firmId), {
    action: "intake.session.email_verified",
    resourceType: "intake_session",
    resourceId: sessionId,
  });
}

// Persist intake answers — REFUSES until OTP-verified, and stores them envelope-encrypted
// (the whole answers JSON is PII). Plaintext never lands in a column.
export async function saveAnswers(serviceDb: Db, sessionId: string, answers: unknown) {
  const [s] = await serviceDb.select({ verified: intakeSessions.emailVerified, firmId: intakeSessions.firmId }).from(intakeSessions).where(eq(intakeSessions.id, sessionId)).limit(1);
  if (!s) throw new Error("intake session not found");
  if (!s.verified) throw new Error("email not verified — refusing to store intake PII");
  await serviceDb.update(intakeSessions).set({ answersCiphertext: encryptPII(JSON.stringify(answers)), updatedAt: new Date() }).where(eq(intakeSessions.id, sessionId));
  await writeAudit(serviceDb, prospectCtx(s.firmId), {
    action: "intake.session.save_answers",
    resourceType: "intake_session",
    resourceId: sessionId,
    // No PII — record only that encrypted answers were written.
    metadata: { stored: true },
  });
}

export async function getAnswers(db: Db, sessionId: string): Promise<unknown | null> {
  const [s] = await db.select({ ct: intakeSessions.answersCiphertext }).from(intakeSessions).where(eq(intakeSessions.id, sessionId)).limit(1);
  if (!s?.ct) return null;
  return JSON.parse(decryptPII(s.ct));
}

export async function setSessionStep(serviceDb: Db, sessionId: string, step: string) {
  const [s] = await serviceDb.select({ firmId: intakeSessions.firmId }).from(intakeSessions).where(eq(intakeSessions.id, sessionId)).limit(1);
  if (!s) throw new Error("intake session not found");
  await serviceDb.update(intakeSessions).set({ currentStep: step, updatedAt: new Date() }).where(eq(intakeSessions.id, sessionId));
  await writeAudit(serviceDb, prospectCtx(s.firmId), {
    action: "intake.session.step",
    resourceType: "intake_session",
    resourceId: sessionId,
    metadata: { step },
  });
}

export async function setDeposit(serviceDb: Db, sessionId: string, status: string, depositSessionId?: string) {
  const [s] = await serviceDb.select({ firmId: intakeSessions.firmId }).from(intakeSessions).where(eq(intakeSessions.id, sessionId)).limit(1);
  if (!s) throw new Error("intake session not found");
  await serviceDb.update(intakeSessions).set({ depositStatus: status, depositSessionId, updatedAt: new Date() }).where(eq(intakeSessions.id, sessionId));
  await writeAudit(serviceDb, prospectCtx(s.firmId), {
    action: "intake.session.deposit",
    resourceType: "intake_session",
    resourceId: sessionId,
    metadata: { status, depositSessionId: depositSessionId ?? null },
  });
}

// Preparer side (firm-RLS) — session metadata only, never the decrypted answers.
export async function listIntakeSessions(db: Db) {
  return db
    .select({ id: intakeSessions.id, intakeLinkId: intakeSessions.intakeLinkId, currentStep: intakeSessions.currentStep, emailVerified: intakeSessions.emailVerified, depositStatus: intakeSessions.depositStatus })
    .from(intakeSessions);
}
