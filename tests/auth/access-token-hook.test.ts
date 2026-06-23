import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb } from "../helpers/db";

const FIRM = "11111111-1111-1111-1111-111111111111";
const SUPA_USER = "33333333-3333-3333-3333-333333333333";
let db: PGlite;

async function runHook(event: unknown) {
  const r = await db.query<{ out: Record<string, unknown> }>(
    "select public.custom_access_token_hook($1::jsonb) as out",
    [JSON.stringify(event)],
  );
  return r.rows[0].out as { claims: Record<string, unknown> };
}

beforeAll(async () => {
  db = await makeTestDb();
  await db.exec(`insert into firms (id, clerk_org_id, name) values ('${FIRM}','org_a','A');`);
  await db.query("insert into clients (firm_id, supabase_user_id, name) values ($1,$2,$3)", [FIRM, SUPA_USER, "Alice"]);
});

describe("custom_access_token_hook", () => {
  it("injects firm_id, client_id, user_type=client for a known client", async () => {
    const out = await runHook({ user_id: SUPA_USER, claims: { sub: SUPA_USER } });
    expect(out.claims.firm_id).toBe(FIRM);
    expect(out.claims.user_type).toBe("client");
    expect(out.claims.role).toBe("client");
    expect(typeof out.claims.client_id).toBe("string");
    expect(out.claims.sub).toBe(SUPA_USER); // existing claims preserved
  });

  it("leaves claims untouched for an unknown user", async () => {
    const out = await runHook({ user_id: "44444444-4444-4444-4444-444444444444", claims: { sub: "x" } });
    expect(out.claims.firm_id).toBeUndefined();
    expect(out.claims.user_type).toBeUndefined();
  });
});
