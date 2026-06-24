// CAPABILITY 6 tools — Tax review checklists (tier 2, the chunked-parallel pattern INV-6).
// run_checklist fans a checklist's items out to bounded parallel sub-agents (runChecklist),
// each verdict grounded through lib/research for tax assertions (INV-1, never model memory),
// and persists a review-report artifact (createArtifact type "report").
//
// Tier 2 (propose-only, writes NOTHING external): the only persisted output is an internal
// `report` artifact — a durable review record, not an external side effect or a governed write.
// It runs under withFirm (RLS) + writes the audited artifact. requiredScopes ["checklist:read",
// "research:read"]; runTool re-checks at dispatch.

import { z } from "zod";
import type { AgentTool } from "../registry";
import { withFirm } from "@/lib/auth/tenant";
import { AnthropicProvider } from "@/lib/ai/anthropic";
import { createTask } from "@/lib/repository/agent";
import { getChecklist, runChecklist, makeResearchSubAgent } from "@/lib/checklists";

const RunChecklistArgs = z.object({
  clientId: z.string().min(1),
  checklistId: z.string().min(1), // e.g. "1040_prefile_review"
});

const CHECKLIST_TOOLS: AgentTool[] = [
  {
    name: "run_checklist",
    description:
      "Run a named tax review checklist for a client. Fans the checklist's items out to parallel " +
      "sub-agents (each tax assertion grounded against authority via the research layer) and " +
      "produces a review report: per-item pass/fail/flag with evidence and citations. Use for a " +
      "pre-file review (e.g. checklistId '1040_prefile_review').",
    tier: 2,
    access: "read",
    requiredScopes: ["checklist:read", "research:read"],
    schema: RunChecklistArgs,
    run: async (a) => {
      const args = RunChecklistArgs.parse(a);
      const checklist = getChecklist(args.checklistId);
      if (!checklist) return { error: `unknown checklist: ${args.checklistId}` };

      // Proposer = Sonnet (grounded generation), judge = Opus (adversarial freshness) — the same
      // separate-model pairing the research route uses. Constructed lazily so a missing key fails
      // cleanly inside the tool rather than at import.
      let proposer: AnthropicProvider;
      let judge: AnthropicProvider;
      try {
        proposer = new AnthropicProvider(undefined, "claude-sonnet-4-6");
        judge = new AnthropicProvider(undefined, "claude-opus-4-8");
      } catch {
        return { error: "ai_unavailable" };
      }
      const runSubAgent = makeResearchSubAgent(proposer, judge);

      const out = await withFirm(async (db, ctx) => {
        // The review runs under its own agent_task (tier 2) so the report artifact has an FK and
        // the run is auditable end to end (INV-7).
        const task = await createTask(db, ctx, {
          clientId: args.clientId,
          kind: `checklist:${checklist.id}`,
          tier: 2,
        });
        return runChecklist(db, ctx, args.clientId, checklist, { runSubAgent, taskId: task.id });
      });
      return out ?? { error: "unauthorized" };
    },
    describe: (a) => `Run checklist ${a.checklistId} for client ${a.clientId}`,
  },
];

export default CHECKLIST_TOOLS;
