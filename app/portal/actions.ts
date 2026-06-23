"use server";

import { getServiceDb } from "@/lib/db/client";
import { resolveLinkByToken, startSession, setDeposit } from "@/lib/repository/intake";
import { createInvoiceCheckout } from "@/lib/payments/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petal-prod.vercel.app";
const DEPOSIT = 50; // matches the portal IntakeFlow's reservation deposit

// ⑧→⑦ The prospect's "Pay $50 deposit" step. Resolves the invite by capability token,
// ensures a session, opens a real Stripe Checkout (the ⑦ rail), and records session_created.
// Service db (prospect is unauthenticated; the held token is the authorization). No PII here
// — just a payment — so this is intentionally not behind the OTP gate that protects answers.
export async function payDepositAction(token: string): Promise<{ url: string | null } | { error: string }> {
  const db = getServiceDb();
  const link = await resolveLinkByToken(db as never, token);
  if (!link) return { error: "This invite link is not valid." };

  const session = await startSession(db as never, link.id, link.firmId);
  const checkout = await createInvoiceCheckout({
    amount: DEPOSIT,
    description: "Petal — reservation deposit",
    clientEmail: link.prospectEmail ?? undefined,
    successUrl: `${APP_URL}/portal?invite=${token}&deposit=paid`,
    cancelUrl: `${APP_URL}/portal?invite=${token}`,
    metadata: { kind: "deposit", intakeLinkId: link.id, firmId: link.firmId, sessionId: session.id },
  });
  await setDeposit(db as never, session.id, "session_created", checkout.id);
  return { url: checkout.url };
}
