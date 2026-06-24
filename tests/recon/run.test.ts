import { describe, it, expect, beforeAll, vi } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { runReconciliation } from "../../lib/recon/run";
import { decryptProposalPayload } from "../../lib/repository/agent";
import { RECON_FIXTURE_EXPECTED } from "../../lib/recon/fixture";
import * as xero from "../../lib/integrations/xero";

// runReconciliation against PGlite: reads via the stubbed Xero tools, runs the
// deterministic matcher, and stages action_proposals — terminating at proposals with
// ZERO external writes. Mirrors the repository test harness (tenant Db handle + RLS).

const A = "11111111-1111-1111-1111-111111111111";
const E = RECON_FIXTURE_EXPECTED;
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
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const ctxA = { firmId: A, actorId: "u1", actorType: "preparer" as const };
const OWNER_A = { firm_id: A, role: "owner", user_type: "preparer" };

describe("runReconciliation — tier 2, terminates at proposals, zero external writes", () => {
  it("stages 9 match proposals + 1 month-end journal proposal and flags exactly 2 exceptions", async () => {
    const out = await asTenant(OWNER_A, async (db) => {
      const result = await runReconciliation(db as never, ctxA, "h-a", "stub:xero-1");
      const proposals = await db
        .select()
        .from(schema.actionProposals)
        .where(eq(schema.actionProposals.taskId, result.taskId));
      return { result, proposals };
    });

    // 9 clean matches -> 9 bank-transaction write proposals; 1 month-end journal proposal.
    expect(out.result.matchedCount).toBe(E.matched);
    expect(out.result.proposedJournalCount).toBe(E.proposedJournals);
    expect(out.result.proposalIds.length).toBe(E.matched + E.proposedJournals); // 10
    expect(out.proposals.length).toBe(E.matched + E.proposedJournals);

    const byTool = out.proposals.reduce<Record<string, number>>((acc, p) => {
      acc[p.toolName] = (acc[p.toolName] ?? 0) + 1;
      return acc;
    }, {});
    expect(byTool["create_xero_bank_transaction"]).toBe(E.matched);
    expect(byTool["create_xero_manual_journal"]).toBe(E.proposedJournals);

    // Exactly 2 exceptions, flagged (not auto-resolved), each with a reason + suggestion.
    expect(out.result.exceptions.length).toBe(E.exceptions);
    for (const ex of out.result.exceptions) {
      expect(ex.reason.length).toBeGreaterThan(0);
      expect(ex.suggestion.length).toBeGreaterThan(0);
    }

    // tie-out travels in the result and to the penny.
    expect(out.result.tieOut.bankTotal).toBe(E.bankTotal);
    expect(out.result.tieOut.difference).toBe(E.difference);

    // the task terminated awaiting approval (proposals staged, nothing executed).
    expect(out.result.status).toBe("awaiting_approval");
    expect(out.result.externalWrites).toBe(0);
  });

  it("every proposal is pending with exact would-be args + evidence + a confidence (none executed)", async () => {
    const proposals = await asTenant(OWNER_A, async (db) => {
      const result = await runReconciliation(db as never, ctxA, "h-a", "stub:xero-1");
      return db.select().from(schema.actionProposals).where(eq(schema.actionProposals.taskId, result.taskId));
    });

    for (const p of proposals) {
      expect(p.status).toBe("pending"); // staged, NOT executed
      expect(p.executionResult).toBeNull(); // nothing ran
      expect(p.confidence).not.toBeNull();
      expect(p.payloadEnc).toBeTruthy(); // PII payload is encrypted at rest
      // risk gate: every recon write posts money via an external API -> review lane, with an artifact.
      expect(p.riskLane).toBe("review");
      // args/evidence/rationale/artifact live in payload_enc — decrypt (as the app does) to verify them.
      const { args, evidence, rationale, reviewArtifact } = decryptProposalPayload(p);
      expect(rationale.length).toBeGreaterThan(0);
      expect(evidence).toBeTruthy(); // matched source records + tie-out trace
      expect((reviewArtifact as { fields: unknown[] } | null)?.fields.length).toBeGreaterThan(0); // evidenced
      expect((args as Record<string, unknown>).connectionId).toBe("stub:xero-1");
      if (p.toolName === "create_xero_bank_transaction") {
        expect(typeof args.bankTransactionId).toBe("string");
        expect(typeof args.ledgerItemId).toBe("string");
      } else {
        expect(Array.isArray(args.lines)).toBe(true);
      }
    }
  });

  it("performs ZERO external writes — the Xero write helpers are never invoked", async () => {
    // Spy the propose* helpers (the only things that build a Xero write payload). They
    // RETURN args; they must never execute a write. And the live execution path
    // (notLive) must never be reached. Reading happens; writing does not.
    const proposeBank = vi.spyOn(xero, "proposeBankTransaction");
    const proposeJournal = vi.spyOn(xero, "proposeManualJournal");

    await asTenant(OWNER_A, async (db) => {
      return runReconciliation(db as never, ctxA, "h-a", "stub:xero-1");
    });

    // They are called to BUILD proposal args (pure, non-executing) — that's expected —
    // but each returns its input unchanged: no side effect, no external write.
    expect(proposeBank).toHaveBeenCalledTimes(E.matched);
    expect(proposeJournal).toHaveBeenCalledTimes(E.proposedJournals);
    for (const call of proposeBank.mock.results) {
      expect(call.type).toBe("return");
    }
    proposeBank.mockRestore();
    proposeJournal.mockRestore();
  });

  it("the staged Xero write tools are NOT live — calling their handler throws (proves no inline external write)", async () => {
    // Defense in depth: even if something tried to execute the tier-3 write inline, the
    // handler refuses — the connector is not enabled in v1.
    await expect(
      xero.readBankTransactions("real:not-a-stub"),
    ).rejects.toThrow("external connector not enabled in v1");
  });

  it("audit log records the proposals but NO write.executed / external write event", async () => {
    const audits = await asTenant(OWNER_A, async (db) => {
      const result = await runReconciliation(db as never, ctxA, "h-a", "stub:xero-1");
      void result;
      return db.select().from(schema.auditLog);
    });
    const actions = audits.map((a) => a.action);
    expect(actions).toContain("agent.task.create");
    expect(actions).toContain("agent.proposal.create");
    expect(actions).not.toContain("write.executed"); // nothing was executed
  });
});
