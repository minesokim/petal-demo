"use server";

import { getServiceDb } from "@/lib/db/client";
import { resolveLinkByToken, startSession, setDeposit } from "@/lib/repository/intake";
import { createInvoiceCheckout, DEPOSIT_DOLLARS } from "@/lib/payments/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petal-prod.vercel.app";
// Server constant — the prospect cannot influence the deposit amount or which firm it
// is attributed to. firmId + session both derive from the resolved invite token, never
// from caller input. (See SECURITY FIX 3 / tests/payments/pay-actions.test.ts.)
const DEPOSIT = DEPOSIT_DOLLARS;

// ⑧→⑦ The prospect's "Pay $50 deposit" step. Resolves the invite by capability token,
// ensures a session, opens a real Stripe Checkout (the ⑦ rail), and records session_created.
// Service db (prospect is unauthenticated; the held token is the authorization). No PII here
// — just a payment — so this is intentionally not behind the OTP gate that protects answers.
export async function payDepositAction(token: string): Promise<{ url: string | null } | { error: string }> {
  const db = getServiceDb();
  const link = await resolveLinkByToken(db as never, token);
  if (!link) return { error: "This invite link is not valid." };

  const session = await startSession(db as never, link.id, link.firmId);
  // firmId, intakeLinkId and the amount all come from the SERVER-resolved invite/session —
  // the caller only supplies the capability token. No client-supplied firmId/amount is trusted.
  try {
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
  } catch (err) {
    // Never leak a Stripe stack/raw message to the prospect; log only the error name.
    console.error("payDepositAction: checkout failed", (err as Error)?.name);
    return { error: "We could not start the payment. Please try again." };
  }
}
