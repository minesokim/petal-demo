import { describe, it, expect } from "vitest";
import { aotc } from "../../../lib/tax/worksheets/aotc";
import { getFigures } from "../../../lib/tax/figures";
import { worksheetResultSchema } from "../../../lib/tax/types";

const figures = getFigures(2025, "federal");

// Derive all expected dollars FROM the figures — never bake a magic tax number.
const firstTierCap = figures.aotc.firstTierCap.value; // 100% of first $2,000
const secondTierRate = figures.aotc.secondTierRate.value; // 25% of next $2,000
const maxCredit = figures.aotc.maxCredit.value; // $2,500 / student
const refundablePct = figures.aotc.refundablePct.value; // 40% refundable
const mfjStart = figures.aotc.phaseoutMagi.mfj.start.value;
const mfjEnd = figures.aotc.phaseoutMagi.mfj.end.value;
const singleStart = figures.aotc.phaseoutMagi.single.start.value;
const singleEnd = figures.aotc.phaseoutMagi.single.end.value;

// Per-student tentative AOTC per Form 8863 Part III: 100% of first cap + rate of next cap, max maxCredit.
function perStudent(qualifiedExpenses: number): number {
  const firstTier = Math.min(qualifiedExpenses, firstTierCap);
  const secondTier = Math.min(Math.max(qualifiedExpenses - firstTierCap, 0), firstTierCap) * secondTierRate;
  return Math.min(firstTier + secondTier, maxCredit);
}

const eligibleStudent = (qualifiedExpenses: number, yearsAOTCClaimed = 0) => ({
  qualifiedExpenses,
  yearsAOTCClaimed,
  halfTimeOneAcademicPeriod: true,
  felonyDrugConviction: false,
});

describe("aotc — Form 8863 American Opportunity Credit", () => {
  it("returns a schema-valid, cited WorksheetResult", () => {
    const r = aotc(
      { students: [eligibleStudent(4000)], magi: 50000, filingStatus: "single" },
      figures,
    );
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("one student with $4,000 expenses under phaseout → $2,500 (with 40% refundable)", () => {
    const r = aotc(
      { students: [eligibleStudent(4000)], magi: 50000, filingStatus: "single" },
      figures,
    );
    // 100% of first $2,000 + 25% of next $2,000 = $2,500 (the max).
    expect(r.value).toBe(maxCredit);
    expect(r.value).toBe(perStudent(4000));
    const refundable = r.lines.find((l) => l.line === "8");
    expect(refundable?.amount).toBe(Math.round(maxCredit * refundablePct)); // $1,000
    const nonrefundable = r.lines.find((l) => l.line === "9");
    expect(nonrefundable?.amount).toBe(maxCredit - Math.round(maxCredit * refundablePct)); // $1,500
  });

  it("100%/25% two-tier structure: $2,000 expenses → $2,000; $3,000 → $2,250", () => {
    const r2000 = aotc(
      { students: [eligibleStudent(2000)], magi: 50000, filingStatus: "single" },
      figures,
    );
    expect(r2000.value).toBe(firstTierCap); // 100% of first $2,000, nothing in tier 2
    expect(r2000.value).toBe(perStudent(2000));

    const r3000 = aotc(
      { students: [eligibleStudent(3000)], magi: 50000, filingStatus: "single" },
      figures,
    );
    // $2,000 + 25% of $1,000 = $2,250
    expect(r3000.value).toBe(firstTierCap + 1000 * secondTierRate);
    expect(r3000.value).toBe(perStudent(3000));
  });

  it("multiple students sum, each capped at the per-student max", () => {
    const r = aotc(
      { students: [eligibleStudent(4000), eligibleStudent(2000)], magi: 50000, filingStatus: "single" },
      figures,
    );
    expect(r.value).toBe(perStudent(4000) + perStudent(2000)); // 2500 + 2000 = 4500
  });

  it("a student with yearsAOTCClaimed >= 4 is EXCLUDED and raises a reject flag", () => {
    const r = aotc(
      { students: [eligibleStudent(4000, 4)], magi: 50000, filingStatus: "single" },
      figures,
    );
    expect(r.value).toBe(0); // the only student is excluded
    const flag = r.flags.find((f) => f.code === "AOTC_YEARS_EXCEEDED");
    expect(flag).toBeDefined();
    expect(flag?.severity).toBe("reject");
    expect(flag?.citation).toBeDefined();
  });

  it("excludes only the over-limit student; an eligible co-student still credits", () => {
    const r = aotc(
      {
        students: [eligibleStudent(4000, 4), eligibleStudent(4000, 1)],
        magi: 50000,
        filingStatus: "single",
      },
      figures,
    );
    expect(r.value).toBe(perStudent(4000)); // only the eligible student counts
    expect(r.flags.some((f) => f.code === "AOTC_YEARS_EXCEEDED")).toBe(true);
  });

  it("MAGI above the phaseout ceiling → $0 credit", () => {
    const r = aotc(
      { students: [eligibleStudent(4000)], magi: singleEnd + 1, filingStatus: "single" },
      figures,
    );
    expect(r.value).toBe(0);
  });

  it("MAGI in the phaseout band is reduced by the 8863 ratio (single, midpoint → half)", () => {
    const mid = (singleStart + singleEnd) / 2;
    const r = aotc(
      { students: [eligibleStudent(4000)], magi: mid, filingStatus: "single" },
      figures,
    );
    const ratio = (singleEnd - mid) / (singleEnd - singleStart); // 0.5
    expect(r.value).toBe(Math.round(maxCredit * ratio)); // $1,250
  });

  it("MFJ uses the joint phaseout band", () => {
    // Just under the MFJ start → full credit; same MAGI for single would be $0.
    const r = aotc(
      { students: [eligibleStudent(4000)], magi: mfjStart - 1, filingStatus: "mfj" },
      figures,
    );
    expect(r.value).toBe(maxCredit);
    expect(mfjStart).toBeGreaterThan(singleEnd); // sanity: MFJ band is higher
  });

  it("no students → $0 and still carries a citation", () => {
    const r = aotc({ students: [], magi: 50000, filingStatus: "single" }, figures);
    expect(r.value).toBe(0);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("a not-at-least-half-time student is ineligible (review flag), excluded", () => {
    const r = aotc(
      {
        students: [{ qualifiedExpenses: 4000, yearsAOTCClaimed: 0, halfTimeOneAcademicPeriod: false, felonyDrugConviction: false }],
        magi: 50000,
        filingStatus: "single",
      },
      figures,
    );
    expect(r.value).toBe(0);
    expect(r.flags.some((f) => f.code === "AOTC_NOT_HALF_TIME")).toBe(true);
  });

  it("a felony drug conviction disqualifies the student (reject flag), excluded", () => {
    const r = aotc(
      {
        students: [{ qualifiedExpenses: 4000, yearsAOTCClaimed: 0, halfTimeOneAcademicPeriod: true, felonyDrugConviction: true }],
        magi: 50000,
        filingStatus: "single",
      },
      figures,
    );
    expect(r.value).toBe(0);
    const flag = r.flags.find((f) => f.code === "AOTC_FELONY_DRUG_CONVICTION");
    expect(flag?.severity).toBe("reject");
  });
});
