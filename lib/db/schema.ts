// ① Identity & tenancy — canonical identity tables. Every tenant table carries
// firm_id; RLS (0001_rls.sql) enforces firm_id isolation at the database layer.
import { pgTable, uuid, text, jsonb, boolean, integer, doublePrecision, numeric, timestamp, pgEnum, unique, index, type AnyPgColumn } from "drizzle-orm/pg-core";
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
  // The AI skill catalog is a GLOBAL product definition (firm_id NULL) readable by every
  // firm; a firm may also define its own (firm_id set). No client data lives here.
  firmId: uuid("firm_id").references(() => firms.id, { onDelete: "cascade" }),
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

// The four entities derive.ts also reads (provenance + activity + inbox). Same
// firm-scoped pattern; text PKs match fixture ids; jsonb for nested sub-objects.

export const positions = pgTable("positions", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  engagementId: text("engagement_id").notNull().references(() => engagements.id, { onDelete: "cascade" }),
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  issue: text("issue").notNull(),
  authorityLevel: text("authority_level"),
  confidence: doublePrecision("confidence"),
  documentation: jsonb("documentation"), // string[]
  status: text("status").notNull(), // open | resolved
  resolvedBy: text("resolved_by"),
  resolvedOn: text("resolved_on"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skillRuns = pgTable("skill_runs", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  skillId: text("skill_id"),
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  engagementId: text("engagement_id"),
  startedAt: text("started_at"),
  status: text("status").notNull(), // running | done
  inputs: jsonb("inputs"), // { ref, page? }[]
  outputs: jsonb("outputs"), // string[]
  extracted: jsonb("extracted"), // { label, value, confidence, flag? }[]
  rule: text("rule"),
  confidence: doublePrecision("confidence"),
  trustTierAtRun: integer("trust_tier_at_run"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  summary: text("summary"),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activity = pgTable("activity", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  day: integer("day").notNull(),
  at: text("at"),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  actor: text("actor").notNull(), // Petal | Antonio Vazquez
  householdId: text("household_id").references(() => households.id, { onDelete: "cascade" }),
  runId: text("run_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const threads = pgTable("threads", {
  id: text("id").primaryKey(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  householdId: text("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  clientName: text("client_name"),
  channel: text("channel").notNull(), // email | sms | portal | call
  subject: text("subject"),
  preview: text("preview"),
  time: text("time"),
  unread: boolean("unread").notNull().default(false),
  status: text("status").notNull(), // open | snoozed | done
  waitingOnFirmSince: text("waiting_on_firm_since"),
  messages: jsonb("messages"),
  petalDraft: jsonb("petal_draft"),
  extraction: jsonb("extraction"),
  petalCanAnswer: jsonb("petal_can_answer"),
  transcript: jsonb("transcript"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ⑤ Connectors — per-firm OAuth connection state (Composio-managed). One row per
// firm+toolkit (gmail/quickbooks/calendar/…). Tokens live in Composio, never here;
// we store the connection id + status + a display label only.
export const connections = pgTable("connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  toolkit: text("toolkit").notNull(), // composio toolkit slug: gmail, quickbooks, googlecalendar
  status: text("status").notNull().default("pending"), // pending | connected | error
  composioConnectionId: text("composio_connection_id"),
  accountLabel: text("account_label"), // e.g. the connected email
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique("connections_firm_toolkit_uq").on(t.firmId, t.toolkit)]);

// ⑧ Portal — preparer-generated intake invites. A firm creates an invite (optionally
// pre-addressed to a prospect); the token is the capability in the portal URL. Prospects
// authenticate via OTP against this invite before any intake data is written (the unauth
// write surface is OTP-gated, not open). Firm-scoped RLS covers the preparer side.
export const intakeLinks = pgTable("intake_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(), // high-entropy capability token in the URL
  prospectName: text("prospect_name"),
  prospectEmail: text("prospect_email"),
  status: text("status").notNull().default("sent"), // sent | started | submitted | converted | expired
  engagementId: text("engagement_id"), // set once the intake converts to an engagement
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ⑧ Portal — the prospect's intake progress + answers. One per invite. answersCiphertext
// holds the full intake answers JSON envelope-ENCRYPTED (AES-256-GCM via lib/crypto) — it
// is PII (names, income, dependents), so it never sits in plaintext. emailVerified gates
// any write (set true only after OTP). deposit* tracks the ⑦ Stripe checkout.
export const intakeSessions = pgTable("intake_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  intakeLinkId: uuid("intake_link_id").notNull().references(() => intakeLinks.id, { onDelete: "cascade" }),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  emailVerified: boolean("email_verified").notNull().default(false),
  currentStep: text("current_step").notNull().default("welcome"),
  answersCiphertext: text("answers_ciphertext"), // envelope-encrypted intake answers JSON
  depositStatus: text("deposit_status").notNull().default("unpaid"), // unpaid | session_created | paid
  depositSessionId: text("deposit_session_id"), // Stripe checkout session id
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique("intake_sessions_link_uq").on(t.intakeLinkId)]);

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
  householdId: text("household_id").references(() => households.id, { onDelete: "set null" }), // client this file belongs to (null = firm library)
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

// ⑨ Ask Petal chat history — persisted assistant conversations (0025_chat_history.sql).
// Distinct from `threads` above (client messaging). One chat_thread per Ask Petal
// session; chat_messages holds the user/assistant turns. firm_id scopes every row
// (RLS), and the chat text is the firm's own data — nothing new leaves the process.
export const chatThreads = pgTable("chat_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  userId: text("user_id"), // the preparer (Clerk user id) who started the chat
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull().references(() => chatThreads.id, { onDelete: "cascade" }),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// SMS message persistence (0027_sms_messages.sql) — every outbound/inbound text a
// firm sends a household, so the client page renders the conversation as a thread.
// Distinct from `threads` (the richer client-messaging inbox); this is the literal
// SMS log. household_id is a soft link (set null on household delete). firm_id scopes
// every row (RLS); the body is the firm's own client-communication data.
export const smsMessages = pgTable("sms_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  householdId: text("household_id").references(() => households.id, { onDelete: "set null" }),
  direction: text("direction").notNull(), // outbound | inbound
  body: text("body").notNull(),
  phone: text("phone").notNull(),
  twilioSid: text("twilio_sid"),
  status: text("status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// MMS / file attachments on a text (0031). One row per media item; the blob lives in the
// firm-files Supabase Storage bucket (storage_path = {firmId}/...), the same store as documents.
// firm_id scopes RLS; cascade-deletes with its parent message.
export const smsMedia = pgTable("sms_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  smsMessageId: uuid("sms_message_id").notNull().references(() => smsMessages.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  contentType: text("content_type").notNull(),
  name: text("name").notNull(),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ⑥ Agentic layer (Phase 0, 0028_agent_layer_schema.sql) — the durable substrate
// the agent runtime drives via server actions + route handlers (no held-open
// workflow; durability = these Postgres rows). firm_id scopes every table directly
// except agent_runs, which inherits its firm via its parent agent_task (RLS join).
// INV-3 tier on agent_tasks; INV-4 secret_ref (never the secret) on agentConnections;
// tier-3 writes are STAGED in actionProposals and execute only after a recorded human
// approval (mirrors confirmAgentAction). Every run/proposal/approval/write is also
// appended to the existing append-only audit_log (INV-7).

// One unit of agentic work. tier mirrors INV-3 (1 read / 2 propose / 3 governed
// write / 4 scheduled). client_id nullable (firm-level tasks exist).
export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  clientId: text("client_id").references(() => households.id, { onDelete: "set null" }),
  createdByUserId: text("created_by_user_id"), // Clerk user id of the preparer who launched it
  kind: text("kind").notNull(),
  tier: integer("tier").notNull(), // 1 read | 2 propose | 3 governed write | 4 scheduled
  status: text("status").notNull().default("pending"),
  input: jsonb("input").notNull().default(sql`'{}'::jsonb`),
  result: jsonb("result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("agent_tasks_firm_idx").on(t.firmId),
  index("agent_tasks_firm_client_idx").on(t.firmId, t.clientId),
  index("agent_tasks_status_idx").on(t.firmId, t.status),
]);

// Each LLM turn under a task. parent_run_id models the planner -> sub-agent tree
// (INV-6). No direct firm_id — RLS scopes it via the parent task's firm.
export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => agentTasks.id, { onDelete: "cascade" }),
  parentRunId: uuid("parent_run_id").references((): AnyPgColumn => agentRuns.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  transcript: jsonb("transcript"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("agent_runs_task_idx").on(t.taskId),
  index("agent_runs_parent_idx").on(t.parentRunId),
]);

// A scoped credential reference (INV-4 least-privilege). secret_ref points at the
// secret store; the secret itself is NEVER stored here / never enters model context.
// Distinct from the Composio `connections` table above — this is the agentic-layer
// credential ledger keyed by provider + auth_type.
export const agentConnections = pgTable("agent_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  clientId: text("client_id").references(() => households.id, { onDelete: "set null" }),
  provider: text("provider").notNull(),
  authType: text("auth_type").notNull(),
  scopes: jsonb("scopes").notNull().default(sql`'[]'::jsonb`),
  secretRef: text("secret_ref").notNull(), // pointer into the secret store, never the secret
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("agent_connections_firm_idx").on(t.firmId),
  index("agent_connections_firm_client_idx").on(t.firmId, t.clientId),
]);

// The document-collection ledger: per client+period, one row per item we still
// need. client_id NOT NULL (always about a specific client). connection_id links
// the connector that will fetch it; evidence_r2_key points at the fetched blob.
export const fetchRequirements = pgTable("fetch_requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  period: text("period").notNull(),
  item: text("item").notNull(),
  sourceType: text("source_type").notNull(), // client_upload | connector | third_party
  connectionId: uuid("connection_id").references(() => agentConnections.id, { onDelete: "set null" }),
  fetchMethod: text("fetch_method").notNull(), // manual | api | email
  status: text("status").notNull().default("needed"),
  assignedTo: text("assigned_to"),
  evidenceR2Key: text("evidence_r2_key"),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("fetch_requirements_firm_idx").on(t.firmId),
  index("fetch_requirements_client_period_idx").on(t.firmId, t.clientId, t.period),
  index("fetch_requirements_status_idx").on(t.firmId, t.status),
]);

// The tier-3 approval gate. A write tool NEVER executes inside the agent loop; it
// is STAGED here. A human resolves it; on approval the confirm shim re-validates +
// executes, stamping execution_result. firm_id direct so listProposals is a simple
// firm-scoped scan.
export const actionProposals = pgTable("action_proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => agentTasks.id, { onDelete: "cascade" }),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  clientId: text("client_id").references(() => households.id, { onDelete: "set null" }),
  toolName: text("tool_name").notNull(),
  args: jsonb("args").notNull().default(sql`'{}'::jsonb`),
  rationale: text("rationale").notNull(),
  evidence: jsonb("evidence"),
  confidence: numeric("confidence"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  resolvedByUserId: text("resolved_by_user_id"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  executionResult: jsonb("execution_result"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("action_proposals_firm_idx").on(t.firmId),
  index("action_proposals_task_idx").on(t.taskId),
  index("action_proposals_status_idx").on(t.firmId, t.status),
]);

// Durable outputs of a task: a brief, a drafted reply, a computed worksheet. Either
// r2_key (a blob in R2) OR content (inline jsonb).
export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => agentTasks.id, { onDelete: "cascade" }),
  firmId: uuid("firm_id").notNull().references(() => firms.id, { onDelete: "cascade" }),
  clientId: text("client_id").references(() => households.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  r2Key: text("r2_key"),
  content: jsonb("content"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("artifacts_firm_idx").on(t.firmId),
  index("artifacts_task_idx").on(t.taskId),
  index("artifacts_firm_client_idx").on(t.firmId, t.clientId),
]);
