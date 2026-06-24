"use server";

// Text a client via Twilio. Looks up the household's phone (RLS-scoped), sends, and audits
// (the message body is NOT recorded — only the event + Twilio sid + destination). Sending is
// an outbound action, so callers invoke this only on the preparer's explicit confirmation
// (the agent confirm-card, or a compose Send button).

import { withFirm } from "@/lib/auth/tenant";
import { peopleOf } from "@/lib/repository/practice";
import { writeAudit } from "@/lib/repository/audit";
import { sendSms } from "@/lib/sms/twilio";

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
      return { ok: true, sid: r.sid };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "send failed" };
    }
  }) as Promise<{ ok: boolean; sid?: string; error?: string }>;
}
