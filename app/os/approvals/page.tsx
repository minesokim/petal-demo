// /os/approvals — the human-commit gate's frontend. Lists this firm's pending action_proposals
// (RLS-scoped, PII decrypted from payload_enc) and lets a reviewer approve/reject each. Server
// entry: real data → the client queue. Nothing here is a fixture — an empty queue means Petal has
// no staged actions awaiting review.

import { withFirm } from "@/lib/auth/tenant";
import { listProposals } from "@/lib/repository/agent";
import { ApprovalQueue, type QueuedProposal } from "./approval-queue";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const rows = (await withFirm((db) => listProposals(db, "pending"))) ?? [];
  const proposals: QueuedProposal[] = rows.map((r) => ({
    id: r.id,
    toolName: r.toolName,
    rationale: r.rationale,
    riskLane: r.riskLane,
    riskLevel: r.riskLevel,
    riskFactors: (r.riskFactors as QueuedProposal["riskFactors"]) ?? [],
    humanMustSubmit: r.humanMustSubmit,
    reviewArtifact: (r.reviewArtifact as QueuedProposal["reviewArtifact"]) ?? null,
    confidence: r.confidence,
    createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt as string)).toISOString(),
  }));
  return <ApprovalQueue proposals={proposals} />;
}
