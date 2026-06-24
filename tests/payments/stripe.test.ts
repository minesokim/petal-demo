import { describe, it, expect, beforeEach, vi } from "vitest";

// ⑦ Mock the Stripe SDK so no real key/network is needed. The constructor returns a
// fake client whose webhooks.constructEvent enforces a trivial "good"/"bad" signature
// rule, mirroring Stripe's real fail-closed behavior (throws on a bad signature).
const constructEvent = vi.fn();
vi.mock("stripe", () => {
  return {
    default: class FakeStripe {
      webhooks = { constructEvent };
      checkout = { sessions: { create: vi.fn() } };
    },
  };
});

// Import AFTER the mock is registered.
import { constructWebhookEvent, DEPOSIT_CENTS, DEPOSIT_DOLLARS } from "../../lib/payments/stripe";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";
  // Real signature semantics: valid signature → returns the parsed event; bad → throws.
  constructEvent.mockImplementation((_payload: string, signature: string, _secret: string) => {
    if (signature !== "good-sig") {
      const err = new Error("No signatures found matching the expected signature for payload");
      err.name = "StripeSignatureVerificationError";
      throw err;
    }
    return { id: "evt_1", type: "checkout.session.completed", data: { object: { id: "cs_1" } } };
  });
});

describe("⑦ constructWebhookEvent — signature verification (fail-closed)", () => {
  it("the deposit amount is the server constant $50 = 5000 cents", () => {
    expect(DEPOSIT_DOLLARS).toBe(50);
    expect(DEPOSIT_CENTS).toBe(5000);
  });

  it("accepts a valid signature and returns the parsed event", () => {
    const event = constructWebhookEvent("{}", "good-sig");
    expect(event.type).toBe("checkout.session.completed");
    expect(constructEvent).toHaveBeenCalledWith("{}", "good-sig", "whsec_fake");
  });

  it("REJECTS a bad signature by throwing (never returns an event)", () => {
    expect(() => constructWebhookEvent("{}", "forged-sig")).toThrow();
  });

  it("throws if the webhook secret is not configured (fail-closed)", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(() => constructWebhookEvent("{}", "good-sig")).toThrow(/STRIPE_WEBHOOK_SECRET/);
  });
});
