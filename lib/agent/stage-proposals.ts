import type { Db, Ctx } from "@/lib/repository/types";
import { createTask, createProposal } from "@/lib/repository/agent";
import { artifactGeneric } from "./review-artifact";
import type { ProposedAction } from "./runner";

// Bridge the LIVE conversational agent (runAgent / the /api/agent AI-mode entry point) to the durable
// approval queue. runAgent classifies tier-3 writes through the risk gate and returns them as in-memory
// proposedActions — but without this they vanish when the SSE stream ends (RULE 1: no in-memory-only
// "persistence"). This anchors the chat turn to a durable agent_task and persists each staged write as
// an action_proposal: the SAME queue the durable Tasks path uses, resolvable via resolveProposalAction
// with all of its guards intact (RLS firm-scope, reviewer-only + no-self-approval on the review lane,
// append-only audit). PII in args/evidence is envelope-encrypted by createProposal. Returns the durable
// proposal ids so the client can link the chat to the approval queue.

export type StagedConversationalProposal = {
  id: string;
  toolName: string;
  title: string;
  riskLane: string | null;
};

function firstClientId(actions: ProposedAction[]): string | undefined {
  for (const a of actions) if (typeof a.args.householdId === "string") return a.args.householdId;
  return undefined;
}

export async function stageConversationalProposals(
  db: Db,
  ctx: Ctx,
  input: { message: string; proposedActions: ProposedAction[] },
): Promise<{ taskId: string; proposals: StagedConversationalProposal[] }> {
  // Anchor the chat turn as a tier-3 (governed-write) task — it produced staged writes that a human
  // must approve. kind "chat" distinguishes the AI-mode entry point from a handed-to-Petal Task.
  const task = await createTask(db, ctx, {
    kind: "chat",
    tier: 3,
    clientId: firstClientId(input.proposedActions),
    createdByUserId: ctx.actorId ?? undefined,
    input: { message: input.message.slice(0, 2000), source: "ai_mode" },
  });

  const proposals: StagedConversationalProposal[] = [];
  for (const pa of input.proposedActions) {
    const row = await createProposal(db, ctx, {
      taskId: task.id,
      clientId: typeof pa.args.householdId === "string" ? pa.args.householdId : undefined,
      toolName: pa.tool,
      args: pa.args,
      rationale: pa.title,
      evidence: pa.evidence ?? undefined,
      confidence: pa.risk?.confidence ?? undefined,
      risk: pa.risk,
      // CHEAP VERIFICATION: ship a field->source review artifact so a reviewer verifies the staged
      // write in seconds instead of redoing it. artifactGeneric maps each arg to its source (matching
      // the durable Task runtime's buildArtifact for non-OLT tools); encrypted into payload_enc.
      reviewArtifact: artifactGeneric(pa.tool, pa.title, pa.args),
    });
    proposals.push({ id: row.id, toolName: pa.tool, title: pa.title, riskLane: row.riskLane });
  }
  return { taskId: task.id, proposals };
}
