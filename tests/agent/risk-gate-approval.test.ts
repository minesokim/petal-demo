import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { actionProposals } from "../../lib/db/schema";
import type { Ctx } from "../../lib/repository/types";
import { createTask, createProposal } from "../../lib/repository/agent";
import { resolveProposalCore } from "../../lib/agent/approve";
import { classifyRisk } from "../../lib/agent/risk";

// The two safety invariants the gate adds on top of the existing approval plumbing:
//   (a) separation of duties — a 'review'-lane action cannot be self-approved by its stager.
//   (b) never-auto-submit — approving an irreversible external commit yields 'ready_to_submit'
//       and does NOT run the tool; a human performs the submit.

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  process.env.DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || Buffer.alloc(32, 7).toString("base64"); // 32-byte test KEK
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

const CLAIMS: Claims = { firm_id: A, role: "reviewer", user_type: "preparer" };
const ALICE: Ctx = { firmId: A, actorId: "alice", actorType: "preparer", role: "reviewer" };
const CAROL: Ctx = { firmId: A, actorId: "carol", actorType: "preparer", role: "reviewer" };

const xeroRisk = classifyRisk({ name: "create_xero_bank_transaction", tier: 3, access: "write", connector: "api", stakes: "high" }, {});
const oltSubmitRisk = classifyRisk({ name: "olt_submit_return", tier: 3, access: "write", connector: "browser", stakes: "high", irreversibleSubmit: true }, {});
const taskRisk = classifyRisk({ name: "create_task", tier: 3, access: "write", connector: "internal", stakes: "low", reversible: true }, {});

describe("risk gate — approval invariants", () => {
  it("(a) the stager of a review-lane action cannot self-approve it; a different reviewer can", async () => {
    await asTenant(CLAIMS, async (db) => {
      const task = await createTask(db as never, ALICE, { kind: "agent:test", tier: 3 });
      const p = await createProposal(db as never, ALICE, { taskId: task.id, toolName: "create_xero_bank_transaction", rationale: "reconcile", risk: xeroRisk });

      const self = await resolveProposalCore(db as never, ALICE, p.id, "approve");
      expect(self.ok).toBe(false);
      if (!self.ok) expect(self.error).toMatch(/different reviewer/i);

      const other = await resolveProposalCore(db as never, CAROL, p.id, "approve");
      expect(other.ok).toBe(true);
      if (other.ok) expect(other.status).toBe("approved"); // deferred (external connector), but approved
    });
  });

  it("(b) approving an irreversible external submit yields ready_to_submit and does NOT execute", async () => {
    await asTenant(CLAIMS, async (db) => {
      const task = await createTask(db as never, ALICE, { kind: "agent:test", tier: 3 });
      const p = await createProposal(db as never, ALICE, { taskId: task.id, toolName: "olt_submit_return", rationale: "e-file", risk: oltSubmitRisk });
      expect(p.humanMustSubmit).toBe(true);

      const out = await resolveProposalCore(db as never, CAROL, p.id, "approve");
      expect(out.ok).toBe(true);
      if (out.ok) {
        expect(out.status).toBe("ready_to_submit");
        expect(out.executionResult?.humanMustSubmit).toBe(true);
      }
      const [row] = await db.select().from(actionProposals).where(eq(actionProposals.id, p.id));
      expect(row.status).toBe("ready_to_submit"); // never 'approved' / executed
    });
  });

  it("(c) a confirm-lane internal write still approves and executes normally", async () => {
    await asTenant(CLAIMS, async (db) => {
      const task = await createTask(db as never, ALICE, { kind: "agent:test", tier: 3 });
      const p = await createProposal(db as never, ALICE, { taskId: task.id, toolName: "create_task", args: { title: "Follow up" }, rationale: "make a task", risk: taskRisk });
      // confirm lane is not separation-gated — the same reviewer may approve it.
      const out = await resolveProposalCore(db as never, ALICE, p.id, "approve");
      expect(out.ok).toBe(true);
      if (out.ok) expect(out.status).toBe("approved");
    });
  });
});
