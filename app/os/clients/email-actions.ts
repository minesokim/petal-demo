"use server";

// Email a client via the firm's connected Gmail (through Composio — the same executeTool path
// the live Calendar uses). Looks up the household's email (RLS-scoped), sends via
// GMAIL_SEND_EMAIL, and audits the event (subject/body are NOT recorded — only the event +
// recipient). Sending is an outbound action, so the agent stages it and the preparer confirms
// (the confirm-card), exactly like send_sms. Requires the firm to have connected Gmail on the
// Connections page; if not, executeTool returns successful:false and we surface a clear hint.

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { peopleOf } from "@/lib/repository/practice";
import { writeAudit } from "@/lib/repository/audit";
import { executeTool } from "@/lib/connectors/composio";

// Composio's verified Gmail send tool slug + arg names (mirrors calendar.ts pinning
// GOOGLECALENDAR_EVENTS_LIST). recipient_email / subject / body are the GMAIL_SEND_EMAIL inputs.
const GMAIL_SEND = "GMAIL_SEND_EMAIL";

export type SendEmailInput = { householdId?: string; to?: string; subject: string; body: string };

export async function sendClientEmailAction(
  input: SendEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  const subject = (input.subject ?? "").trim();
  const body = (input.body ?? "").trim();
  if (!subject || !body) return { ok: false, error: "empty subject or body" };

  return withFirm(async (db, ctx) => {
    let to = input.to?.trim() || undefined;
    if (!to && input.householdId) {
      const people = await peopleOf(db, input.householdId);
      to = people.find((p) => p.email)?.email ?? undefined;
    }
    if (!to) return { ok: false, error: "no email on file for this client" };

    try {
      const res = await executeTool(GMAIL_SEND, `firm_${ctx.firmId}`, {
        recipient_email: to,
        subject,
        body,
      });
      if (!res.successful) {
        // Most common cause: Gmail isn't connected for this firm yet.
        return {
          ok: false,
          error: res.error || "Gmail isn't connected — connect it on the Connections page, then retry.",
        };
      }
      await writeAudit(db, ctx, {
        action: "email.send",
        resourceType: "household",
        resourceId: input.householdId ?? to,
        metadata: { to }, // never the subject/body
      });
      if (input.householdId) revalidatePath(`/os/clients/${input.householdId}`);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "email send failed" };
    }
  }) as Promise<{ ok: boolean; error?: string }>;
}
