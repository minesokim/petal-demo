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
});
