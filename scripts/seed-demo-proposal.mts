// One-off: seed (or clean) a single LABELED-demo pending action_proposal for the Vazant demo firm
// so the /os/approvals queue can be visually verified with a populated card, then removed.
//   seed:  node --env-file=.env.local --import tsx scripts/seed-demo-proposal.mts
//   clean: node --env-file=.env.local --import tsx scripts/seed-demo-proposal.mts clean
import { withTenant } from "../lib/db/client";
import { createTask, createProposal } from "../lib/repository/agent";
import { classifyRisk } from "../lib/agent/risk";
import { artifactFromOltPlan } from "../lib/agent/review-artifact";
import { agentTasks } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

const FIRM = "000000a1-0000-4000-8000-0000000000a1";
const KIND = "demo:approval-card";
const mode = process.argv[2] === "clean" ? "clean" : "seed";

await withTenant({ firm_id: FIRM, role: "owner", user_type: "preparer" }, async (db) => {
  if (mode === "clean") {
    // cascade deletes the proposal (action_proposals.task_id ON DELETE CASCADE)
    await db.delete(agentTasks).where(and(eq(agentTasks.firmId, FIRM), eq(agentTasks.kind, KIND)));
    console.log("cleaned demo proposal(s)");
    return;
  }
  const ctx = { firmId: FIRM, actorId: "demo-seed", actorType: "preparer" as const, role: "preparer" as const };
  const task = await createTask(db, ctx, { kind: KIND, tier: 3 });
  const plan = {
    ref: { clientId: "h-chen", taxYear: 2024 },
    entries: [
      { screen: "1040 / Income / W-2", field: "wages_box1", value: "84,000.00", source: "extracted:W-2 — Hartline Logistics box 1" },
      { screen: "1040 / Income / Interest", field: "interest", value: "312.00", source: "extracted:1099-INT box 1" },
    ],
  };
  const risk = classifyRisk({ name: "olt_stage_return", tier: 3, access: "write", connector: "browser", stakes: "high" }, {});
  await createProposal(db, ctx, {
    taskId: task.id,
    toolName: "olt_stage_return",
    rationale: "[DEMO] Stage the 2024 return in OLT",
    risk,
    reviewArtifact: artifactFromOltPlan(plan),
  });
  console.log("seeded one demo proposal (labeled [DEMO]) for", FIRM);
});
process.exit(0);
