import { constructWebhookEvent, DEPOSIT_CENTS } from "@/lib/payments/stripe";

// ⑦ Stripe webhook. Signature-verified (never trust the body). Stripe → us only;
// no auth header, identity comes from the verified signature + event metadata.
//
// SECURITY: a verified signature proves the event came from Stripe — it does NOT prove
// the money cleared. We therefore re-check two things server-side before marking anything
// paid:
//   1. payment_status === "paid"  (a *completed* Checkout Session can still be unpaid for
//      async methods like bank debits / vouchers — completion ≠ settlement).
//   2. amount_total matches the EXPECTED amount for the kind (deposit = the $50 server
//      constant; invoice = the balance we re-derive, never metadata.invoice).
// If either check fails we ACK (200, so Stripe stops retrying a structurally-fine event)
// but mutate nothing and log only the error name.
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const body = await req.text(); // raw body required for signature verification
  let event;
  try {
    event = constructWebhookEvent(body, sig);
  } catch {
    // Bad/forged signature is fail-closed: reject so Stripe (or an attacker) gets nothing.
    return new Response("invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        id: string;
        payment_status?: string | null;
        amount_total?: number | null;
        metadata?: Record<string, string> | null;
      };
      const meta = session.metadata ?? {};

      // (1) Settlement gate — a completed session is not necessarily paid.
      if (session.payment_status !== "paid") {
        return ack(); // not settled (e.g. async pending) — do not mark paid
      }

      if (meta.kind === "deposit" && meta.sessionId) {
        // (2a) Deposit amount must equal the server constant. We do NOT trust any
        // amount from metadata; the only acceptable amount is $50 (5000 cents).
        if (session.amount_total !== DEPOSIT_CENTS) {
          return ack(); // amount mismatch — refuse to mark paid
        }
        // ⑧ portal deposit → mark the intake session paid (idempotent). Identity comes from
        // the verified-signature event metadata, not a request the client controls. setDeposit
        // is a no-op if the session is already paid (re-delivered event safe).
        const { getServiceDb } = await import("@/lib/db/client");
        const { setDeposit } = await import("@/lib/repository/intake");
        await setDeposit(getServiceDb() as never, meta.sessionId, "paid", session.id);
      } else if (meta.householdId && meta.firmId) {
        // (2b) Engagement-balance invoice. We re-derive the expected balance from the
        // authoritative invoice and compare against amount_total. metadata.invoice is a
        // display label only and is NEVER trusted as the amount. A mismatch is refused.
        // (No payments table to write yet — slice follow-up — but the validation is real,
        // so a tampered amount can never slip through to whatever marks the invoice paid.)
        const { expectedInvoiceCents } = await import("@/lib/payments/reconcile");
        const expected = await expectedInvoiceCents(meta.firmId, meta.householdId);
        if (expected === null || session.amount_total !== expected) {
          return ack(); // unknown household or amount mismatch — refuse
        }
        // Reconciliation write lands in a dedicated payments table (follow-up slice).
      }
    }
  } catch (err) {
    // A handler failure must not bubble a 500 (Stripe would retry forever). Log the
    // error name only — never the event body (it can carry PII) — and ACK.
    console.error("stripe webhook handler error", (err as Error)?.name);
    return ack();
  }

  return ack();
}

function ack() {
  return new Response("ok", { status: 200 });
}
