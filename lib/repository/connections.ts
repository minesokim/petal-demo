import { and, eq } from "drizzle-orm";
import { connections } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// ⑤ Connectors — firm-scoped connection state (RLS). Tokens stay in Composio.

export async function listConnections(db: Db) {
  return db
    .select({
      id: connections.id,
      toolkit: connections.toolkit,
      status: connections.status,
      accountLabel: connections.accountLabel,
    })
    .from(connections);
}

// Pending connections with their Composio id — for status polling/sync.
export async function pendingConnections(db: Db) {
  return db
    .select({
      id: connections.id,
      toolkit: connections.toolkit,
      composioConnectionId: connections.composioConnectionId,
    })
    .from(connections)
    .where(eq(connections.status, "pending"));
}

export type ConnectionInput = {
  toolkit: string;
  status: string; // pending | connected | error
  composioConnectionId?: string;
  accountLabel?: string;
};

export async function upsertConnection(db: Db, ctx: Ctx, input: ConnectionInput) {
  const [row] = await db
    .insert(connections)
    .values({ firmId: ctx.firmId, ...input })
    .onConflictDoUpdate({
      target: [connections.firmId, connections.toolkit],
      set: {
        status: input.status,
        composioConnectionId: input.composioConnectionId,
        accountLabel: input.accountLabel,
        updatedAt: new Date(),
      },
    })
    .returning();
  await writeAudit(db, ctx, {
    action: "connection.upsert",
    resourceType: "connection",
    resourceId: row.id,
    metadata: { toolkit: input.toolkit, status: input.status },
  });
  return row;
}

export async function removeConnection(db: Db, ctx: Ctx, toolkit: string) {
  await db.delete(connections).where(and(eq(connections.firmId, ctx.firmId), eq(connections.toolkit, toolkit)));
  await writeAudit(db, ctx, { action: "connection.remove", resourceType: "connection", resourceId: toolkit });
}
