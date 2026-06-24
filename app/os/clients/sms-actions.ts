"use server";

// Text a client via Twilio. Looks up the household's phone (RLS-scoped), sends, and audits
// (the message body is NOT recorded — only the event + Twilio sid + destination). Sending is
// an outbound action, so callers invoke this only on the preparer's explicit confirmation
// (the agent confirm-card, or a compose Send button).

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { peopleOf } from "@/lib/repository/practice";
import { writeAudit } from "@/lib/repository/audit";
import { recordSms, listSmsForHousehold, type SmsMediaInput } from "@/lib/repository/sms";
import { sendSms } from "@/lib/sms/twilio";
import { uploadFirmFile, signedUrlForFirmFile } from "@/lib/storage/firm-files";
import type { Attachment } from "@/lib/fixtures/firm";

// The household's SMS conversation for the client-record Messages tab. RLS-scoped to the
// firm (withFirm). Returns the bare thread rows the UI maps into bubbles; createdAt is
// serialized to an ISO string so it crosses the server-action boundary cleanly. attachments
// carry already-signed view URLs (minted in the repository).
export type ClientSmsRow = { id: string; direction: string; body: string; createdAt: string; attachments: Attachment[] };

export async function listClientSmsAction(householdId: string): Promise<ClientSmsRow[]> {
  if (!householdId) return [];
  const rows = await withFirm(async (db) => {
    const found = await listSmsForHousehold(db, householdId);
    return found.map((r) => ({
      id: r.id,
      direction: r.direction,
      body: r.body,
      createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
      attachments: r.attachments,
    }));
  });
  // withFirm yields null when there is no firm context (unauthenticated) — never hand the UI a
  // null; return an empty thread so the record renders honestly instead of crashing on .length.
  return rows ?? [];
}

// Upload one file from the composer to the firm-files bucket, returning a ref the caller holds
// and passes to sendClientSmsAction. RLS/tenant: uploadFirmFile keys the object under ctx.firmId.
export type UploadedAttachment = { storagePath: string; contentType: string; name: string; sizeBytes: number };

export async function uploadSmsAttachmentAction(
  form: FormData,
): Promise<{ ok: boolean; attachment?: UploadedAttachment; error?: string }> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "no file" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "file too large (5MB max)" };
  return withFirm(async (_db, ctx) => {
    try {
      const up = await uploadFirmFile(ctx.firmId, file);
      return {
        ok: true,
        attachment: { storagePath: up.storagePath, contentType: up.mimeType, name: file.name, sizeBytes: up.sizeBytes },
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message.slice(0, 160) : "upload failed" };
    }
  }) as Promise<{ ok: boolean; attachment?: UploadedAttachment; error?: string }>;
}

export type SendSmsInput = { householdId?: string; phone?: string; body: string; attachments?: SmsMediaInput[] };

export async function sendClientSmsAction(input: SendSmsInput): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const body = (input.body ?? "").trim();
  const attachments = input.attachments ?? [];
  if (!body && attachments.length === 0) return { ok: false, error: "empty message" };

  return withFirm(async (db, ctx) => {
    let phone = input.phone?.trim() || undefined;
    if (!phone && input.householdId) {
      const people = await peopleOf(db, input.householdId);
      phone = people.find((p) => p.phone)?.phone ?? undefined;
    }
    if (!phone) return { ok: false, error: "no phone on file for this client" };

    try {
      // Mint signed URLs Twilio can fetch for the MMS (1h window; Twilio fetches at send time).
      const mediaUrls = await Promise.all(
        attachments.map((a) => signedUrlForFirmFile(a.storagePath, ctx.firmId, 3600)),
      );
      const r = await sendSms({ to: phone, body, mediaUrls });
      await writeAudit(db, ctx, {
        action: "sms.send",
        resourceType: "household",
        resourceId: input.householdId ?? r.to,
        metadata: { sid: r.sid, to: r.to, media: attachments.length }, // never the body
      });
      // Persist the sent text + its media so the conversation reads as a thread (same withFirm /
      // RLS scope). recordSms writes its own 'sms.record' audit row.
      await recordSms(db, ctx, {
        householdId: input.householdId,
        direction: "outbound",
        body,
        phone: r.to,
        twilioSid: r.sid,
        media: attachments,
      });
      if (input.householdId) revalidatePath(`/os/clients/${input.householdId}`);
      return { ok: true, sid: r.sid };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "send failed" };
    }
  }) as Promise<{ ok: boolean; sid?: string; error?: string }>;
}
