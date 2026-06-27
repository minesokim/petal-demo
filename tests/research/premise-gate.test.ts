import { describe, it, expect } from "vitest";
import { hedgeForcingPremise, type Premise } from "@/lib/research/premise-gate";

const P = (over: Partial<Premise>): Premise => ({
  assertion: "x", external: false, timeSensitive: false, outcomeDeterminative: false, grounded: false, ...over,
});

describe("premise gate — hedge on an unverified load-bearing external/time-sensitive premise", () => {
  it("the §280E cannabis class: external + time-sensitive + outcome-determinative + ungrounded → HEDGE", () => {
    const cannabis = P({
      assertion: "marijuana is a Schedule I/II controlled substance in 2026",
      external: true, timeSensitive: true, outcomeDeterminative: true, grounded: false,
    });
    expect(hedgeForcingPremise([cannabis])).toBe(cannabis);
  });

  it("settled law (no premises) → no hedge", () => {
    expect(hedgeForcingPremise(undefined)).toBeNull();
    expect(hedgeForcingPremise([])).toBeNull();
  });

  it("a GROUNDED external premise does not force a hedge (we verified it)", () => {
    expect(hedgeForcingPremise([P({ external: true, outcomeDeterminative: true, grounded: true })])).toBeNull();
  });

  it("a non-outcome-determinative external premise does not force a hedge (it doesn't move the holding)", () => {
    expect(hedgeForcingPremise([P({ external: true, timeSensitive: true, outcomeDeterminative: false })])).toBeNull();
  });

  it("a purely in-corpus static premise does not force a hedge (the cited statute IS the premise)", () => {
    expect(hedgeForcingPremise([P({ external: false, timeSensitive: false, outcomeDeterminative: true })])).toBeNull();
  });

  it("returns the FIRST hedge-forcing premise among several", () => {
    const ok = P({ external: true, outcomeDeterminative: true, grounded: true });
    const bad = P({ assertion: "rescheduled?", external: true, outcomeDeterminative: true, grounded: false });
    expect(hedgeForcingPremise([ok, bad])).toBe(bad);
  });
});
