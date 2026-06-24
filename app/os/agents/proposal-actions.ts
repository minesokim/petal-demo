"use server";

// The tier-3 approval gate (server-action wrapper) — on the DB, NOT a held-open
// workflow. A staged write (action_proposals row) executes ONLY after a recorded human
// approval. This mirrors confirmAgentAction: getFirmContext (401) -> withFirm -> the
// tenant-scoped core (resolveProposalCore), which loads the proposal RLS-scoped, on
// approve re-validates + executes the staged write via runTool (the only tier-3 write
// path) if the connector is live (else records deferred), and audits write.executed; on
// reject audits approval.denied. The core lives in lib/agent/approve.ts so it is testable.

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { resolveProposalCore, type ResolveDecision, type ResolveProposalOutcome } from "@/lib/agent/approve";

export type { ResolveDecision, ResolveProposalOutcome };

export async function resolveProposalAction(
  proposalId: string,
  decision: ResolveDecision,
): Promise<ResolveProposalOutcome> {
  const result = await withFirm((db, ctx) => resolveProposalCore(db, ctx, proposalId, decision));
  if (!result) return { ok: false, error: "unauthorized" }; // withFirm returns null when not signed in
  if (result.ok) revalidatePath("/os/agents");
  return result;
}
