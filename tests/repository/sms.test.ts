import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { recordSms, listFirmSmsThreads } from "../../lib/repository/sms";

// Two firms so we can prove RLS isolation: firm B must never see firm A's texts even
// though both have a household with the same conversation shape.
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${A}','org_a','A'),('${B}','org_b','B');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('hA','${A}','Marcus Chen','individual','Premium',2019),
      ('hB','${B}','Other Firm Client','individual','Standard',2020);
  `);
});

async function asTenant<T>(claims: Claims, fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  await pg.exec("begin");
  try {
    await pg.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await pg.exec("set local role authenticated");
    const r = await fn(drizzle(pg, { schema }));
    await pg.exec("commit"); // commit so later cases see the inserted texts
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const claimsA: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
const claimsB: Claims = { firm_id: B, role: "owner", user_type: "preparer" };
const ctxA = { firmId: A, actorId: "u1", actorType: "preparer" as const };
const ctxB = { firmId: B, actorId: "u2", actorType: "preparer" as const };

describe("listFirmSmsThreads (RLS-scoped, Inbox shape)", () => {
  it("groups a household's outbound+inbound texts into one ordered thread", async () => {
    // Firm A: the firm texts Marcus (outbound), Marcus replies (inbound). Recorded in order.
    await asTenant(claimsA, async (db) => {
      await recordSms(db as never, ctxA, {
        householdId: "hA", direction: "outbound", body: "Hi Marcus, need your W-2.", phone: "+19515550190",
      });
      await recordSms(db as never, ctxA, {
        householdId: "hA", direction: "inbound", body: "Sent it over, thanks!", phone: "+19515550190",
      });
    });
    // Firm B has its own unrelated text so the firm-scoped read has something to exclude.
    await asTenant(claimsB, async (db) => {
      await recordSms(db as never, ctxB, {
        householdId: "hB", direction: "inbound", body: "B firm message", phone: "+13105550000",
      });
    });

    const threads = await asTenant(claimsA, (db) => listFirmSmsThreads(db as never, ctxA));

    // Exactly one thread for firm A (one client), in the exact Inbox Thread shape.
    expect(threads).toHaveLength(1);
    const t = threads[0];
    expect(t.channel).toBe("sms");
    expect(t.householdId).toBe("hA");
    expect(t.clientName).toBe("Marcus Chen"); // resolved via households
    expect(t.subject).toBe("Text messages");
    expect(t.status).toBe("open");
    expect(t.preview).toBe("Sent it over, thanks!"); // newest body

    // Messages in chronological order with correct from/author mapping.
    expect(t.messages.map((m) => m.from)).toEqual(["firm", "client"]);
    expect(t.messages.map((m) => m.text)).toEqual(["Hi Marcus, need your W-2.", "Sent it over, thanks!"]);
    expect(t.messages[0].author).toBe("Antonio Vazquez"); // firm voice
    expect(t.messages[1].author).toBe("Marcus Chen");     // client name

    // Newest message is inbound => waiting on the firm.
    expect(t.unread).toBe(true);
    expect(t.waitingOnFirmSince).toBeTruthy();
  });

  it("is RLS-isolated: firm B sees only its own thread, never firm A's", async () => {
    const threadsB = await asTenant(claimsB, (db) => listFirmSmsThreads(db as never, ctxB));
    expect(threadsB).toHaveLength(1);
    expect(threadsB[0].clientName).toBe("Other Firm Client");
    expect(threadsB[0].messages.map((m) => m.text)).toEqual(["B firm message"]);
    // Marcus's texts (firm A) never leak in.
    const allText = threadsB.flatMap((t) => t.messages.map((m) => m.text));
    expect(allText).not.toContain("Hi Marcus, need your W-2.");
  });
});
