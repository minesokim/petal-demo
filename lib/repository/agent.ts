import { and, asc, desc, eq } from "drizzle-orm";
import {
  agentTasks,
  agentRuns,
  agentConnections,
  fetchRequirements,
  actionProposals,
  artifacts,
} from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// ⑥ Agentic layer — firm-scoped readers/writers for the agent runtime's durable
// state (0028_agent_layer_schema.sql). Every query runs under the caller's JWT so
// RLS narrows to the firm; firm_id is stamped from ctx on writes (never trusted from
// the caller). INV-7: every run / proposal / approval / write here is also appended
// to the existing append-only audit_log via writeAudit. INV-4: agentConnections
// stores only a secret_ref pointer — never the secret, never model context.

// ── agent_tasks ───────────────────────────────────────────────────────────────

export type CreateTaskInput = {
  clientId?: string;
  createdByUserId?: string;
  kind: string;
  tier: 1 | 2 | 3 | 4; // INV-3
  input?: Record<string, unknown>;
};

// Stage a new unit of agentic work. RLS scopes the INSERT to the caller's firm.
export async function createTask(db: Db, ctx: Ctx, input: CreateTaskInput) {
  const [row] = await db
    .insert(agentTasks)
    .values({
      firmId: ctx.firmId,
      clientId: input.clientId ?? null,
      createdByUserId: input.createdByUserId ?? null,
      kind: input.kind,
      tier: input.tier,
      input: input.input ?? {},
    })
    .returning();
  await writeAudit(db, ctx, {
    action: "agent.task.create",
    resourceType: "agent_task",
    resourceId: row.id,
    metadata: { kind: input.kind, tier: input.tier, clientId: input.clientId ?? null },
  });
  return row;
}

// Record the terminal result + status of a task (e.g. done | failed).
export async function setTaskResult(
  db: Db,
  ctx: Ctx,
  taskId: string,
  status: string,
  result?: Record<string, unknown>,
) {
  const [row] = await db
    .update(agentTasks)
    .set({ status, result: result ?? null })
    .where(eq(agentTasks.id, taskId)) // RLS additionally narrows to the firm
    .returning();
  await writeAudit(db, ctx, {
    action: "agent.task.resolve",
    resourceType: "agent_task",
    resourceId: taskId,
    metadata: { status },
  });
  return row;
}

// ── agent_runs ────────────────────────────────────────────────────────────────

export type RecordRunInput = {
  taskId: string;
  parentRunId?: string;
  role: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  transcript?: unknown;
};

// Append one LLM turn under a task (RLS scopes via the parent task's firm). INV-7.
export async function recordRun(db: Db, ctx: Ctx, input: RecordRunInput) {
  const [row] = await db
    .insert(agentRuns)
    .values({
      taskId: input.taskId,
      parentRunId: input.parentRunId ?? null,
      role: input.role,
      model: input.model,
      inputTokens: input.inputTokens ?? null,
      outputTokens: input.outputTokens ?? null,
      transcript: input.transcript ?? null,
    })
    .returning();
  await writeAudit(db, ctx, {
    action: "agent.run.record",
    resourceType: "agent_run",
    resourceId: row.id,
    metadata: { taskId: input.taskId, role: input.role, model: input.model },
  });
  return row;
}

// ── action_proposals (the tier-3 approval gate) ───────────────────────────────

export type CreateProposalInput = {
  taskId: string;
  clientId?: string;
  toolName: string;
  args?: Record<string, unknown>;
  rationale: string;
  evidence?: unknown;
  confidence?: number;
};

// Stage a tier-3 WRITE as a proposal — it does NOT execute here. A human resolves
// it via resolveProposal; the confirm shim re-validates + executes on approval.
export async function createProposal(db: Db, ctx: Ctx, input: CreateProposalInput) {
  const [row] = await db
    .insert(actionProposals)
    .values({
      taskId: input.taskId,
      firmId: ctx.firmId,
      clientId: input.clientId ?? null,
      toolName: input.toolName,
      args: input.args ?? {},
      rationale: input.rationale,
      evidence: input.evidence ?? null,
      confidence: input.confidence === undefined ? null : String(input.confidence),
    })
    .returning();
  await writeAudit(db, ctx, {
    action: "agent.proposal.create",
    resourceType: "action_proposal",
    resourceId: row.id,
    metadata: { tool: input.toolName, taskId: input.taskId },
  });
  return row;
}

// Record a human's decision on a proposal (approved | rejected) plus the eventual
// execution result. resolvedByUserId is the approving preparer — the recorded human
// approval INV-3 requires before any governed write runs.
export async function resolveProposal(
  db: Db,
  ctx: Ctx,
  proposalId: string,
  status: "approved" | "rejected",
  opts?: { resolvedByUserId?: string; executionResult?: Record<string, unknown> },
) {
  const [row] = await db
    .update(actionProposals)
    .set({
      status,
      resolvedByUserId: opts?.resolvedByUserId ?? ctx.actorId,
      resolvedAt: new Date(),
      executionResult: opts?.executionResult ?? null,
    })
    .where(eq(actionProposals.id, proposalId)) // RLS additionally narrows to the firm
    .returning();
  await writeAudit(db, ctx, {
    action: status === "approved" ? "agent.proposal.approve" : "agent.proposal.reject",
    resourceType: "action_proposal",
    resourceId: proposalId,
    metadata: { status, tool: row?.toolName ?? null },
  });
  return row;
}

// List proposals for the firm, optionally filtered by status (e.g. the pending
// approval queue). RLS scopes to the firm; newest first.
export async function listProposals(db: Db, status?: string) {
  const base = db
    .select({
      id: actionProposals.id,
      taskId: actionProposals.taskId,
      clientId: actionProposals.clientId,
      toolName: actionProposals.toolName,
      args: actionProposals.args,
      rationale: actionProposals.rationale,
      evidence: actionProposals.evidence,
      confidence: actionProposals.confidence,
      status: actionProposals.status,
      createdAt: actionProposals.createdAt,
    })
    .from(actionProposals)
    .orderBy(desc(actionProposals.createdAt));
  return status ? base.where(eq(actionProposals.status, status)) : base;
}

// ── fetch_requirements (the document-collection ledger) ───────────────────────

export type FetchRequirementInput = {
  clientId: string;
  period: string;
  item: string;
  sourceType: string; // client_upload | connector | third_party
  fetchMethod: string; // manual | api | email
  connectionId?: string;
  assignedTo?: string;
  status?: string;
};

// Upsert one fetch requirement (idempotent per client+period+item). RLS scopes the
// write to the firm. Used by the planner when it decides what a return still needs.
export async function upsertFetchRequirement(db: Db, ctx: Ctx, input: FetchRequirementInput) {
  const existing = await db
    .select({ id: fetchRequirements.id })
    .from(fetchRequirements)
    .where(
      and(
        eq(fetchRequirements.clientId, input.clientId),
        eq(fetchRequirements.period, input.period),
        eq(fetchRequirements.item, input.item),
      ),
    );
  let row;
  if (existing[0]) {
    [row] = await db
      .update(fetchRequirements)
      .set({
        sourceType: input.sourceType,
        fetchMethod: input.fetchMethod,
        connectionId: input.connectionId ?? null,
        assignedTo: input.assignedTo ?? null,
        status: input.status ?? "needed",
      })
      .where(eq(fetchRequirements.id, existing[0].id))
      .returning();
  } else {
    [row] = await db
      .insert(fetchRequirements)
      .values({
        firmId: ctx.firmId,
        clientId: input.clientId,
        period: input.period,
        item: input.item,
        sourceType: input.sourceType,
        fetchMethod: input.fetchMethod,
        connectionId: input.connectionId ?? null,
        assignedTo: input.assignedTo ?? null,
        status: input.status ?? "needed",
      })
      .returning();
  }
  await writeAudit(db, ctx, {
    action: "agent.fetch.upsert",
    resourceType: "fetch_requirement",
    resourceId: row.id,
    metadata: { clientId: input.clientId, period: input.period, item: input.item },
  });
  return row;
}

// The collection ledger for a client + period — what we still need, oldest-first.
// RLS-scoped to the firm.
export async function listFetchRequirements(db: Db, clientId: string, period: string) {
  return db
    .select()
    .from(fetchRequirements)
    .where(and(eq(fetchRequirements.clientId, clientId), eq(fetchRequirements.period, period)))
    .orderBy(asc(fetchRequirements.createdAt));
}

// Advance a requirement's status (needed | requested | received | unavailable) and
// optionally stamp the fetched evidence + last attempt time.
export async function setFetchStatus(
  db: Db,
  ctx: Ctx,
  requirementId: string,
  status: string,
  opts?: { evidenceR2Key?: string; lastAttemptAt?: Date },
) {
  const [row] = await db
    .update(fetchRequirements)
    .set({
      status,
      evidenceR2Key: opts?.evidenceR2Key ?? undefined,
      lastAttemptAt: opts?.lastAttemptAt ?? new Date(),
    })
    .where(eq(fetchRequirements.id, requirementId)) // RLS additionally narrows to the firm
    .returning();
  await writeAudit(db, ctx, {
    action: "agent.fetch.status",
    resourceType: "fetch_requirement",
    resourceId: requirementId,
    metadata: { status },
  });
  return row;
}

// ── agent_connections (scoped credential references — INV-4) ───────────────────

export type CreateConnectionInput = {
  clientId?: string;
  provider: string;
  authType: string;
  scopes: string[];
  secretRef: string; // a pointer into the secret store — never the secret itself
  status?: string;
};

// Register a scoped credential reference. secret_ref is a pointer only; the secret
// never lands in this table and never enters model context (INV-4).
export async function createConnection(db: Db, ctx: Ctx, input: CreateConnectionInput) {
  const [row] = await db
    .insert(agentConnections)
    .values({
      firmId: ctx.firmId,
      clientId: input.clientId ?? null,
      provider: input.provider,
      authType: input.authType,
      scopes: input.scopes,
      secretRef: input.secretRef,
      status: input.status ?? "pending",
    })
    .returning();
  await writeAudit(db, ctx, {
    action: "agent.connection.create",
    resourceType: "agent_connection",
    resourceId: row.id,
    metadata: { provider: input.provider, authType: input.authType, clientId: input.clientId ?? null }, // never secretRef
  });
  return row;
}

// ── artifacts ─────────────────────────────────────────────────────────────────

export type CreateArtifactInput = {
  taskId: string;
  clientId?: string;
  type: string;
  r2Key?: string;
  content?: Record<string, unknown>;
};

// Persist a durable task output (brief / draft / worksheet). Large blobs go to R2
// (r2Key); small structured outputs stay inline (content).
export async function createArtifact(db: Db, ctx: Ctx, input: CreateArtifactInput) {
  const [row] = await db
    .insert(artifacts)
    .values({
      taskId: input.taskId,
      firmId: ctx.firmId,
      clientId: input.clientId ?? null,
      type: input.type,
      r2Key: input.r2Key ?? null,
      content: input.content ?? null,
    })
    .returning();
  await writeAudit(db, ctx, {
    action: "agent.artifact.create",
    resourceType: "artifact",
    resourceId: row.id,
    metadata: { type: input.type, taskId: input.taskId },
  });
  return row;
}
