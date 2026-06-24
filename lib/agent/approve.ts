// The approval-gate CORE — the tenant-scoped logic the resolveProposalAction server
// action delegates to once it has a firm context. Split out so it is directly testable
// against PGlite (a Db + Ctx) without standing up Clerk. The server action is the thin
// auth wrapper (getFirmContext -> withFirm -> this); this is where the tier-3 governed
// write actually executes — and ONLY after a recorded human approval (INV-3).

import { eq } from "drizzle-orm";
import { actionProposals } from "@/lib/db/schema";
import { resolveProposal, claimProposal } from "@/lib/repository/agent";
import { writeAudit } from "@/lib/repository/audit";
import { runTool, isToolEnabled, TOOL_BY_NAME, ALL_SCOPES } from "./registry";
import { canApprove } from "@/lib/auth/roles";
import type { Db, Ctx } from "@/lib/repository/types";

export type ResolveDecision = "approve" | "reject";

export type ResolveProposalOutcome =
  | { ok: true; status: "approved" | "rejected"; executionResult: Record<string, unknown> | null }
  | { ok: false; error: string };

// Resolve one proposal under an already-established firm context. RLS (the caller's Db)
// narrows the load to the firm, so a foreign proposal isn't found. On approve the staged
// write executes via runTool (allowWrite) IF its connector is live; otherwise the result
// is recorded deferred. Every branch stamps execution_result + an audit row (INV-7).
export async function resolveProposalCore(
  db: Db,
  ctx: Ctx,
  proposalId: string,
  decision: ResolveDecision,
): Promise<ResolveProposalOutcome> {
  const [proposal] = await db.select().from(actionProposals).where(eq(actionProposals.id, proposalId));
  if (!proposal) return { ok: false, error: "not found" };
  if (proposal.status !== "pending") return { ok: false, error: "already resolved" };

  if (decision === "reject") {
    // HIGH-1: atomic claim to "rejected" WHERE status="pending" — only one resolver wins.
    const claimed = await claimProposal(db, ctx, proposalId, "rejected", { resolvedByUserId: ctx.actorId ?? undefined });
    if (!claimed) return { ok: false, error: "already resolved" };
    await writeAudit(db, ctx, {
      action: "approval.denied",
      resourceType: "action_proposal",
      resourceId: proposalId,
      metadata: { tool: proposal.toolName },
    });
    return { ok: true, status: "rejected", executionResult: null };
  }

  // RBAC — the preparer-drafts / reviewer-approves split. A preparer may draft/stage a proposal
  // but only a reviewer, admin, or owner may APPROVE it (closes the audit's "a junior preparer
  // can approve their own AI drafts" hole). Enforced at this single approval chokepoint, before
  // any state change, so no surface can bypass it by forgetting to check.
  if (!canApprove(ctx.role)) {
    return { ok: false, error: "forbidden: only a reviewer, admin, or owner can approve a staged action" };
  }

  // approve — the recorded human approval. HIGH-1: ATOMIC CLAIM FIRST. A single conditional
  // UPDATE (status pending -> approved) decides the winner; two concurrent approvals of one
  // proposal race here and exactly one wins, so the staged write runs EXACTLY once. The
  // loser gets null and bails without ever invoking runTool (no double-execution).
  const claimed = await claimProposal(db, ctx, proposalId, "approved", { resolvedByUserId: ctx.actorId ?? undefined });
  if (!claimed) return { ok: false, error: "already resolved" };

  // Re-validate the staged tool is a known WRITE. (We have already won the claim; if the
  // tool isn't confirmable, flip the row to rejected by id.)
  const tool = TOOL_BY_NAME.get(proposal.toolName);
  if (!tool || tool.access !== "write") {
    await resolveProposal(db, ctx, proposalId, "rejected", { resolvedByUserId: ctx.actorId ?? undefined });
    return { ok: false, error: "not a confirmable write action" };
  }

  const args = (proposal.args ?? {}) as Record<string, unknown>;
  let executionResult: Record<string, unknown>;
  if (!isToolEnabled(proposal.toolName)) {
    // External connector is Phase 3 — do NOT execute; record a deferred result so the
    // approval is durable and replays when the connector lands.
    executionResult = { deferred: true, reason: "external connector not enabled in v1" };
  } else {
    try {
      // MEDIUM-2: pass ALL_SCOPES — v1 posture: every active firm member holds all firm
      // scopes (per-role narrowing is a follow-up once a role->scope model exists).
      const out = await runTool(proposal.toolName, args, ALL_SCOPES, { allowWrite: true });
      executionResult = { executed: true, output: (out ?? null) as unknown };
    } catch (e) {
      executionResult = { executed: false, error: e instanceof Error ? e.name : "failed" };
    }
  }

  await resolveProposal(db, ctx, proposalId, "approved", {
    resolvedByUserId: ctx.actorId ?? undefined,
    executionResult,
  });
  await writeAudit(db, ctx, {
    action: "write.executed",
    resourceType: "action_proposal",
    resourceId: proposalId,
    metadata: { tool: proposal.toolName, deferred: executionResult.deferred === true },
  });
  return { ok: true, status: "approved", executionResult };
}
