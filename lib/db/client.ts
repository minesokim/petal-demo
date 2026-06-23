import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import type { Db } from "../repository/types";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Service connection — bypasses RLS. Use ONLY for trusted server jobs (Clerk
// webhook sync, migrations). Everything user-facing goes through withTenant.
export function getServiceDb() {
  if (!_db) {
    const cs = process.env.DATABASE_URL;
    if (!cs) throw new Error("DATABASE_URL is not set");
    _db = drizzle(postgres(cs, { prepare: false }), { schema });
  }
  return _db;
}

export type TenantClaims = { firm_id: string; role: string; user_type: string; client_id?: string };

// Run fn under a tenant: set the JWT claims + SET LOCAL ROLE authenticated so RLS
// scopes every query (identical to the PGlite test harness). Always in a txn.
export async function withTenant<T>(claims: TenantClaims, fn: (tx: Db) => Promise<T>): Promise<T> {
  return getServiceDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`);
    await tx.execute(sql`set local role authenticated`);
    return fn(tx as unknown as Db);
  });
}
