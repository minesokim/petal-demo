import { auditLog } from "../db/schema";
import type { Db, Ctx } from "./types";

// Append-only audit. metadata must never carry crown-jewel PII (SSN/bank) — keep
// it to ids and non-sensitive descriptors.
export type AuditEntry = {
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAudit(db: Db, ctx: Ctx, entry: AuditEntry): Promise<void> {
  await db.insert(auditLog).values({
    firmId: ctx.firmId,
    actorType: ctx.actorType,
    actorId: ctx.actorId,
    action: entry.action,
    resourceType: entry.resourceType ?? null,
    resourceId: entry.resourceId ?? null,
    metadata: entry.metadata ?? {},
  });
}
