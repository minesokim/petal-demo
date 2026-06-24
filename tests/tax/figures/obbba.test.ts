import { describe, it, expect } from "vitest";
import { z } from "zod";
import { getObbbaFigures, OBBBA_2025, OBBBA_2026 } from "../../../lib/tax/figures/obbba-2025";
import { figureSchema } from "../../../lib/tax/types";

const numFig = figureSchema(z.number());

describe("OBBBA figures (P.L. 119-21)", () => {
  it("getObbbaFigures resolves 2025 and 2026, throws otherwise", () => {
    expect(getObbbaFigures(2025)).toBe(OBBBA_2025);
    expect(getObbbaFigures(2026)).toBe(OBBBA_2026);
    expect(() => getObbbaFigures(2024)).toThrow();
    expect(() => getObbbaFigures(2030)).toThrow();
  });

  it("every SALT figure is a valid, cited Figure", () => {
    const s = OBBBA_2025.saltCap;
    for (const fig of [s.applicableLimitation, s.phaseDownThreshold, s.phaseDownRate, s.floor, s.floorMFS]) {
      expect(numFig.safeParse(fig).success).toBe(true);
    }
  });

  it("carries the verified SALT amounts (2025 vs 2026)", () => {
    expect(OBBBA_2025.saltCap.applicableLimitation.value).toBe(40000);
    expect(OBBBA_2025.saltCap.phaseDownThreshold.value).toBe(500000);
    expect(OBBBA_2026.saltCap.applicableLimitation.value).toBe(40400);
    expect(OBBBA_2026.saltCap.phaseDownThreshold.value).toBe(505000);
    expect(OBBBA_2025.saltCap.phaseDownRate.value).toBe(0.3);
    expect(OBBBA_2025.saltCap.floor.value).toBe(10000);
    expect(OBBBA_2025.saltCap.floorMFS.value).toBe(5000);
  });

  it("carries the verified tips / overtime / senior caps + thresholds", () => {
    expect(OBBBA_2025.tips.cap.value).toBe(25000);
    expect(OBBBA_2025.tips.phaseOutThreshold.default.value).toBe(150000);
    expect(OBBBA_2025.tips.phaseOutThreshold.mfj.value).toBe(300000);
    expect(OBBBA_2025.tips.phaseOutPer1000.value).toBe(100);

    expect(OBBBA_2025.overtime.cap.value).toBe(12500);
    expect(OBBBA_2025.overtime.capMFJ.value).toBe(25000);

    expect(OBBBA_2025.senior.perIndividual.value).toBe(6000);
    expect(OBBBA_2025.senior.phaseOutThreshold.default.value).toBe(75000);
    expect(OBBBA_2025.senior.phaseOutThreshold.mfj.value).toBe(150000);
    expect(OBBBA_2025.senior.phaseOutRate.value).toBe(0.06);
  });

  it("every cited OBBBA figure resolves to an official .gov source and is verified", () => {
    const figs = [
      OBBBA_2025.saltCap.applicableLimitation,
      OBBBA_2025.tips.cap,
      OBBBA_2025.overtime.cap,
      OBBBA_2025.senior.perIndividual,
    ];
    for (const fig of figs) {
      expect(fig.citation.sourceUrl).toMatch(/\.gov/);
      expect(fig.verified).toBe(true);
    }
  });
});
