import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { actionProposals, agentTasks } from "../../lib/db/schema";
import type { Ctx } from "../../lib/repository/types";
import { listProposals } from "../../lib/repository/agent";
import { stageConversationalProposals } from "../../lib/agent/stage-proposals";
import { classifyRisk } from "../../lib/agent/risk";
import type { ProposedAction } from "../../lib/agent/runner";

// A write the agent stages in CHAT (AI mode) must enter the SAME durable, approvable queue the Tasks
// path uses — not vanish with the SSE stream (RULE 1: no in-memory-only persistence). These tests prove
// the bridge persists a chat-staged write as an action_proposal: durable, firm-scoped, PII-encrypted,
// carrying its risk lane, in the pending queue, anchored to a tier-3 agent_task.

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  process.env.DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || Buffer.alloc(32, 7).toString("base64");
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','Firm A');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('h-a','${A}','HH A','individual','Standard',2024);
  `);
});

async function asTenant<T>(claims: Claims, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const CLAIMS: Claims = { firm_id: A, role: "preparer", user_type: "preparer" };
const CTX: Ctx = { firmId: A, actorId: "alice", actorType: "preparer", role: "preparer" };

const confirmRisk = classifyRisk({ name: "create_task", tier: 3, access: "write", connector: "internal", stakes: "low", reversible: true }, {});
const reviewRisk = classifyRisk({ name: "create_task", tier: 3, access: "write", connector: "internal", stakes: "low", reversible: true }, {}, { researchBucket: "coverage_gap" });
const action = (risk: typeof confirmRisk): ProposedAction => ({
  tool: "create_task", args: { householdId: "h-a", title: "Follow up on the deduction" },
  title: "Create task “Follow up on the deduction” for client h-a", risk,
});

describe("stageConversationalProposals — chat-staged writes become durable, approvable proposals", () => {
  it("persists a chat-staged write into the durable queue: firm-scoped, PII-encrypted, with its risk lane, anchored to a tier-3 task", async () => {
    await asTenant(CLAIMS, async (db) => {
      const out = await stageConversationalProposals(db as never, CTX, { message: "make a follow-up task", proposedActions: [action(confirmRisk)] });
      expect(out.proposals).toHaveLength(1);
      expect(out.proposals[0].riskLane).toBe("confirm");

      const [row] = await db.select().from(actionProposals).where(eq(actionProposals.id, out.proposals[0].id));
      expect(row.firmId).toBe(A); // firm stamped from ctx, never the caller
      expect(row.toolName).toBe("create_task");
      expect(row.status).toBe("pending");
      expect(row.riskLane).toBe("confirm");
      expect(row.payloadEnc).toBeTruthy(); // args/evidence/rationale envelope-encrypted
      expect(row.args).toEqual({}); // no PII at rest in the plaintext column

      const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, out.taskId));
      expect(task.kind).toBe("chat");
      expect(task.tier).toBe(3);

      const pending = await listProposals(db as never, "pending");
      expect(pending.some((p) => p.id === out.proposals[0].id)).toBe(true);
    });
  });

  it("a coverage-gap-backed write persists at the review (line-by-line) lane", async () => {
    await asTenant(CLAIMS, async (db) => {
      const out = await stageConversationalProposals(db as never, CTX, { message: "x", proposedActions: [action(reviewRisk)] });
      expect(out.proposals[0].riskLane).toBe("review");
    });
  });
});
