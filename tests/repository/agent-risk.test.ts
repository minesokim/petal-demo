import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { createTask, createProposal, listProposals } from "../../lib/repository/agent";
import { classifyRisk } from "../../lib/agent/risk";
import { artifactGeneric } from "../../lib/agent/review-artifact";

// The risk-gate columns persist on action_proposals, read back firm-scoped, and never leak across
// firms (RLS regression guard on the added columns). Commit-style harness so writes from firm A's
// block survive into firm B's block and vice versa.

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  process.env.DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || Buffer.alloc(32, 7).toString("base64"); // 32-byte test KEK
  pg = await makeTestDb();
  await pg.exec(`insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');`);
});

async function asTenant<T>(claims: Claims, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("commit");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const claimsA: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
const claimsB: Claims = { firm_id: B, role: "owner", user_type: "preparer" };
const ctxA = { firmId: A, actorId: "alice", actorType: "preparer" as const, role: "preparer" as const };
const ctxB = { firmId: B, actorId: "bob", actorType: "preparer" as const, role: "owner" as const };

const oltSubmit = { name: "olt_submit_return", tier: 3 as const, access: "write" as const, connector: "browser" as const, stakes: "high" as const, irreversibleSubmit: true };

describe("action_proposals risk gate (persisted + firm-scoped)", () => {
  it("stores lane/level/factors/humanMustSubmit/artifact/proposer and reads them back", async () => {
    const risk = classifyRisk(oltSubmit, {});
    const artifact = artifactGeneric("olt_submit_return", "E-file the 2024 return", { clientId: "h-chen", taxYear: 2024 });
    await asTenant(claimsA, async (db) => {
      const task = await createTask(db as never, ctxA, { kind: "agent:test", tier: 3 });
      await createProposal(db as never, ctxA, {
        taskId: task.id,
        toolName: "olt_submit_return",
        rationale: "Return is ready to e-file",
        risk,
        reviewArtifact: artifact,
      });
    });

    const rows = await asTenant(claimsA, (db) => listProposals(db as never));
    const p = rows.find((r) => r.toolName === "olt_submit_return")!;
    expect(p.riskLane).toBe("review");
    expect(p.riskLevel).toBe("high");
    expect(p.humanMustSubmit).toBe(true);
    expect(Array.isArray(p.riskFactors)).toBe(true);
    expect((p.reviewArtifact as { summary: string }).summary).toBe("E-file the 2024 return");
  });

  it("stores the payload ENCRYPTED at rest (plaintext columns hold only placeholders)", async () => {
    const secret = "Send SMS to 555-0142: your refund of $4,210 is ready";
    await asTenant(claimsA, async (db) => {
      const task = await createTask(db as never, ctxA, { kind: "agent:test", tier: 3 });
      await createProposal(db as never, ctxA, { taskId: task.id, toolName: "send_sms", args: { to: "555-0142", body: secret }, rationale: secret, risk: classifyRisk({ name: "send_sms", tier: 3, access: "write" }, {}) });
    });
    // Raw columns (read as superuser, bypassing RLS) must NOT contain the plaintext.
    const raw = await pg.query<{ payload_enc: string; args: unknown; rationale: string }>(
      "select payload_enc, args, rationale from action_proposals where tool_name = 'send_sms'",
    );
    const row = raw.rows[0];
    expect(row.payload_enc).toBeTruthy();
    expect(row.payload_enc).not.toContain("555-0142");
    expect(row.payload_enc).not.toContain("4,210");
    expect(JSON.stringify(row.args)).toBe("{}"); // plaintext args column emptied
    expect(row.rationale).not.toContain("555-0142"); // placeholder, not the real label
    // …but the repository decrypts it back for the firm.
    const rows = await asTenant(claimsA, (db) => listProposals(db as never));
    const p = rows.find((r) => r.toolName === "send_sms")!;
    expect((p.args as { body: string }).body).toBe(secret);
    expect(p.rationale).toBe(secret);
  });

  it("never returns another firm's proposals (RLS holds on the new columns)", async () => {
    await asTenant(claimsB, async (db) => {
      const task = await createTask(db as never, ctxB, { kind: "agent:test", tier: 3 });
      await createProposal(db as never, ctxB, { taskId: task.id, toolName: "create_task", rationale: "B-only", risk: classifyRisk({ name: "create_task", tier: 3, access: "write", connector: "internal", stakes: "low", reversible: true }, {}) });
    });
    const bRows = await asTenant(claimsB, (db) => listProposals(db as never));
    expect(bRows.every((r) => r.rationale !== "Return is ready to e-file")).toBe(true);
    const aRows = await asTenant(claimsA, (db) => listProposals(db as never));
    expect(aRows.every((r) => r.rationale !== "B-only")).toBe(true);
  });
});
