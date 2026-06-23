import Stripe from "stripe";

// ⑦ Payments. Stripe handles all card data (PCI) — it never touches our servers.
// Lazy client so the app boots without the key (dev/build).
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export type InvoiceCheckout = {
  amount: number; // whole dollars
  description: string;
  clientEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

// One-time hosted Checkout session for an invoice balance. Returns the redirect URL.
export async function createInvoiceCheckout(input: InvoiceCheckout): Promise<{ id: string; url: string | null }> {
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "usd",
        product_data: { name: input.description },
        unit_amount: Math.round(input.amount * 100), // cents
      },
    }],
    customer_email: input.clientEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: input.metadata,
  });
  return { id: session.id, url: session.url };
}

// Verify + parse a Stripe webhook event (signature-checked; never trust the body raw).
export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
