import { describe, it, expect, beforeAll } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { makeTestDb, type Claims } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { listFirmMemories, addMemory, removeMemory, togglePinMemory, confirmMemory } from "../../lib/repository/memory";

// Two firms to prove RLS isolation. Client memory text is PII — assert it is encrypted at rest.
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  process.env.DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || Buffer.alloc(32, 7).toString("base64"); // 32-byte test KEK
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
    await pg.exec("commit");
    return r;
  } catch (e) { try { await pg.exec("rollback"); } catch {} throw e; }
}

const claimsA: Claims = { firm_id: A, role: "owner", user_type: "preparer" };
const claimsB: Claims = { firm_id: B, role: "owner", user_type: "preparer" };
const ctxA = { firmId: A, actorId: "u1", actorType: "preparer" as const };
const ctxB = { firmId: B, actorId: "u2", actorType: "preparer" as const };

describe("client memory (encrypted, RLS-scoped)", () => {
  it("stores the text ENCRYPTED at rest and returns it decrypted to the firm", async () => {
    const secret = "Took an S-corp election in 2022; reasonable-comp set at $90k";
    await asTenant(claimsA, (db) => addMemory(db as never, ctxA, { householdId: "hA", text: secret, source: "From the 2023 return", kind: "history" }));

    // The raw column must NOT contain the plaintext (envelope-encrypted).
    const raw = await pg.query<{ text_enc: string }>("select text_enc from client_memory");
    expect(raw.rows[0].text_enc).not.toContain("S-corp");
    expect(raw.rows[0].text_enc).not.toContain("90k");

    // The repository decrypts it back for the firm.
    const rows = await asTenant(claimsA, (db) => listFirmMemories(db as never));
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe(secret);
    expect(rows[0].kind).toBe("history");
    expect(rows[0].householdId).toBe("hA");
  });

  it("pin, confirm, and remove behave; suggestions confirm to active", async () => {
    const id = await asTenant(claimsA, (db) => addMemory(db as never, ctxA, { householdId: "hA", text: "new baby — CTC review", source: "Ask Petal", kind: "flag", status: "suggested" }));
    await asTenant(claimsA, (db) => togglePinMemory(db as never, ctxA, id));
    await asTenant(claimsA, (db) => confirmMemory(db as never, ctxA, id));
    const rows = await asTenant(claimsA, (db) => listFirmMemories(db as never));
    const m = rows.find((x) => x.id === id)!;
    expect(m.pinned).toBe(true);
    expect(m.status).toBe("confirmed");
    await asTenant(claimsA, (db) => removeMemory(db as never, ctxA, id));
    const after = await asTenant(claimsA, (db) => listFirmMemories(db as never));
    expect(after.find((x) => x.id === id)).toBeUndefined();
  });

  it("is RLS-isolated: firm B never sees firm A's memories", async () => {
    const rowsB = await asTenant(claimsB, (db) => listFirmMemories(db as never));
    expect(rowsB.every((r) => r.householdId !== "hA")).toBe(true);
    // and B writing to its own household stays separate
    await asTenant(claimsB, (db) => addMemory(db as never, ctxB, { householdId: "hB", text: "B firm fact", source: "x", kind: "fact" }));
    const rowsB2 = await asTenant(claimsB, (db) => listFirmMemories(db as never));
    expect(rowsB2.some((r) => r.text === "B firm fact")).toBe(true);
    const rowsA = await asTenant(claimsA, (db) => listFirmMemories(db as never));
    expect(rowsA.some((r) => r.text === "B firm fact")).toBe(false);
  });
});
