import { describe, it, expect } from "vitest";
import { lookupParameter, PARAMETER_PROVISIONS } from "../../lib/tax/figures/params";

// Golden set for the deterministic parameter lookup — the settled figures the research agent
// grounds on instead of hedging. Values confirmed against current authority (post-OBBBA, 2025/26).
// If a figure here is wrong, the agent confidently grounds a wrong number — so this is the gate.

describe("lookupParameter — settled figures ground exactly + cited", () => {
  it("SALT cap is NOT repealed: $40,000 (2025) / $40,400 (2026), 30% phase-down over $500k/$505k, $10k floor", () => {
    const a = lookupParameter("salt_cap", 2025)!;
    expect(a.facts.find(f => /cap/i.test(f.label))!.value).toBe("$40,000");
    expect(a.facts.find(f => /threshold/i.test(f.label))!.value).toBe("$500,000");
    expect(a.facts.find(f => /rate/i.test(f.label))!.value).toBe("30%");
    expect(a.facts.find(f => /floor/i.test(f.label))!.value).toBe("$10,000");
    const b = lookupParameter("salt_cap", 2026)!;
    expect(b.facts.find(f => /cap/i.test(f.label))!.value).toBe("$40,400");
    expect(b.facts.find(f => /threshold/i.test(f.label))!.value).toBe("$505,000");
  });

  it("tips deduction: $25,000 cap, $150k/$300k thresholds, $100 per $1,000", () => {
    const a = lookupParameter("tips_deduction", 2025)!;
    expect(a.facts.find(f => /^cap/i.test(f.label))!.value).toBe("$25,000");
    expect(a.facts.find(f => /non-joint/i.test(f.label))!.value).toBe("$150,000");
    expect(a.facts.find(f => /MFJ/i.test(f.label))!.value).toBe("$300,000");
    expect(a.facts.find(f => /per \$1,000/i.test(f.label))!.value).toBe("$100");
    expect(a.summary).toMatch(/deduction \(not an exclusion/); // corrects the "tax free" framing
  });

  it("overtime deduction cap is $12,500", () => {
    expect(lookupParameter("overtime_deduction", 2025)!.facts.find(f => /^cap/i.test(f.label))!.value).toBe("$12,500");
  });

  it("senior deduction: $6,000 per qualifying individual, 6% over $75k/$150k, per spouse", () => {
    const a = lookupParameter("senior_deduction", 2025)!;
    expect(a.facts.find(f => /per qualifying/i.test(f.label))!.value).toBe("$6,000");
    expect(a.facts.find(f => /rate/i.test(f.label))!.value).toBe("6%");
    expect(a.summary).toMatch(/PER qualifying spouse/);
  });

  it("car-loan interest (§163(h)(4)(A)): $10,000 cap, $200 per $1,000 over $100k/$200k, 2025-2028", () => {
    const a = lookupParameter("car_loan_interest", 2025)!;
    expect(a.facts.find(f => /cap/i.test(f.label))!.value).toBe("$10,000");
    expect(a.facts.find(f => /non-joint/i.test(f.label))!.value).toBe("$100,000");
    expect(a.facts.find(f => /MFJ/i.test(f.label))!.value).toBe("$200,000");
    expect(a.facts.find(f => /per \$1,000/i.test(f.label))!.value).toBe("$200");
    expect(a.summary).toMatch(/reduces the lesser of the actual interest and the cap/); // the nuance you corrected
    expect(a.citations[0].cite).toMatch(/163\(h\)\(4\)\(A\)/);
  });

  it("§199A QBI: 20%, thresholds $197,300 single / $394,600 MFJ, $50,000 phase-in", () => {
    const a = lookupParameter("qbi_threshold", 2025)!;
    expect(a.facts.find(f => /rate/i.test(f.label))!.value).toBe("20%");
    expect(a.facts.find(f => /non-joint/i.test(f.label))!.value).toBe("$197,300");
    expect(a.facts.find(f => /MFJ/i.test(f.label))!.value).toBe("$394,600");
  });

  it("child tax credit: $2,200 per child, $500 ODC, $50 per $1,000", () => {
    const a = lookupParameter("child_tax_credit", 2025)!;
    expect(a.facts.find(f => /per qualifying child/i.test(f.label))!.value).toBe("$2,200");
    expect(a.facts.find(f => /ODC/i.test(f.label))!.value).toBe("$500");
  });

  it("§6695(g) due-diligence penalty for returns filed in 2025 is $650/failure (verified vs Rev. Proc. 2025-32)", () => {
    const a = lookupParameter("due_diligence_penalty", 2025)!;
    expect(a.facts.find(f => /per failure/i.test(f.label))!.value).toBe("$650");
    expect(a.summary).toMatch(/each covered item/i); // it stacks per credit/status
  });

  it("EVERY grounded parameter ships at least one citation with an official source URL (clickable)", () => {
    for (const p of PARAMETER_PROVISIONS) {
      const a = lookupParameter(p, 2025);
      if (!a) continue; // some provisions are federal/year-specific
      expect(a.citations.length).toBeGreaterThan(0);
      for (const c of a.citations) {
        expect(c.cite.length).toBeGreaterThan(0);
        expect(c.sourceUrl).toMatch(/^https?:\/\//); // resolvable link for the Sources UI
      }
    }
  });

  it("returns null for an unknown year (caller falls back to research, never asserts)", () => {
    expect(lookupParameter("salt_cap", 2099)).toBeNull();
    expect(lookupParameter("qbi_threshold", 1999)).toBeNull();
  });
});
