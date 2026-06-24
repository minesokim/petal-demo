import { eq, asc } from "drizzle-orm";
import { smsMessages } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// SMS message persistence — RLS-scoped readers/writers for the firm's text
// conversations with a household (mirrors lib/repository/chat.ts). Every query runs
// under the caller's JWT so RLS narrows to the firm; firm_id is stamped from ctx on
// writes. The body is the firm's own client-communication data — nothing here leaves
// the process.

export type RecordSmsInput = {
  householdId?: string;
  direction: "outbound" | "inbound";
  body: string;
  phone: string;
  twilioSid?: string;
  status?: string;
};

// Record one SMS (outbound or inbound). RLS scopes the INSERT to the caller's firm
// (firm_id is stamped from ctx); one audit row records it. The audit metadata carries
// the sid/direction/destination only — never the body.
export async function recordSms(db: Db, ctx: Ctx, input: RecordSmsInput): Promise<string> {
  const id = globalThis.crypto.randomUUID();
  await db.insert(smsMessages).values({
    id,
    firmId: ctx.firmId,
    householdId: input.householdId ?? null,
    direction: input.direction,
    body: input.body,
    phone: input.phone,
    twilioSid: input.twilioSid ?? null,
    status: input.status ?? null,
  });
  await writeAudit(db, ctx, {
    action: "sms.record",
    resourceType: "household",
    resourceId: input.householdId ?? input.phone,
    metadata: { direction: input.direction, sid: input.twilioSid ?? null, to: input.phone }, // never the body
  });
  return id;
}

// A household's SMS conversation oldest-first — the thread the client page renders.
// RLS-scoped to the firm.
export async function listSmsForHousehold(
  db: Db,
  householdId: string,
): Promise<{ id: string; direction: string; body: string; createdAt: Date }[]> {
  return db
    .select({
      id: smsMessages.id,
      direction: smsMessages.direction,
      body: smsMessages.body,
      createdAt: smsMessages.createdAt,
    })
    .from(smsMessages)
    .where(eq(smsMessages.householdId, householdId))
    .orderBy(asc(smsMessages.createdAt));
}
