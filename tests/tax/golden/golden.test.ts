// Golden-scenario harness (L6 seed). Iterates the known-answer scenarios through the
// deterministic orchestrator runFederal1040 and asserts each expected field. The expected
// values live in scenarios.ts, derived from the IRS worksheets + figures (not magic numbers).
// We only assert over fields backed by `verified: true` figures.

import { describe, it, expect } from "vitest";
import { runFederal1040 } from "../../../lib/tax/worksheets";
import { worksheetResultSchema } from "../../../lib/tax/types";
import { SCENARIOS } from "./scenarios";

describe("Golden 1040 scenarios (L6 seed) — runFederal1040", () => {
  it("ships at least four known-answer scenarios", () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(4);
  });

  for (const scenario of SCENARIOS) {
    describe(scenario.name, () => {
      const out = runFederal1040(scenario.facts);

      it("returns a ReturnComputation carrying at least one citation", () => {
        expect(out.citations.length).toBeGreaterThan(0);
        // every credit/deduction the run produced is itself a schema-valid WorksheetResult
        for (const result of Object.values(out.credits)) {
          if (result) expect(worksheetResultSchema.safeParse(result).success).toBe(true);
        }
      });

      const e = scenario.expect;

      if (e.stdDeduction !== undefined) {
        it(`standard deduction = ${e.stdDeduction}`, () => {
          expect(out.credits.standardDeduction.value).toBe(e.stdDeduction);
        });
      }

      if (e.eitc !== undefined) {
        it(`EITC = ${e.eitc}`, () => {
          expect(out.credits.eitc.value).toBe(e.eitc);
        });
      }

      if (e.ctcNonRefundable !== undefined) {
        it(`CTC non-refundable = ${e.ctcNonRefundable}`, () => {
          expect(out.credits.childTaxCredit.value).toBe(e.ctcNonRefundable);
        });
      }

      if (e.actcRefundable !== undefined) {
        it(`ACTC refundable (line 27) = ${e.actcRefundable}`, () => {
          const line27 = out.credits.childTaxCredit.lines.find((l) => l.line === "27");
          expect(line27?.amount).toBe(e.actcRefundable);
        });
      }

      if (e.aotc !== undefined) {
        it(`AOTC = ${e.aotc}`, () => {
          expect(out.credits.aotc.value).toBe(e.aotc);
        });
      }

      if (e.aotcRefundable !== undefined) {
        it(`AOTC refundable (Form 8863 line 8) = ${e.aotcRefundable}`, () => {
          const line8 = out.credits.aotc.lines.find((l) => l.line === "8");
          expect(line8?.amount).toBe(e.aotcRefundable);
        });
      }

      if (e.qbi !== undefined) {
        it(`QBI deduction = ${e.qbi}`, () => {
          expect(out.credits.qbi.value).toBe(e.qbi);
        });
      }

      if (e.rejectFlags) {
        for (const code of e.rejectFlags) {
          it(`raises reject flag ${code}`, () => {
            expect(out.flags.some((f) => f.code === code && f.severity === "reject")).toBe(true);
          });
        }
      }

      if (e.noRejectFlags) {
        it("raises no reject-severity flags", () => {
          expect(out.flags.some((f) => f.severity === "reject")).toBe(false);
        });
      }
    });
  }
});
