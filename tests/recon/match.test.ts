import { describe, it, expect } from "vitest";
import { reconcile, toCents, fromCents } from "../../lib/recon/match";
import { RECON_FIXTURE, RECON_FIXTURE_EXPECTED } from "../../lib/recon/fixture";

// GOLDEN recon test (the brief's eval seed) — the deterministic matcher against a fixture
// with KNOWN-correct answers: 9 clean matches (7 exact + 2 fuzzy), 1 proposed month-end
// journal, 2 exceptions (1 bank-side, 1 ledger-side). Asserts reconcile() finds EXACTLY
// those, ties out to the penny, and flags exactly the 2 exceptions with reasons. Pure,
// model-free — no DB, no network, no model.

const E = RECON_FIXTURE_EXPECTED;

describe("reconcile() — golden fixture", () => {
  const result = reconcile(
    RECON_FIXTURE.bankTransactions as never,
    RECON_FIXTURE.ledgerItems as never,
  );

  it("finds exactly 9 clean matches (7 exact + 2 fuzzy)", () => {
    expect(result.matched.length).toBe(E.matched);
    expect(result.matched.filter((m) => m.basis === "exact").length).toBe(E.exactMatches);
    expect(result.matched.filter((m) => m.basis === "fuzzy").length).toBe(E.fuzzyMatches);
  });

  it("each match is a unique bank↔ledger pairing (no double-spend of a line)", () => {
    const bankIds = new Set(result.matched.map((m) => m.bankId));
    const ledgerIds = new Set(result.matched.map((m) => m.ledgerId));
    expect(bankIds.size).toBe(E.matched);
    expect(ledgerIds.size).toBe(E.matched);
  });

  it("proposes exactly 1 month-end manual journal, sourced from the accrual bank line", () => {
    expect(result.proposedJournals.length).toBe(E.proposedJournals);
    const j = result.proposedJournals[0];
    expect(j.sourceBankIds).toContain(E.journalBankId);
    expect(j.period).toBe("2025-03");
    expect(j.date).toBe("2025-03-31"); // month-end
    expect(j.lines.length).toBeGreaterThan(0);
  });

  it("flags exactly the 2 exceptions — one bank-side, one ledger-side — with reasons", () => {
    expect(result.unmatched.bank.length).toBe(E.bankExceptions);
    expect(result.unmatched.ledger.length).toBe(E.ledgerExceptions);
    expect(result.unmatched.bank[0].id).toBe(E.exceptionBankId);
    expect(result.unmatched.ledger[0].id).toBe(E.exceptionLedgerId);
    // every exception carries a human-readable reason (not auto-resolved)
    for (const e of [...result.unmatched.bank, ...result.unmatched.ledger]) {
      expect(e.reason.length).toBeGreaterThan(0);
    }
  });

  it("the accrual bank line is NOT a plain exception (it became the journal)", () => {
    const allExceptionIds = [...result.unmatched.bank, ...result.unmatched.ledger].map((e) => e.id);
    expect(allExceptionIds).not.toContain(E.journalBankId);
  });

  it("ties out to the penny", () => {
    expect(result.tieOut.bankTotal).toBe(E.bankTotal);
    expect(result.tieOut.ledgerTotal).toBe(E.ledgerTotal);
    expect(result.tieOut.difference).toBe(E.difference);
    // integer-cents identity: bank - ledger == difference, exactly.
    expect(result.tieOut.bankTotalCents - result.tieOut.ledgerTotalCents).toBe(result.tieOut.differenceCents);
  });

  it("accounts for every input line exactly once (matched ∪ journal ∪ exception)", () => {
    const matchedBank = result.matched.map((m) => m.bankId);
    const matchedLedger = result.matched.map((m) => m.ledgerId);
    const journalBank = result.proposedJournals.flatMap((j) => j.sourceBankIds);
    const excBank = result.unmatched.bank.map((e) => e.id);
    const excLedger = result.unmatched.ledger.map((e) => e.id);
    expect(new Set([...matchedBank, ...journalBank, ...excBank]).size).toBe(E.bankCount);
    expect(new Set([...matchedLedger, ...excLedger]).size).toBe(E.ledgerCount);
  });
});

describe("money helpers — integer cents, no float compares", () => {
  it("toCents / fromCents round-trip signed decimals exactly", () => {
    expect(toCents("-1200.00")).toBe(-120000);
    expect(toCents("2500.00")).toBe(250000);
    expect(toCents("-340.18")).toBe(-34018);
    expect(toCents("0.01")).toBe(1);
    expect(fromCents(-34018)).toBe("-340.18");
    expect(fromCents(250000)).toBe("2500.00");
    expect(fromCents(-1)).toBe("-0.01");
  });
});
