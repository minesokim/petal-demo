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
      // Payment captured. Invoice state is derived from engagement stages today, so
      // recording a settled payment needs a dedicated payments table (follow-up
      // migration) keyed by metadata.firmId/householdId — kept out of this slice to
      // avoid guessing the reconciliation model. Acknowledge idempotently for now.
      break;
    }
    default:
      break;
  }
  return new Response("ok", { status: 200 });
}
