import { eq } from "drizzle-orm";
import { households, people, engagements, expectedDocs, tasks, notices } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// Audited write-path for the practice entities. Every mutation runs RLS-scoped
// (the handle carries the caller's claims) and appends one audit_log row. No
// crown-jewel PII in audit metadata — ids and status only.

function newId(prefix: string) {
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
}

export type HouseholdInput = {
  id?: string; name: string; kind: string; serviceTier: string; since: number;
  has8821?: boolean; hasBooks?: boolean; catchUp?: string;
};
export async function createHousehold(db: Db, ctx: Ctx, input: HouseholdInput) {
  const id = input.id ?? newId("h");
  await db.insert(households).values({
    id, firmId: ctx.firmId, name: input.name, kind: input.kind, serviceTier: input.serviceTier,
    since: input.since, has8821: input.has8821 ?? false, hasBooks: input.hasBooks ?? false, catchUp: input.catchUp,
  });
  await writeAudit(db, ctx, { action: "household.create", resourceType: "household", resourceId: id });
  return id;
}

export type PersonInput = {
  id?: string; householdId: string; name: string; email?: string; phone?: string; role: string;
};
export async function createPerson(db: Db, ctx: Ctx, input: PersonInput) {
  const id = input.id ?? newId("p");
  await db.insert(people).values({
    id, firmId: ctx.firmId, householdId: input.householdId, name: input.name,
    email: input.email, phone: input.phone, role: input.role,
  });
  await writeAudit(db, ctx, { action: "person.create", resourceType: "person", resourceId: id });
  return id;
}

// Edit a contact's reachable fields (phone/email/name). Only the provided fields are
// written; an undefined field is left untouched. RLS scopes the UPDATE to the caller's
// firm and one audit row records it (no PII in metadata — id + changed keys only).
export type PersonContactPatch = { phone?: string; email?: string; name?: string };
export async function updatePerson(db: Db, ctx: Ctx, id: string, patch: PersonContactPatch) {
  const set: Record<string, string | undefined> = {};
  if (patch.phone !== undefined) set.phone = patch.phone.trim() || undefined;
  if (patch.email !== undefined) set.email = patch.email.trim() || undefined;
  if (patch.name !== undefined) set.name = patch.name.trim();
  if (Object.keys(set).length === 0) return false;
  const rows = await db.update(people).set(set).where(eq(people.id, id)).returning();
  if (rows.length) {
    await writeAudit(db, ctx, {
      action: "person.update", resourceType: "person", resourceId: id,
      metadata: { fields: Object.keys(set) }, // changed keys only — never the values
    });
  }
  return rows.length > 0;
}

export type EngagementInput = {
  id?: string; entityId: string; householdId: string; form: string; taxYear: number;
  stage: string; statutoryDeadline: string; fee: number; depositPaid?: boolean; preparer?: string;
};
export async function createEngagement(db: Db, ctx: Ctx, input: EngagementInput) {
  const id = input.id ?? newId("g");
  await db.insert(engagements).values({
    id, firmId: ctx.firmId, entityId: input.entityId, householdId: input.householdId, form: input.form,
    taxYear: input.taxYear, stage: input.stage, statutoryDeadline: input.statutoryDeadline,
    fee: input.fee, depositPaid: input.depositPaid ?? false, preparer: input.preparer,
  });
  await writeAudit(db, ctx, { action: "engagement.create", resourceType: "engagement", resourceId: id });
  return id;
}

export async function setEngagementStage(db: Db, ctx: Ctx, id: string, stage: string) {
  const rows = await db.update(engagements).set({ stage, updatedAt: new Date() })
    .where(eq(engagements.id, id)).returning();
  if (rows.length) {
    await writeAudit(db, ctx, { action: "engagement.stage", resourceType: "engagement", resourceId: id, metadata: { stage } });
  }
  return rows.length > 0;
}

export type TaskInput = {
  id?: string; householdId: string; engagementId?: string; status: string; kind: string;
  title: string; why?: string; skillId?: string; estimatedMin?: number; origin?: string; assigneeId?: string;
};
export async function createTask(db: Db, ctx: Ctx, input: TaskInput) {
  const id = input.id ?? newId("t");
  await db.insert(tasks).values({
    id, firmId: ctx.firmId, householdId: input.householdId, engagementId: input.engagementId,
    status: input.status, kind: input.kind, title: input.title, why: input.why, skillId: input.skillId,
    estimatedMin: input.estimatedMin, origin: input.origin, assigneeId: input.assigneeId,
  });
  await writeAudit(db, ctx, { action: "task.create", resourceType: "task", resourceId: id });
  return id;
}

export async function setTaskStatus(db: Db, ctx: Ctx, id: string, status: string) {
  const rows = await db.update(tasks).set({ status, updatedAt: new Date() })
    .where(eq(tasks.id, id)).returning();
  if (rows.length) {
    await writeAudit(db, ctx, { action: "task.status", resourceType: "task", resourceId: id, metadata: { status } });
  }
  return rows.length > 0;
}

export async function setDocStatus(db: Db, ctx: Ctx, id: string, status: string) {
  const rows = await db.update(expectedDocs).set({ status, updatedAt: new Date() })
    .where(eq(expectedDocs.id, id)).returning();
  if (rows.length) {
    await writeAudit(db, ctx, { action: "doc.status", resourceType: "expected_doc", resourceId: id, metadata: { status } });
  }
  return rows.length > 0;
}

// Mark a notice resolved (the preparer approved & mailed the response, or closed it
// out by hand). RLS scopes the UPDATE to the caller's firm; one audit row records it.
export async function resolveNotice(
  db: Db, ctx: Ctx, id: string,
  input: { resolvedBy: string; resolvedOn: string; note?: string },
) {
  const rows = await db.update(notices)
    .set({ status: "resolved", resolvedBy: input.resolvedBy, resolvedOn: input.resolvedOn, note: input.note, updatedAt: new Date() })
    .where(eq(notices.id, id)).returning();
  if (rows.length) {
    await writeAudit(db, ctx, { action: "notice.resolve", resourceType: "notice", resourceId: id, metadata: { status: "resolved" } });
  }
  return rows.length > 0;
}

// Persist an edited draft response for a notice (the preparer tweaked Petal's letter
// before approving). Status is unchanged — just the draft body. RLS-scoped + audited.
export async function updateNoticeDraft(db: Db, ctx: Ctx, id: string, draftedResponse: string) {
  const rows = await db.update(notices)
    .set({ draftedResponse, updatedAt: new Date() })
    .where(eq(notices.id, id)).returning();
  if (rows.length) {
    await writeAudit(db, ctx, { action: "notice.draft", resourceType: "notice", resourceId: id });
  }
  return rows.length > 0;
}
