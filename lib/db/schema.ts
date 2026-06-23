// ① Identity & tenancy — canonical identity tables. Every tenant table carries
// firm_id; RLS (0001_rls.sql) enforces firm_id isolation at the database layer.
import { pgTable, uuid, text, jsonb, boolean, integer, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["owner", "admin", "reviewer", "preparer"]);
export const actorTypeEnum = pgEnum("actor_type", ["preparer", "client", "system"]);

export const firms = pgTable("firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: text("clerk_org_id").notNull().unique(),
  name: text("name").notNull(),
  settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
  billingCustomerId: text("billing_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const firmMembers = pgTable("firm_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  clerkUserId: text("clerk_user_id").notNull(),
  role: roleEnum("role").notNull(),
  name: text("name"),
  email: text("email"),
  credential: text("credential"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqMember: unique("firm_members_firm_user_uq").on(t.firmId, t.clerkUserId) }));

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  supabaseUserId: uuid("supabase_user_id"),
  householdId: text("household_id"), // links the portal login to its household (FK added in 0010)
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull(),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ② Core practice data model — the client -> return -> doc -> task spine.
// Text PKs match the fixture ids so seed data ports 1:1 and id-based UI behavior
// is identical. firm_id scopes every row (RLS in 0005_practice_rls.sql). Nested
// sub-objects are jsonb; fixture date strings are text (exact passthrough); money
// is integer (JS number, not numeric-string).

export const households = pgTable("households", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // individual | business | mixed
  serviceTier: text("service_tier").notNull(), // Basic | Standard | Premium
  since: integer("since").notNull(),
  has8821: boolean("has_8821").notNull().default(false),
  hasBooks: boolean("has_books").notNull().default(false),
  catchUp: text("catch_up"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const people = pgTable("people", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull(), // Taxpayer | Spouse | Owner | Partner | Bookkeeper
  ssn: text("ssn"), // envelope-encrypted token (lib/crypto/envelope), never plaintext; excluded from default reads
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entities = pgTable("entities", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  form: text("form").notNull(),
  ein: text("ein"),
  owners: jsonb("owners"), // { personId, pct }[]
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const engagements = pgTable("engagements", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  entityId: text("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  form: text("form").notNull(),
  taxYear: integer("tax_year").notNull(),
  stage: text("stage").notNull(), // collecting_docs | ready_to_prep | in_preparation | in_review | pay_and_sign | e_filed | accepted
  statutoryDeadline: text("statutory_deadline").notNull(),
  extendedDeadline: text("extended_deadline"),
  fee: integer("fee").notNull(),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  preparer: text("preparer"), // fixture member id (no FK across layers)
  blockedBy: text("blocked_by"),
  k1FlowsTo: text("k1_flows_to"),
  eFiledOn: text("e_filed_on"),
  acceptedOn: text("accepted_on"),
  refund: integer("refund"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const expectedDocs = pgTable("expected_docs", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  engagementId: text("engagement_id").notNull().references(() => engagements.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  source: text("source"),
  status: text("status").notNull(), // have | requested | needs_review | na
  priorYearValue: text("prior_year_value"),
  fields: jsonb("fields"), // { label, value, confidence, flag }[]
  receivedVia: text("received_via"), // Portal | Email | Upload | Text
  when: text("when"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skills = pgTable("skills", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(), // prep_filing | signatures_chase | books | meetings_calls | briefs | estimates_deadlines
  trust: integer("trust").notNull(), // 0..3
  description: text("description"),
  trigger: text("trigger"),
  steps: jsonb("steps"), // string[]
  channels: jsonb("channels"), // string[]
  tone: text("tone"),
  escalation: text("escalation"),
  variants: jsonb("variants"),
  graduation: jsonb("graduation"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notices = pgTable("notices", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  taxYear: integer("tax_year").notNull(),
  received: text("received"),
  respondBy: text("respond_by"),
  status: text("status").notNull(), // response_drafted | resolved
  amount: text("amount"),
  draftedResponse: text("drafted_response"),
  runId: text("run_id"),
  linkedTranscriptRunId: text("linked_transcript_run_id"),
  resolvedBy: text("resolved_by"),
  resolvedOn: text("resolved_on"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  engagementId: text("engagement_id"),
  status: text("status").notNull(), // needs_decision | ready_to_approve | todo | running | scheduled | waiting_client | waiting_third_party | done
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  why: text("why"),
  skillId: text("skill_id"),
  runId: text("run_id"),
  proposedActions: jsonb("proposed_actions"), // { key, label, detail }[]
  recommendedAction: text("recommended_action"), // A | B | C
  recommendation: text("recommendation"),
  draftText: text("draft_text"),
  deadline: text("deadline"),
  feeContext: text("fee_context"),
  flagged: boolean("flagged"),
  estimatedMin: integer("estimated_min"),
  noticeId: text("notice_id"),
  origin: text("origin"), // petal | human
  assigneeId: text("assignee_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ④ AI quarantine — every AI output lands here as pending_review and NEVER touches
// a production table until a human promotes it. Non-negotiable safety boundary.
export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(), // task | expected_doc | notice | engagement | ...
  targetId: text("target_id"), // existing row it proposes to change; null for net-new
  kind: text("kind").notNull(), // doc_extraction | draft_reply | variance_flag | stage_suggestion | ...
  payload: jsonb("payload").notNull(), // the proposed change/content
  status: text("status").notNull().default("pending_review"), // pending_review | approved | rejected
  model: text("model"),
  confidence: integer("confidence"), // 0..100
  rationale: text("rationale"),
  createdBy: text("created_by"), // skill/run that produced it
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ③ Documents — the firm's own file library (Drive-style). Metadata here; the
// actual blob lives in Supabase Storage at storage_path (set on upload, runtime).
export const firmFolders = pgTable("firm_folders", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const firmFiles = pgTable("firm_files", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  folderId: text("folder_id").notNull().references(() => firmFolders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // pdf | docx | xlsx
  size: text("size"),
  modified: text("modified"),
  ts: integer("ts").notNull(),
  owner: text("owner"),
  starred: boolean("starred").notNull().default(false),
  storagePath: text("storage_path"), // Supabase Storage object path; set on upload
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
