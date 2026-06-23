import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Spin an in-process Postgres (PGlite — real PG semantics, no Docker) and apply
// every migration in order. Used by RLS / repository tests.
export async function makeTestDb(): Promise<PGlite> {
  const db = new PGlite();
  const dir = path.join(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    await db.exec(readFileSync(path.join(dir, f), "utf8"));
  }
  return db;
}

export type Claims = { firm_id?: string; role?: string; user_type?: string; client_id?: string };

// Run fn as a tenant: set the JWT claims + SET ROLE authenticated so RLS applies
// (the session is otherwise superuser, which bypasses RLS). Rolls back after, so
// reads never mutate; a write that the policy rejects throws out of fn.
export async function asTenant<T>(db: PGlite, claims: Claims, fn: (db: PGlite) => Promise<T>): Promise<T> {
  await db.exec("begin");
  try {
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    await db.exec("set local role authenticated");
    const result = await fn(db);
    await db.exec("rollback");
    return result;
  } catch (e) {
    try { await db.exec("rollback"); } catch { /* already aborted */ }
    throw e;
  }
}
