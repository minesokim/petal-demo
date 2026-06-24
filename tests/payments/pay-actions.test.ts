import { describe, it, expect, beforeEach, vi } from "vitest";

// ⑦ Action-orchestration tests. We mock the data/payment seams so we can assert the
// SECURITY-relevant behavior without a DB or Stripe key:
//   - payDepositAction: amount is a SERVER constant, firmId comes from the RESOLVED
//     invite (not the caller), a token resolves only its own invite, and a Stripe error
//     returns a clean { error } instead of crashing.
//   - payInvoiceAction: amount is computed server-side from the invoice; a Stripe error
//     returns { url: null } instead of throwing.

// ---- shared seams (vi.hoisted so the mock factories can reference them) ----
const {
  createInvoiceCheckout, resolveLinkByToken, startSession, setDeposit, getServiceDb,
  withFirm, invoiceOf, writeAudit,
} = vi.hoisted(() => ({
  createInvoiceCheckout: vi.fn(),
  resolveLinkByToken: vi.fn(),
  startSession: vi.fn(),
  setDeposit: vi.fn(),
  getServiceDb: vi.fn(() => ({ __service: true })),
  // withFirm just runs the callback with a fake db+ctx.
  withFirm: vi.fn(async (fn: (db: unknown, ctx: unknown) => unknown) =>
    fn({ __db: true }, { firmId: "firm-1", actorId: "u1", actorType: "preparer" })),
  invoiceOf: vi.fn(),
  writeAudit: vi.fn(),
}));

vi.mock("@/lib/payments/stripe", () => ({ createInvoiceCheckout, DEPOSIT_DOLLARS: 50 }));
vi.mock("@/lib/db/client", () => ({ getServiceDb }));
vi.mock("@/lib/repository/intake", () => ({ resolveLinkByToken, startSession, setDeposit }));

// payInvoiceAction seams: the repo list calls return empty (makeDerive is mocked to a
// controllable invoiceOf); audit no-op.
vi.mock("@/lib/auth/tenant", () => ({ withFirm }));
vi.mock("@/lib/repository/practice", () => ({
  listHouseholds: vi.fn().mockResolvedValue([]),
  activeEngagements: vi.fn().mockResolvedValue([]),
  listExpectedDocs: vi.fn().mockResolvedValue([]),
  listTasks: vi.fn().mockResolvedValue([]),
  peopleOf: vi.fn().mockResolvedValue([{ email: "c@x.com" }]),
}));
vi.mock("@/lib/fixtures/derive", () => ({ makeDerive: () => ({ invoiceOf }) }));
vi.mock("@/lib/repository/audit", () => ({ writeAudit }));

import { payDepositAction } from "../../app/portal/actions";
import { payInvoiceAction } from "../../app/os/billing/actions";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "https://app.test";
});

describe("⑦ payDepositAction — IDOR-safe, server-fixed amount", () => {
  it("acts ONLY on the invite the token resolves; amount is the $50 server constant", async () => {
    // The token resolves to invite A belonging to firm-A.
    resolveLinkByToken.mockResolvedValue({ id: "link-A", firmId: "firm-A", prospectEmail: "a@x.com" });
    startSession.mockResolvedValue({ id: "sess-A" });
    createInvoiceCheckout.mockResolvedValue({ id: "cs_A", url: "https://stripe/cs_A" });

    const out = await payDepositAction("token-A");
    expect(out).toEqual({ url: "https://stripe/cs_A" });

    // The token resolved its OWN invite, and that invite's firmId/linkId/session are what
    // got used — nothing was taken from the caller.
    expect(resolveLinkByToken).toHaveBeenCalledWith(expect.anything(), "token-A");
    expect(startSession).toHaveBeenCalledWith(expect.anything(), "link-A", "firm-A");

    const arg = createInvoiceCheckout.mock.calls[0][0];
    expect(arg.amount).toBe(50); // server constant — caller cannot influence it
    expect(arg.metadata).toMatchObject({ kind: "deposit", intakeLinkId: "link-A", firmId: "firm-A", sessionId: "sess-A" });
  });

  it("an unknown token resolves nothing → clean error, no session/checkout", async () => {
    resolveLinkByToken.mockResolvedValue(null);
    const out = await payDepositAction("bogus");
    expect(out).toEqual({ error: expect.stringContaining("not valid") });
    expect(startSession).not.toHaveBeenCalled();
    expect(createInvoiceCheckout).not.toHaveBeenCalled();
  });

  it("a Stripe error returns a clean { error } — never crashes", async () => {
    resolveLinkByToken.mockResolvedValue({ id: "link-A", firmId: "firm-A", prospectEmail: null });
    startSession.mockResolvedValue({ id: "sess-A" });
    const err = new Error("Stripe is down");
    err.name = "StripeConnectionError";
    createInvoiceCheckout.mockRejectedValue(err);

    const out = await payDepositAction("token-A");
    expect(out).toHaveProperty("error");
    expect((out as { error: string }).error).not.toContain("Stripe is down"); // no raw leak
  });
});

describe("⑦ payInvoiceAction — server-derived amount + clean Stripe error path", () => {
  it("happy path: amount comes from the re-derived invoice balance", async () => {
    invoiceOf.mockReturnValue({ id: "inv-1", number: "INV-0001", clientName: "Park", balance: 1140 });
    createInvoiceCheckout.mockResolvedValue({ id: "cs_inv", url: "https://stripe/cs_inv" });

    const out = await payInvoiceAction("h-park");
    expect(out).toEqual({ url: "https://stripe/cs_inv" });
    const arg = createInvoiceCheckout.mock.calls[0][0];
    expect(arg.amount).toBe(1140); // server-derived, not client-supplied
    expect(writeAudit).toHaveBeenCalled();
  });

  it("zero/negative balance → no checkout", async () => {
    invoiceOf.mockReturnValue({ id: "inv-1", number: "INV-0001", clientName: "Park", balance: 0 });
    const out = await payInvoiceAction("h-park");
    expect(out).toEqual({ url: null });
    expect(createInvoiceCheckout).not.toHaveBeenCalled();
  });

  it("a Stripe error returns { url: null } — never crashes the billing page", async () => {
    invoiceOf.mockReturnValue({ id: "inv-1", number: "INV-0001", clientName: "Park", balance: 1140 });
    const err = new Error("Stripe 500");
    err.name = "StripeAPIError";
    createInvoiceCheckout.mockRejectedValue(err);

    const out = await payInvoiceAction("h-park");
    expect(out).toEqual({ url: null });
  });
});
