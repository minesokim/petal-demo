"use server";

// The recon REVIEW surface — a read-only server action that returns this client's
// reconciliation proposals (with their evidence + tie-out trace) for the EXISTING
// confirm/approve UI (the same action_proposals + resolveProposalAction approval gate the
// /os/agents surface already uses — no new approval path). RLS scopes the read to the
// caller's firm; we additionally narrow to the client and to the two Xero recon write
// tools so this surface shows only reconciliation items.
//
// This action writes nothing. Approving an item goes through the existing
// resolveProposalAction gate, where the Xero write tools are NOT live (isToolEnabled is
// false) and record a deferred result — so even an approval performs no external write in v1.

import { and, desc, eq, inArray } from "drizzle-orm";
import { withFirm } from "@/lib/auth/tenant";
import { actionProposals } from "@/lib/db/schema";
import { decryptProposalPayload } from "@/lib/repository/agent";

const RECON_WRITE_TOOLS = ["create_xero_bank_transaction", "create_xero_manual_journal"] as const;

export type ReconProposal = {
  id: string;
  taskId: string;
  clientId: string | null;
  toolName: string;
  title: string;
  args: Record<string, unknown>;
  rationale: string;
  evidence: unknown;
  confidence: string | null;
  status: string;
  createdAt: Date;
};

// List a client's recon proposals, newest first. status defaults to "pending" (the
// review queue); pass undefined-equivalent by calling with status: null for all.
export async function listReconProposalsAction(
  clientId: string,
  opts: { status?: string | null } = {},
): Promise<ReconProposal[]> {
  const status = opts.status === undefined ? "pending" : opts.status;
  const rows = await withFirm(async (db) => {
    const filters = [
      eq(actionProposals.clientId, clientId),
      inArray(actionProposals.toolName, RECON_WRITE_TOOLS as unknown as string[]),
    ];
    if (status !== null) filters.push(eq(actionProposals.status, status));
    return db
      .select({
        id: actionProposals.id,
        taskId: actionProposals.taskId,
        clientId: actionProposals.clientId,
        toolName: actionProposals.toolName,
        args: actionProposals.args,
        rationale: actionProposals.rationale,
        evidence: actionProposals.evidence,
        payloadEnc: actionProposals.payloadEnc,
        confidence: actionProposals.confidence,
        status: actionProposals.status,
        createdAt: actionProposals.createdAt,
      })
      .from(actionProposals)
      .where(and(...filters))
      .orderBy(desc(actionProposals.createdAt));
  });

  if (!rows) return [];
  return rows.map((r) => {
    // The PII payload (args/evidence/rationale) is encrypted at rest — decrypt for display.
    const { args, evidence, rationale } = decryptProposalPayload(r);
    return {
      id: r.id,
      taskId: r.taskId,
      clientId: r.clientId,
      toolName: r.toolName,
      title: titleFor(r.toolName, args),
      args,
      rationale,
      evidence,
      confidence: r.confidence,
      status: r.status,
      createdAt: r.createdAt,
    };
  });
}

// A one-line human label for the confirm card (no all-caps, no em dash).
function titleFor(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "create_xero_manual_journal") {
    return `Post month-end journal "${String(args.narration ?? "")}" dated ${String(args.date ?? "")}`;
  }
  return `Reconcile bank txn ${String(args.bankTransactionId ?? "")} with ledger ${String(args.ledgerItemId ?? "")} (${String(args.amount ?? "")})`;
}
