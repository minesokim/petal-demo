// Serializable shape of a pending action_proposal as the dashboard renders it (PII already
// decrypted server-side). Plain types only (type-only imports), so both the server data seam
// (lib/server/firm-data) and the client card (components/os/approval-card) can import it.

import type { ReviewArtifact } from "./review-artifact";

export type QueuedProposal = {
  id: string;
  toolName: string;
  rationale: string;
  riskLane: string | null; // auto | confirm | review | blocked
  riskLevel: string | null; // low | medium | high
  riskFactors: { name: string; level: string; detail: string }[];
  humanMustSubmit: boolean;
  reviewArtifact: ReviewArtifact | null;
  confidence: string | null;
  createdAt: string; // ISO
};
