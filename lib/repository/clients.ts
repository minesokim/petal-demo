import { clients } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

export type ClientInput = { name?: string; email?: string; phone?: string };

// Reads/writes are firm-scoped automatically by RLS (the db handle carries the
// caller's claims). Every create is audited.
export async function listClients(db: Db) {
  return db.select().from(clients);
}

export async function createClient(db: Db, ctx: Ctx, input: ClientInput) {
  const [row] = await db.insert(clients).values({ firmId: ctx.firmId, ...input }).returning();
  await writeAudit(db, ctx, { action: "client.create", resourceType: "client", resourceId: row.id });
  return row;
}
