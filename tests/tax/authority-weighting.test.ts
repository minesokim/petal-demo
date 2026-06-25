import { describe, it, expect } from "vitest";
import { weighAuthorities, type WeighedAuthority } from "@/lib/tax/authority/weighting";

const statuteFor: WeighedAuthority = { citation: "IRC §162", authorityType: "statute", stance: "for", precedential: true };
const regFor: WeighedAuthority = { citation: "26 CFR §1.162-1", authorityType: "regulation", stance: "for", precedential: true, delegationBasis: "express" };
const plrFor: WeighedAuthority = { citation: "PLR 2026-001", authorityType: "irs_guidance", stance: "for", precedential: false };
const circuitHoldingAgainst: WeighedAuthority = { citation: "Smith v. Comm'r (9th Cir.)", authorityType: "case", stance: "against", precedential: true, courtLevel: "circuit", circuit: "9" };

describe("§6662 weight-of-authorities engine", () => {
  it("statute support with no contrary authority → at least substantial authority, no disclosure", () => {
    const w = weighAuthorities([statuteFor]);
    expect(["substantial-authority", "more-likely-than-not"]).toContain(w.standard);
    expect(w.disclosureRecommended).toBe(false);
  });

  it("INVARIANT 1: a contrary controlling in-circuit holding is not outweighed by a reg (→ not substantial authority)", () => {
    const w = weighAuthorities([regFor, circuitHoldingAgainst], { circuit: "9" });
    expect(w.controllingContra).toBe(true);
    expect(["reasonable-basis", "no-substantial-authority"]).toContain(w.standard);
    expect(w.standard).not.toBe("substantial-authority");
    expect(w.invariantsApplied.join(" ")).toMatch(/controlling/i);
  });

  it("circuit-specificity: the SAME holding in a DIFFERENT circuit is not controlling for this taxpayer", () => {
    const w = weighAuthorities([regFor, circuitHoldingAgainst], { circuit: "5" }); // taxpayer in the 5th, holding is 9th
    expect(w.controllingContra).toBe(false);
    expect(["substantial-authority", "more-likely-than-not"]).toContain(w.standard);
  });

  it("INVARIANT 2: a PLR/TAM as SOLE support is never substantial authority (caps at reasonable basis + disclosure)", () => {
    const w = weighAuthorities([plrFor]);
    expect(w.soleSupportNonPrecedential).toBe(true);
    expect(w.standard).toBe("reasonable-basis");
    expect(w.disclosureRecommended).toBe(true);
  });

  it("post-Loper-Bright: an express-delegation reg outweighs a §7805-general reg of the same kind", () => {
    const express = weighAuthorities([{ ...regFor, delegationBasis: "express" }]).forWeight;
    const general = weighAuthorities([{ ...regFor, delegationBasis: "general_7805" }]).forWeight;
    expect(express).toBeGreaterThan(general);
  });

  it("no supporting authority → no substantial authority", () => {
    const w = weighAuthorities([circuitHoldingAgainst], { circuit: "9" });
    expect(w.standard).toBe("no-substantial-authority");
    expect(w.disclosureRecommended).toBe(true);
  });
});
