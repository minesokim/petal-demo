import { describe, it, expect, beforeAll } from "vitest";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import type { Ctx } from "../../lib/repository/types";
import {
  runTask,
  runSubAgent,
  type ToolModel,
  type ModelCallArgs,
  type ModelResponse,
} from "../../lib/agent/runtime";
import { resolveProposalCore } from "../../lib/agent/approve";
import { TOOL_BY_NAME, type AgentTool } from "../../lib/agent/registry";
import { afterAll } from "vitest";

// A scripted, offline model implementing the ToolModel seam (the MockProvider analogue
// for the tool-use loop): turn 0 emits a tool_use for `toolName`; turn 1 emits a final
// text reply. Deterministic, no network, no key.
function scriptedModel(toolName: string, toolInput: unknown): ToolModel {
  let turn = 0;
  return {
    async call(_args: ModelCallArgs): Promise<ModelResponse> {
      if (turn++ === 0) {
        return {
          content: [{ type: "tool_use", id: "tu_1", name: toolName, input: toolInput }],
          stopReason: "tool_use",
          usage: { inputTokens: 10, outputTokens: 5 },
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ reply: "staged the write for your approval" }) }],
        stopReason: "end_turn",
        usage: { inputTokens: 8, outputTokens: 4 },
      };
    },
  };
}

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','Firm A');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('h-a','${A}','HH A','individual','Standard',2024);
  `);
});

// Run a body against a Drizzle handle bound to a tenant transaction (RLS applies).
async function asTenant<T>(claims: Claims, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const result = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return result;
  } catch (e) {
    try { await pg.exec("rollback"); } catch { /* aborted */ }
    throw e;
  }
}

const CLAIMS: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
const CTX: Ctx = { firmId: A, actorId: "user_1", actorType: "preparer" };

// A WRITE tool whose run() THROWS — proof that a tier-2 task NEVER executes it inline.
// If staging is correct, run() is never reached. Its connector is "not live" (not in the
// ENABLED_WRITE_TOOLS core set), so the gate records it deferred on approve.
const explodingWrite: AgentTool = {
  name: "__test_external_write",
  description: "stages an external write that must never run inline",
  tier: 3,
  access: "write",
  requiredScopes: [],
  schema: z.object({ note: z.string() }),
  run: async () => {
    throw new Error("external write executed inline — INV-3 violated");
  },
  describe: (a) => `external write: ${a.note}`,
};

// The approval gate re-validates a proposal's tool against the GLOBAL registry (defense
// in depth — only a registered tool can be approved). Register the probe there for the
// gate tests; since it is NOT in the core ENABLED_WRITE_TOOLS set, the gate treats its
// connector as not-live and records the result deferred (never calling its run()).
TOOL_BY_NAME.set(explodingWrite.name, explodingWrite);
afterAll(() => {
  TOOL_BY_NAME.delete(explodingWrite.name);
});

describe("runtime — tier-2 task stages proposals, executes no external write (c)", () => {
  it("produces action_proposals and runs no inline write", async () => {
    const out = await asTenant(CLAIMS, async (db) => {
      const result = await runTask(
        {
          firmCtx: { db: db as never, ctx: CTX },
          kind: "draft_outreach",
          tier: 2,
          input: { goal: "text the client" },
          clientId: "h-a",
          tools: [explodingWrite],
          callerScopes: [],
        },
        { model: scriptedModel("__test_external_write", { note: "please send" }) },
      );
      const proposals = await db.select().from(schema.actionProposals);
      const runs = await db.select().from(schema.agentRuns);
      const task = (await db.select().from(schema.agentTasks))[0];
      return { result, proposals, runs, task };
    });

    // The task stopped at awaiting_approval — it wrote NOTHING external (run() never threw).
    expect(out.result.status).toBe("awaiting_approval");
    expect(out.result.proposalIds.length).toBe(1);
    // Exactly one staged proposal for the write tool, status pending.
    expect(out.proposals.length).toBe(1);
    expect(out.proposals[0].toolName).toBe("__test_external_write");
    expect(out.proposals[0].status).toBe("pending");
    // The transcript was persisted to agent_runs (INV-7).
    expect(out.runs.length).toBeGreaterThanOrEqual(1);
    // The agent_tasks row reflects the awaiting_approval status.
    expect(out.task.status).toBe("awaiting_approval");
  });
});

describe("approval gate — approve records execution_result + audit; reject audits denial (d)", () => {
  it("approve path: not-live connector records {deferred:true} + write.executed audit", async () => {
    const out = await asTenant(CLAIMS, async (db) => {
      // Stage a proposal directly (the gate's input).
      const [task] = await db
        .insert(schema.agentTasks)
        .values({ firmId: A, clientId: "h-a", kind: "k", tier: 3 })
        .returning();
      const [proposal] = await db
        .insert(schema.actionProposals)
        .values({ taskId: task.id, firmId: A, clientId: "h-a", toolName: "__test_external_write", args: { note: "x" }, rationale: "r" })
        .returning();

      const decision = await resolveProposalCore(db as never, CTX, proposal.id, "approve");
      const [after] = await db.select().from(schema.actionProposals).where(eq(schema.actionProposals.id, proposal.id));
      const audits = await db.select().from(schema.auditLog);
      return { decision, after, audits };
    });

    expect(out.decision.ok).toBe(true);
    if (out.decision.ok) {
      expect(out.decision.status).toBe("approved");
      expect(out.decision.executionResult).toEqual({ deferred: true, reason: "external connector not enabled in v1" });
    }
    // execution_result persisted on the proposal; status approved.
    expect(out.after.status).toBe("approved");
    expect(out.after.executionResult).toEqual({ deferred: true, reason: "external connector not enabled in v1" });
    expect(out.after.resolvedByUserId).toBe("user_1");
    // A write.executed audit row was appended (INV-7).
    expect(out.audits.some((a) => a.action === "write.executed")).toBe(true);
    expect(out.audits.some((a) => a.action === "agent.proposal.approve")).toBe(true);
  });

  it("reject path: audits approval.denied and executes nothing", async () => {
    const out = await asTenant(CLAIMS, async (db) => {
      const [task] = await db
        .insert(schema.agentTasks)
        .values({ firmId: A, clientId: "h-a", kind: "k", tier: 3 })
        .returning();
      const [proposal] = await db
        .insert(schema.actionProposals)
        .values({ taskId: task.id, firmId: A, clientId: "h-a", toolName: "__test_external_write", args: {}, rationale: "r" })
        .returning();

      const decision = await resolveProposalCore(db as never, CTX, proposal.id, "reject");
      const [after] = await db.select().from(schema.actionProposals).where(eq(schema.actionProposals.id, proposal.id));
      const audits = await db.select().from(schema.auditLog);
      return { decision, after, audits };
    });

    expect(out.decision.ok).toBe(true);
    if (out.decision.ok) expect(out.decision.status).toBe("rejected");
    expect(out.after.status).toBe("rejected");
    expect(out.after.executionResult).toBeNull();
    expect(out.audits.some((a) => a.action === "approval.denied")).toBe(true);
    expect(out.audits.some((a) => a.action === "write.executed")).toBe(false);
  });
});

describe("runSubAgent — read tool auto-executes, write is staged (not run)", () => {
  it("stages a write and never calls its run()", async () => {
    const res = await runSubAgent(
      {
        role: "tester",
        system: "test",
        tools: [explodingWrite],
        input: "do the thing",
        outputSchema: z.object({ reply: z.string() }),
        taxScope: "synthetic",
      },
      { model: scriptedModel("__test_external_write", { note: "n" }) },
    );
    expect(res.proposals.length).toBe(1);
    expect(res.proposals[0].toolName).toBe("__test_external_write");
  });
});
