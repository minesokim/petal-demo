import { eq, asc } from "drizzle-orm";
import { smsMessages, households } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";
import type { Thread, Message } from "../fixtures/firm";

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
  // Idempotent on (firm_id, twilio_sid) (0030): a replayed inbound webhook or a Twilio
  // retry carries the same MessageSid, so the duplicate INSERT is ignored. On conflict
  // `returning` yields no row — we skip the second audit write and report the dedup, so a
  // replay never double-records the message OR its audit trail.
  const inserted = await db
    .insert(smsMessages)
    .values({
      id,
      firmId: ctx.firmId,
      householdId: input.householdId ?? null,
      direction: input.direction,
      body: input.body,
      phone: input.phone,
      twilioSid: input.twilioSid ?? null,
      status: input.status ?? null,
    })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) return id; // duplicate sid — already recorded; no second audit row.
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

// The firm is the preparer; outbound texts read as the firm's own bubbles. The fixture
// SMS threads (e.g. DeShawn's "W-2 reminder") author the firm side as the owner's name,
// so real threads match that voice rather than inventing a per-message sender.
const FIRM_AUTHOR = "Antonio Vazquez";

// A row, message-time as the fixtures render it ("Jun 22, 4:02 PM").
function msgTime(d: Date): string {
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
// The conversation-list time the fixtures render ("Jun 23").
function rowTime(d: Date): string {
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

// Every firm SMS, grouped into one Thread per client (by household, or by phone when the
// number isn't linked to a household yet), newest conversation first. RLS scopes the
// SELECT to the caller's firm, so this only ever sees the firm's own texts. The output is
// the EXACT Inbox Thread shape (channel:"sms"; messages from "firm"|"client" per
// direction; text=body) — all shape-adaptation happens here, never in a component.
export async function listFirmSmsThreads(db: Db, _ctx: Ctx): Promise<Thread[]> {
  // RLS-scoped: all of the firm's SMS, oldest-first so each thread builds in order.
  const rows = await db
    .select({
      id: smsMessages.id,
      householdId: smsMessages.householdId,
      direction: smsMessages.direction,
      body: smsMessages.body,
      phone: smsMessages.phone,
      createdAt: smsMessages.createdAt,
    })
    .from(smsMessages)
    .orderBy(asc(smsMessages.createdAt));

  if (rows.length === 0) return [];

  // Resolve client names for the households that actually have texts (RLS-scoped).
  const hh = await db.select({ id: households.id, name: households.name }).from(households);
  const nameOf = new Map(hh.map((h) => [h.id, h.name]));

  // Group by household_id; texts with no household fall back to a per-phone bucket so an
  // unlinked number still reads as one conversation.
  type Group = { householdId: string | null; phone: string; key: string; rows: typeof rows };
  const groups = new Map<string, Group>();
  for (const r of rows) {
    const key = r.householdId ? `hh:${r.householdId}` : `ph:${r.phone}`;
    let g = groups.get(key);
    if (!g) {
      g = { householdId: r.householdId, phone: r.phone, key, rows: [] };
      groups.set(key, g);
    }
    g.rows.push(r);
  }

  const built = [...groups.values()].map((g): { lastAt: number; thread: Thread } => {
    const last = g.rows[g.rows.length - 1];
    const lastDate = last.createdAt instanceof Date ? last.createdAt : new Date(last.createdAt);
    const clientName = (g.householdId && nameOf.get(g.householdId)) || g.phone;
    // Waiting on the firm when the newest message is the client's (inbound) and unanswered.
    const waiting = last.direction === "inbound";
    const messages: Message[] = g.rows.map((r): Message => {
      const d = r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt);
      return {
        from: r.direction === "outbound" ? "firm" : "client",
        author: r.direction === "outbound" ? FIRM_AUTHOR : clientName,
        text: r.body,
        time: msgTime(d),
      };
    });
    const thread: Thread = {
      // Stable per-client thread id (not the message id) so selection survives new texts.
      id: g.householdId ? `sms-${g.householdId}` : `sms-ph-${g.phone}`,
      householdId: g.householdId ?? "",
      clientName,
      channel: "sms",
      subject: "Text messages",
      preview: last.body,
      time: rowTime(lastDate),
      unread: waiting,
      status: "open",
      ...(waiting ? { waitingOnFirmSince: rowTime(lastDate) } : {}),
      messages,
    };
    return { lastAt: lastDate.getTime(), thread };
  });

  // Newest conversation first (matches the fixtures' most-recent-on-top ordering).
  return built.sort((a, b) => b.lastAt - a.lastAt).map((b) => b.thread);
}
