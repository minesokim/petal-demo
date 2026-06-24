import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import type { Ctx } from "../../lib/repository/types";
import { resolveProposalCore } from "../../lib/agent/approve";
import {
  runTool,
  ToolAccessError,
  ALL_SCOPES,
  ENABLED_WRITE_TOOLS,
  TOOL_BY_NAME,
  type AgentTool,
} from "../../lib/agent/registry";
import { redactValue } from "../../lib/ai/redact";

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
const CTX: Ctx = { firmId: A, actorId: "user_1", actorType: "preparer", role: "owner" }; // approver role

// HIGH-1: a write tool that COUNTS how many times it actually executes. We register it in
// the global registry AND mark it "live" (add its name to ENABLED_WRITE_TOOLS) so the gate
// takes the EXECUTE path (not the deferred path) and we can prove EXACTLY-ONCE execution by
// counting run() invocations across two concurrent approvals.
let runCount = 0;
const countingWrite: AgentTool = {
  name: "__test_counting_write",
  description: "counts executions",
  tier: 3,
  access: "write",
  requiredScopes: [],
  schema: z.object({ note: z.string().optional() }),
  run: async () => {
    runCount += 1;
    return { ran: true };
  },
  describe: () => "counting write",
};

beforeAll(() => {
  TOOL_BY_NAME.set(countingWrite.name, countingWrite);
  (ENABLED_WRITE_TOOLS as Set<string>).add(countingWrite.name);
});
afterAll(() => {
  TOOL_BY_NAME.delete(countingWrite.name);
  (ENABLED_WRITE_TOOLS as Set<string>).delete(countingWrite.name);
});

describe("HIGH-1 atomic approval gate — double-resolve runs the write exactly once", () => {
  it("two concurrent approvals of one proposal: exactly one wins, the loser is 'already resolved'", async () => {
    const out = await asTenant(CLAIMS, async (db) => {
      const [task] = await db
        .insert(schema.agentTasks)
        .values({ firmId: A, clientId: "h-a", kind: "k", tier: 3 })
        .returning();
      const [proposal] = await db
        .insert(schema.actionProposals)
        .values({ taskId: task.id, firmId: A, clientId: "h-a", toolName: countingWrite.name, args: { note: "x" }, rationale: "r" })
        .returning();

      runCount = 0;
      // Two concurrent approvals racing on the same proposal. The atomic claim
      // (UPDATE ... WHERE status='pending') decides the single winner.
      const [first, second] = await Promise.all([
        resolveProposalCore(db as never, CTX, proposal.id, "approve"),
        resolveProposalCore(db as never, CTX, proposal.id, "approve"),
      ]);
      const [after] = await db.select().from(schema.actionProposals).where(eq(schema.actionProposals.id, proposal.id));
      return { first, second, after, runCount };
    });

    const oks = [out.first, out.second].filter((r) => r.ok);
    const fails = [out.first, out.second].filter((r) => !r.ok);
    // Exactly one approval succeeded; the other returned already-resolved.
    expect(oks.length).toBe(1);
    expect(fails.length).toBe(1);
    expect(fails[0].ok).toBe(false);
    if (!fails[0].ok) expect(fails[0].error).toBe("already resolved");
    // The staged write executed EXACTLY ONCE (no TOCTOU double-execution).
    expect(out.runCount).toBe(1);
    expect(out.after.status).toBe("approved");
  });

  it("a second resolve after a completed approve returns 'already resolved' and does not re-run", async () => {
    const out = await asTenant(CLAIMS, async (db) => {
      const [task] = await db
        .insert(schema.agentTasks)
        .values({ firmId: A, clientId: "h-a", kind: "k", tier: 3 })
        .returning();
      const [proposal] = await db
        .insert(schema.actionProposals)
        .values({ taskId: task.id, firmId: A, clientId: "h-a", toolName: countingWrite.name, args: {}, rationale: "r" })
        .returning();

      runCount = 0;
      const first = await resolveProposalCore(db as never, CTX, proposal.id, "approve");
      const second = await resolveProposalCore(db as never, CTX, proposal.id, "approve");
      return { first, second, runCount };
    });

    expect(out.first.ok).toBe(true);
    expect(out.second.ok).toBe(false);
    if (!out.second.ok) expect(out.second.error).toBe("already resolved");
    expect(out.runCount).toBe(1); // ran once, never twice
  });
});

describe("MEDIUM-2 scope check fail-closed", () => {
  const scopedTool: AgentTool = {
    name: "__test_scoped_fc",
    description: "scoped",
    tier: 1,
    access: "read",
    requiredScopes: ["secret:read"],
    schema: z.object({}),
    run: async () => "ran",
    describe: () => "scoped",
  };

  it("refuses a scoped tool when the granted set is EMPTY (undefined callerScopes -> fail-closed)", async () => {
    TOOL_BY_NAME.set(scopedTool.name, scopedTool);
    try {
      // undefined is now treated as the empty granted set — the check no longer skips.
      await expect(runTool(scopedTool.name, {})).rejects.toBeInstanceOf(ToolAccessError);
      await expect(runTool(scopedTool.name, {}, [])).rejects.toBeInstanceOf(ToolAccessError);
    } finally {
      TOOL_BY_NAME.delete(scopedTool.name);
    }
  });

  it("allows a scoped tool when ALL_SCOPES is passed (v1 full-privilege posture)", async () => {
    // ALL_SCOPES is the union of every registered tool's requiredScopes — but our probe's
    // scope is synthetic, so assert ALL_SCOPES covers a real registered scope and that a
    // tool requiring a known firm scope runs with ALL_SCOPES.
    const realScopedTool: AgentTool = {
      name: "__test_real_scoped",
      description: "needs a real registered scope",
      tier: 1,
      access: "read",
      requiredScopes: ALL_SCOPES.length ? [ALL_SCOPES[0]] : [],
      schema: z.object({}),
      run: async () => "ran",
      describe: () => "real scoped",
    };
    TOOL_BY_NAME.set(realScopedTool.name, realScopedTool);
    try {
      expect(ALL_SCOPES.length).toBeGreaterThan(0);
      await expect(runTool(realScopedTool.name, {}, ALL_SCOPES)).resolves.toBe("ran");
      // …and refused when granted nothing.
      await expect(runTool(realScopedTool.name, {}, [])).rejects.toBeInstanceOf(ToolAccessError);
    } finally {
      TOOL_BY_NAME.delete(realScopedTool.name);
    }
  });
});

describe("HIGH-5 read-tool output is redacted before it would reach the model", () => {
  it("an SSN-shaped string in a tool result is masked by the redact path", () => {
    // This mirrors the runtime/runner wrap: JSON.stringify(redactValue(out)).
    const toolOut = {
      client: "Jane Doe",
      ssn: "123-45-6789",
      memo: "refund to SSN 987-65-4321",
      records: [{ account: "11112222333344445555" }],
    };
    const redactedJson = JSON.stringify(redactValue(toolOut));
    // The raw SSNs / account run must NOT appear in what would re-enter the model.
    expect(redactedJson).not.toContain("123-45-6789");
    expect(redactedJson).not.toContain("987-65-4321");
    expect(redactedJson).not.toContain("11112222333344445555");
    // …and the masks ARE present.
    expect(redactedJson).toContain("[REDACTED");
  });
});
