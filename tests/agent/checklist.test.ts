import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { createTask } from "../../lib/repository/agent";
import {
  runChecklist,
  CHECKLIST_1040_PREFILE,
  type ChecklistSubAgent,
  type ItemVerdict,
} from "../../lib/checklists";

const A = "11111111-1111-1111-1111-111111111111";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A');
    insert into households (id, firm_id, name, kind, service_tier, since)
      values ('hA','${A}','Vazquez','individual','Premium',2019);
  `);
});

const claims: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
async function asTenant<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("rollback");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const ctx = { firmId: A, actorId: "u1", actorType: "preparer" as const };

// Deterministic sub-agent: verdict keyed off the item id so we control pass/fail/flag, and a
// citation on the grounded items to prove citations flow through to the report. Also records
// concurrency to prove the items actually ran in parallel (the chunked-parallel pattern).
function makeStub(): { sub: ChecklistSubAgent; peakConcurrency: () => number } {
  let active = 0;
  let peak = 0;
  const verdictFor = (id: string): ItemVerdict["status"] =>
    id === "eitc_due_diligence" ? "fail" : id === "saltt_cap" ? "flag" : "pass";
  const sub: ChecklistSubAgent = async ({ item }) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 5)); // overlap window
    active -= 1;
    return {
      item: item.id,
      status: verdictFor(item.id),
      evidence: `checked ${item.id}`,
      citations: item.kind === "tax_assertion" ? [{ authority: "IRC", cite: "§63", sourceUrl: "https://x" }] : undefined,
    };
  };
  return { sub, peakConcurrency: () => peak };
}

describe("runChecklist — parallel verdicts aggregated into a report artifact", () => {
  it("aggregates pass/fail/flag counts, persists a report artifact, and runs items in parallel", async () => {
    const stub = makeStub();
    const out = await asTenant(async (db) => {
      const task = await createTask(db as never, ctx, { clientId: "hA", kind: "checklist:test", tier: 2 });
      const { report, artifactId } = await runChecklist(db as never, ctx, "hA", CHECKLIST_1040_PREFILE, {
        runSubAgent: stub.sub,
        taskId: task.id,
        concurrency: 4,
      });
      const artifactRow = (await db.select().from(schema.artifacts).where(eq(schema.artifacts.id, artifactId)))[0];
      const audits = (await db.select().from(schema.auditLog)).map((a) => a.action);
      return { report, artifactRow, peak: stub.peakConcurrency(), audits };
    });

    const n = CHECKLIST_1040_PREFILE.items.length; // 6
    expect(out.report.total).toBe(n);
    // verdictFor: eitc -> fail, saltt -> flag, the other 4 -> pass
    expect(out.report.fail).toBe(1);
    expect(out.report.flag).toBe(1);
    expect(out.report.pass).toBe(n - 2);

    // the artifact is a durable "report" carrying the full report content
    expect(out.artifactRow.type).toBe("report");
    const content = out.artifactRow.content as { verdicts: ItemVerdict[]; checklistId: string };
    expect(content.checklistId).toBe(CHECKLIST_1040_PREFILE.id);
    expect(content.verdicts).toHaveLength(n);
    // grounded items carry their citations through to the report
    const eitc = content.verdicts.find((v) => v.item === "eitc_due_diligence");
    expect(eitc?.citations?.[0]?.cite).toBe("§63");

    // items overlapped — true parallel fan-out, not a serial loop
    expect(out.peak).toBeGreaterThan(1);
    // INV-7: the artifact creation was audited
    expect(out.audits).toContain("agent.artifact.create");
  });

  it("bounded concurrency: peak never exceeds the configured limit", async () => {
    const stub = makeStub();
    const peak = await asTenant(async (db) => {
      const task = await createTask(db as never, ctx, { clientId: "hA", kind: "checklist:test", tier: 2 });
      await runChecklist(db as never, ctx, "hA", CHECKLIST_1040_PREFILE, {
        runSubAgent: stub.sub,
        taskId: task.id,
        concurrency: 2,
      });
      return stub.peakConcurrency();
    });
    expect(peak).toBeLessThanOrEqual(2);
  });
});
