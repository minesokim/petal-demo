import { describe, it, expect, beforeEach, vi } from "vitest";

// ⑦ Webhook route harness. We mock the signature verifier (so we control the parsed
// event + whether the signature is "valid"), the service-db setDeposit call (so we can
// assert mark-paid vs no-op without a DB), and the invoice reconcile helper.
const { constructWebhookEvent, setDeposit, getServiceDb, expectedInvoiceCents } = vi.hoisted(() => ({
  constructWebhookEvent: vi.fn(),
  setDeposit: vi.fn(),
  getServiceDb: vi.fn(() => ({})),
  expectedInvoiceCents: vi.fn(),
}));

vi.mock("@/lib/payments/stripe", () => ({
  constructWebhookEvent,
  DEPOSIT_CENTS: 5000,
}));
vi.mock("@/lib/db/client", () => ({ getServiceDb }));
vi.mock("@/lib/repository/intake", () => ({ setDeposit }));
vi.mock("@/lib/payments/reconcile", () => ({ expectedInvoiceCents }));

import { POST } from "../../app/api/webhooks/stripe/route";

// Build a Request that carries the given raw body + signature header.
function makeReq(body: unknown, sig: string | null): Request {
  const headers = new Headers();
  if (sig !== null) headers.set("stripe-signature", sig);
  return new Request("https://x/api/webhooks/stripe", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// Make the verifier behave like the real SDK: "good-sig" parses to `event`; anything
// else throws (fail-closed).
function armSignature(event: unknown) {
  constructWebhookEvent.mockImplementation((_body: string, sig: string) => {
    if (sig !== "good-sig") throw new Error("invalid signature");
    return event;
  });
}

const depositEvent = (over: Record<string, unknown> = {}) => ({
  id: "evt_dep",
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_dep",
      payment_status: "paid",
      amount_total: 5000,
      metadata: { kind: "deposit", sessionId: "sess_1" },
      ...over,
    },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  setDeposit.mockResolvedValue({ changed: true });
});

describe("⑦ POST /api/webhooks/stripe — signature + settlement + amount gates", () => {
  it("missing signature → 400, no mutation", async () => {
    const res = await POST(makeReq(depositEvent(), null));
    expect(res.status).toBe(400);
    expect(setDeposit).not.toHaveBeenCalled();
  });

  it("bad signature → 400 (fail-closed), no mutation", async () => {
    armSignature(depositEvent());
    const res = await POST(makeReq(depositEvent(), "forged-sig"));
    expect(res.status).toBe(400);
    expect(setDeposit).not.toHaveBeenCalled();
  });

  it("valid PAID deposit with correct amount → marks the deposit paid", async () => {
    armSignature(depositEvent());
    const res = await POST(makeReq(depositEvent(), "good-sig"));
    expect(res.status).toBe(200);
    expect(setDeposit).toHaveBeenCalledTimes(1);
    // Marks the *resolved* session paid with the Stripe session id — identity from the
    // verified event, status is the literal "paid".
    expect(setDeposit).toHaveBeenCalledWith(expect.anything(), "sess_1", "paid", "cs_dep");
  });

  it("payment_status != 'paid' (async pending) → does NOT mark paid, still 200", async () => {
    armSignature(depositEvent({ payment_status: "unpaid" }));
    const res = await POST(makeReq({}, "good-sig"));
    expect(res.status).toBe(200);
    expect(setDeposit).not.toHaveBeenCalled();
  });

  it("amount mismatch (not $50) → does NOT mark paid, still 200", async () => {
    armSignature(depositEvent({ amount_total: 100 })); // $1, attacker-tampered
    const res = await POST(makeReq({}, "good-sig"));
    expect(res.status).toBe(200);
    expect(setDeposit).not.toHaveBeenCalled();
  });

  it("re-delivered event is idempotent (setDeposit no-op guards the double-write)", async () => {
    armSignature(depositEvent());
    // First delivery marks paid.
    await POST(makeReq({}, "good-sig"));
    // Stripe re-delivers the SAME event; setDeposit now reports no change (already paid).
    setDeposit.mockResolvedValueOnce({ changed: false });
    const res = await POST(makeReq({}, "good-sig"));
    expect(res.status).toBe(200);
    // The route forwards both deliveries to setDeposit; idempotency lives in setDeposit,
    // which we assert separately. Here we confirm a re-delivery never errors / never 500s.
    expect(setDeposit).toHaveBeenCalledTimes(2);
  });

  it("invoice event → validates re-derived balance; mismatch refuses (no crash, 200)", async () => {
    const invoiceEvent = {
      id: "evt_inv",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_inv",
          payment_status: "paid",
          amount_total: 999, // tampered
          metadata: { householdId: "h-park", firmId: "firm-1", invoice: "INV-0001" },
        },
      },
    };
    expectedInvoiceCents.mockResolvedValue(114000); // real balance is $1140
    armSignature(invoiceEvent);
    const res = await POST(makeReq({}, "good-sig"));
    expect(res.status).toBe(200);
    expect(expectedInvoiceCents).toHaveBeenCalledWith("firm-1", "h-park");
    // metadata.invoice is NOT trusted; the amount didn't match the re-derived balance.
    expect(setDeposit).not.toHaveBeenCalled();
  });

  it("a handler that throws is swallowed → 200 ack (Stripe must not retry-storm)", async () => {
    armSignature(depositEvent());
    setDeposit.mockRejectedValueOnce(new Error("db down"));
    const res = await POST(makeReq({}, "good-sig"));
    expect(res.status).toBe(200);
  });
});
