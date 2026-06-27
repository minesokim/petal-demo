// AGENT GROUND-OR-REFUSE GATE (tests/agent/ground-gate.test.ts)
//
// Catches the diagnostic's dangerous failure: the agent asserting a verifiable figure the research
// layer never grounded (the "roughly $3,800" car-loan answer, "roughly $197,300" QBI threshold).

import { describe, it, expect } from "vitest";
import { groundedFigureText, ungroundedReplyFigures } from "../../lib/agent/ground-gate";

describe("groundedFigureText — only grounded tool output licenses a figure", () => {
  it("tax_param contributes its figures only when it actually found them", () => {
    const found = groundedFigureText("tax_param", { found: true, summary: "cap is $10,000", facts: [{ label: "cap", value: "$10,000" }] });
    expect(found).toMatch(/\$10,000/);
    expect(groundedFigureText("tax_param", { found: false, note: "no figure" })).toBe("");
  });

  it("tax_compute contributes its deterministic value + trace", () => {
    const t = groundedFigureText("tax_compute", { value: 22000, trace: [{ line: "1", amount: 22000 }] });
    expect(t).toMatch(/22000/);
  });

  it("tax_research contributes its prose ONLY when it produced a grounded answer", () => {
    expect(groundedFigureText("tax_research", { bucket: "answer", answer: "The 2025 SALT cap is $40,000." })).toMatch(/\$40,000/);
    // a hedge / coverage gap licenses NO figure
    expect(groundedFigureText("tax_research", { bucket: "hedge", answer: "This is unsettled." })).toBe("");
    expect(groundedFigureText("tax_research", { bucket: "coverage_gap", answer: "No authority loaded." })).toBe("");
  });
});

describe("ungroundedReplyFigures — the parametric-leak sensor", () => {
  it("flags a figure the reply asserts that no grounded tool produced (the $3,800 leak)", () => {
    const leaks = ungroundedReplyFigures(
      "Running the numbers, the deduction comes to roughly $3,800.",
      ["cap is $10,000", "phase-out $200 per $1,000 over $100,000"],
    );
    expect(leaks).toContain("$3,800");
  });

  it("passes a reply whose every figure is grounded", () => {
    const leaks = ungroundedReplyFigures(
      "The cap is $10,000 and it phases out by $200 per $1,000.",
      ["IRC §163(h): $10,000 cap, $200 per $1,000 over the threshold"],
    );
    expect(leaks).toEqual([]);
  });

  it("matches percents against percents and money against money (no cross-type pass)", () => {
    expect(ungroundedReplyFigures("phases out at 30%", ["30% reduction over $500,000"])).toEqual([]);
    // a stale percent the authority doesn't contain is flagged
    expect(ungroundedReplyFigures("the rate is 40%", ["the rate is 30%"])).toContain("40%");
  });

  it("a figure-free reply is trivially grounded", () => {
    expect(ungroundedReplyFigures("Report the income regardless; confirm the form with the client.", [])).toEqual([]);
  });

  it("does NOT flag the user's own BARE money (no $) or arithmetic on it — the founder-exit bug", () => {
    // The user typed "5 million" (no $) and "53%". The reply restates $5,000,000 and computes
    // $2,650,000 = 53% × 5M. None is a parametric leak — they are the user's numbers + math.
    const userText = "if im a founder who has 53% equity in a company and sold it at a valuation of 5 million, how much would I get";
    const reply = "53% of $5,000,000 is $2,650,000. Your gain is $2,650,000 minus basis. The QSBS per-issuer cap is the greater of $15,000,000 or 10x basis.";
    const grounded = ["IRC §1202: per-issuer exclusion is the greater of $15,000,000 or 10 times basis"];
    const leaks = ungroundedReplyFigures(reply, grounded, userText);
    expect(leaks).not.toContain("$5,000,000");
    expect(leaks).not.toContain("$2,650,000");
    expect(leaks).toEqual([]); // $15,000,000 is grounded; the rest is the user's input + arithmetic
  });

  it("still flags a genuinely invented legal parameter even amid the user's bare money", () => {
    const userText = "I sold for 5 million and own 53%";
    // $13,610,000 (a stale estate exemption from memory) is neither the user's input, grounded, nor derivable.
    const leaks = ungroundedReplyFigures("You owe nothing; the exemption is $13,610,000.", [], userText);
    expect(leaks).toContain("$13,610,000");
  });
});
