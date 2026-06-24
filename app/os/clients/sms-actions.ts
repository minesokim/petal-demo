"use server";

// Text a client via Twilio. Looks up the household's phone (RLS-scoped), sends, and audits
// (the message body is NOT recorded — only the event + Twilio sid + destination). Sending is
// an outbound action, so callers invoke this only on the preparer's explicit confirmation
// (the agent confirm-card, or a compose Send button).

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { peopleOf } from "@/lib/repository/practice";
import { writeAudit } from "@/lib/repository/audit";
import { recordSms, listSmsForHousehold } from "@/lib/repository/sms";
import { sendSms } from "@/lib/sms/twilio";

// The household's SMS conversation for the client-record Messages tab. RLS-scoped to the
// firm (withFirm). Returns the bare thread rows the UI maps into bubbles; createdAt is
// serialized to an ISO string so it crosses the server-action boundary cleanly.
export type ClientSmsRow = { id: string; direction: string; body: string; createdAt: string };

export async function listClientSmsAction(householdId: string): Promise<ClientSmsRow[]> {
  if (!householdId) return [];
  return withFirm(async (db) => {
    const rows = await listSmsForHousehold(db, householdId);
    return rows.map((r) => ({
      id: r.id,
      direction: r.direction,
      body: r.body,
      createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
    }));
  }) as Promise<ClientSmsRow[]>;
}

export type SendSmsInput = { householdId?: string; phone?: string; body: string };

export async function sendClientSmsAction(input: SendSmsInput): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const body = (input.body ?? "").trim();
  if (!body) return { ok: false, error: "empty message" };

  return withFirm(async (db, ctx) => {
    let phone = input.phone?.trim() || undefined;
    if (!phone && input.householdId) {
      const people = await peopleOf(db, input.householdId);
      phone = people.find((p) => p.phone)?.phone ?? undefined;
    }
    if (!phone) return { ok: false, error: "no phone on file for this client" };

    try {
      const r = await sendSms({ to: phone, body });
      await writeAudit(db, ctx, {
        action: "sms.send",
        resourceType: "household",
        resourceId: input.householdId ?? r.to,
        metadata: { sid: r.sid, to: r.to }, // never the body
      });
      // Persist the sent text so the conversation reads as a thread (same withFirm /
      // RLS scope). recordSms writes its own 'sms.record' audit row.
      await recordSms(db, ctx, {
        householdId: input.householdId,
        direction: "outbound",
        body,
        phone: r.to,
        twilioSid: r.sid,
      });
      if (input.householdId) revalidatePath(`/os/clients/${input.householdId}`);
      return { ok: true, sid: r.sid };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "send failed" };
    }
  }) as Promise<{ ok: boolean; sid?: string; error?: string }>;
}
