import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Spin an in-process Postgres (PGlite — real PG semantics, no Docker) and apply
// every migration in order. Used by RLS / repository tests.
export async function makeTestDb(): Promise<PGlite> {
  // A 32-byte test KEK so repository writers that envelope-encrypt PII (client memory, the
  // action_proposals payload, …) work under PGlite without a real key in the environment.
  process.env.DATA_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");
  const db = new PGlite();
  const dir = path.join(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const sql = readFileSync(path.join(dir, f), "utf8");
    // Skip Supabase-managed `storage` schema migrations — PGlite has no storage schema
    // (Storage is verified against the cloud, not in these app-RLS tests).
    if (/\bstorage\.(buckets|objects)\b/.test(sql)) continue;
    // Skip the pgvector-dependent authority-graph migrations — PGlite ships no `vector` extension or
    // HNSW. The authority graph is PUBLIC reference data (no firm_id, no tenant RLS to exercise here),
    // verified against the cloud Supabase, not these app-RLS tests (same rationale as storage above).
    if (/\bcreate extension if not exists vector\b/i.test(sql) || /\bauthority_(nodes|versions|edges|embedding)\b/i.test(sql)) continue;
    await db.exec(sql);
  }
  return db;
}

export type Claims = { firm_id?: string; role?: string; user_type?: string; client_id?: string; household_id?: string };

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
