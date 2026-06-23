import { constructWebhookEvent } from "@/lib/payments/stripe";

// ⑦ Stripe webhook. Signature-verified (never trust the body). Stripe → us only;
// no auth header, identity comes from the verified signature + event metadata.
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const body = await req.text(); // raw body required for signature verification
  let event;
  try {
    event = constructWebhookEvent(body, sig);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { id: string; metadata?: Record<string, string> | null };
      const meta = session.metadata ?? {};
      // ⑧ portal deposit → mark the intake session paid (idempotent). Identity comes from
      // the verified-signature event metadata, not a request the client controls.
      if (meta.kind === "deposit" && meta.sessionId) {
        const { getServiceDb } = await import("@/lib/db/client");
        const { setDeposit } = await import("@/lib/repository/intake");
        await setDeposit(getServiceDb() as never, meta.sessionId, "paid", session.id);
      }
      // (Engagement-balance invoices reconcile via a dedicated payments table — follow-up.)
      break;
    }
    default:
      break;
  }
  return new Response("ok", { status: 200 });
}
