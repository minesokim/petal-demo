import { describe, it, expect } from "vitest";
import { z } from "zod";
import { getFigures } from "../../lib/tax/figures";
import { figureSchema } from "../../lib/tax/types";

const numFig = figureSchema(z.number());

describe("federal TY2025 figures", () => {
  const fig = getFigures(2025, "federal");

  it("every standard-deduction figure is a valid, cited Figure", () => {
    for (const status of ["single", "mfj", "mfs", "hoh", "qss"] as const) {
      expect(numFig.safeParse(fig.standardDeduction[status]).success).toBe(true);
    }
  });

  it("carries the OBBBA TY2025 std deduction + CTC", () => {
    expect(fig.standardDeduction.mfj.value).toBe(31500);
    expect(fig.standardDeduction.single.value).toBe(15750);
    expect(fig.ctc.perChild.value).toBe(2200);
    expect(fig.ctc.refundableCap.value).toBe(1700);
  });

  it("carries the IRS-confirmed QBI thresholds + AOTC phaseout", () => {
    expect(fig.qbi.threshold.single.value).toBe(197300);
    expect(fig.qbi.threshold.mfj.value).toBe(394600);
    expect(fig.aotc.maxCredit.value).toBe(2500);
    expect(fig.aotc.phaseoutMagi.mfj.end.value).toBe(180000);
  });

  it("every cited figure resolves to an official .gov source", () => {
    const urls = [
      fig.standardDeduction.single.citation.sourceUrl,
      fig.eitc.investmentIncomeLimit.citation.sourceUrl,
      fig.qbi.threshold.single.citation.sourceUrl,
      fig.dueDiligencePenaltyPerFailure.citation.sourceUrl,
    ];
    for (const u of urls) expect(u).toMatch(/\.gov/);
  });

  it("throws for an unknown year/jurisdiction rather than guessing", () => {
    expect(() => getFigures(2099, "federal")).toThrow(/No tax figures/);
  });
});
