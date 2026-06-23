"use server";

import { randomBytes } from "crypto";
import { withFirm } from "@/lib/auth/tenant";
import { createIntakeLink } from "@/lib/repository/intake";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petal-prod.vercel.app";

// ⑧ Preparer action: mint an intake invite for a prospect. The token is a high-entropy
// capability embedded in the portal URL; the prospect later proves their email via OTP
// before any intake data is written. RLS-scoped + audited via createIntakeLink/withFirm.
export async function createIntakeLinkAction(
  input: { prospectName?: string; prospectEmail?: string },
): Promise<{ url: string; token: string } | null> {
  const token = randomBytes(24).toString("base64url");
  return withFirm(async (db, ctx) => {
    await createIntakeLink(db, ctx, { token, prospectName: input.prospectName, prospectEmail: input.prospectEmail });
    return { url: `${APP_URL}/portal?invite=${token}`, token };
  });
}
