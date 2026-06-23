import { eq } from "drizzle-orm";
import { households, people, entities, engagements, expectedDocs, notices, tasks, skills } from "../db/schema";
import type { Db } from "./types";

// Read selectors mirroring lib/fixtures/firm.ts. Each projects ONLY the fixture
// fields (no firm_id / timestamps) so the returned objects are byte-identical to
// what the UI components consume today. RLS scopes every query by firm, so no
// explicit firm filter is needed.

const householdCols = {
  id: households.id, name: households.name, kind: households.kind,
  serviceTier: households.serviceTier, since: households.since,
  has8821: households.has8821, hasBooks: households.hasBooks, catchUp: households.catchUp,
};
const personCols = {
  id: people.id, name: people.name, email: people.email, phone: people.phone,
  role: people.role, householdId: people.householdId,
};
const entityCols = {
  id: entities.id, householdId: entities.householdId, name: entities.name,
  type: entities.type, form: entities.form, ein: entities.ein, owners: entities.owners,
};
const engagementCols = {
  id: engagements.id, entityId: engagements.entityId, householdId: engagements.householdId,
  form: engagements.form, taxYear: engagements.taxYear, stage: engagements.stage,
  statutoryDeadline: engagements.statutoryDeadline, extendedDeadline: engagements.extendedDeadline,
  fee: engagements.fee, depositPaid: engagements.depositPaid, preparer: engagements.preparer,
  blockedBy: engagements.blockedBy, k1FlowsTo: engagements.k1FlowsTo,
  eFiledOn: engagements.eFiledOn, acceptedOn: engagements.acceptedOn, refund: engagements.refund,
};
const docCols = {
  id: expectedDocs.id, engagementId: expectedDocs.engagementId, type: expectedDocs.type,
  source: expectedDocs.source, status: expectedDocs.status, priorYearValue: expectedDocs.priorYearValue,
  fields: expectedDocs.fields, receivedVia: expectedDocs.receivedVia, when: expectedDocs.when, note: expectedDocs.note,
};
const noticeCols = {
  id: notices.id, type: notices.type, householdId: notices.householdId, taxYear: notices.taxYear,
  received: notices.received, respondBy: notices.respondBy, status: notices.status, amount: notices.amount,
  draftedResponse: notices.draftedResponse, runId: notices.runId,
  linkedTranscriptRunId: notices.linkedTranscriptRunId, resolvedBy: notices.resolvedBy,
  resolvedOn: notices.resolvedOn, note: notices.note,
};
const taskCols = {
  id: tasks.id, householdId: tasks.householdId, engagementId: tasks.engagementId, status: tasks.status,
  kind: tasks.kind, title: tasks.title, why: tasks.why, skillId: tasks.skillId, runId: tasks.runId,
  proposedActions: tasks.proposedActions, recommendedAction: tasks.recommendedAction,
  recommendation: tasks.recommendation, draftText: tasks.draftText, deadline: tasks.deadline,
  feeContext: tasks.feeContext, flagged: tasks.flagged, estimatedMin: tasks.estimatedMin,
  noticeId: tasks.noticeId, origin: tasks.origin, assigneeId: tasks.assigneeId,
};
const skillCols = {
  id: skills.id, name: skills.name, category: skills.category, trust: skills.trust,
  description: skills.description, trigger: skills.trigger, steps: skills.steps, channels: skills.channels,
  tone: skills.tone, escalation: skills.escalation, variants: skills.variants, graduation: skills.graduation,
};

export async function listHouseholds(db: Db) { return db.select(householdCols).from(households); }
export async function householdById(db: Db, id: string) {
  const [r] = await db.select(householdCols).from(households).where(eq(households.id, id));
  return r;
}
export async function peopleOf(db: Db, householdId: string) {
  return db.select(personCols).from(people).where(eq(people.householdId, householdId));
}
export async function entitiesOf(db: Db, householdId: string) {
  return db.select(entityCols).from(entities).where(eq(entities.householdId, householdId));
}
export async function entityById(db: Db, id: string) {
  const [r] = await db.select(entityCols).from(entities).where(eq(entities.id, id));
  return r;
}
export async function engagementsOf(db: Db, householdId: string) {
  return db.select(engagementCols).from(engagements).where(eq(engagements.householdId, householdId));
}
export async function engagementById(db: Db, id: string) {
  const [r] = await db.select(engagementCols).from(engagements).where(eq(engagements.id, id));
  return r;
}
export async function activeEngagements(db: Db) { return db.select(engagementCols).from(engagements); }
export async function docsOfEngagement(db: Db, engagementId: string) {
  return db.select(docCols).from(expectedDocs).where(eq(expectedDocs.engagementId, engagementId));
}
export async function tasksOf(db: Db, householdId: string) {
  return db.select(taskCols).from(tasks).where(eq(tasks.householdId, householdId));
}
export async function listTasks(db: Db) { return db.select(taskCols).from(tasks); }
export async function taskById(db: Db, id: string) {
  const [r] = await db.select(taskCols).from(tasks).where(eq(tasks.id, id));
  return r;
}
export async function noticesOf(db: Db, householdId: string) {
  return db.select(noticeCols).from(notices).where(eq(notices.householdId, householdId));
}
export async function listNotices(db: Db) { return db.select(noticeCols).from(notices); }
export async function listSkills(db: Db) { return db.select(skillCols).from(skills); }
export async function skillById(db: Db, id: string) {
  const [r] = await db.select(skillCols).from(skills).where(eq(skills.id, id));
  return r;
}
