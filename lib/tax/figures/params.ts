// Deterministic PARAMETER LOOKUP — the keyed table of settled, published figures the research
// agent grounds on instead of hedging. A number must NEVER come from embeddings similarity or the
// model's memory; it comes from here (lib/tax = SOURCE OF TRUTH for numbers). Every value is the
// same cited Figure the worksheets compute against, so the lookup and the math can never diverge.
//
// Used by the tax_param agent tool. For a "what is the cap / threshold / rate for year X" question,
// the agent does a keyed lookup that returns the value(s) WITH their official source cite — which
// then renders as a clickable Source beside the answer. Only confirmed figures live here; a
// contested or unindexed figure is intentionally absent so the agent honestly hedges rather than
// grounding a wrong number.

import type { Jurisdiction, Citation } from "../types";
import { getFigures } from "./index";
import { getObbbaFigures } from "./obbba-2025";

export type ParameterProvision =
  | "salt_cap"
  | "tips_deduction"
  | "overtime_deduction"
  | "senior_deduction"
  | "car_loan_interest"
  | "qbi_threshold"
  | "standard_deduction"
  | "child_tax_credit";

export const PARAMETER_PROVISIONS: ParameterProvision[] = [
  "salt_cap", "tips_deduction", "overtime_deduction", "senior_deduction", "car_loan_interest",
  "qbi_threshold", "standard_deduction", "child_tax_credit",
];

export type ParameterFact = { label: string; value: string };
export type ParameterAnswer = {
  provision: ParameterProvision;
  taxYear: number;
  jurisdiction: Jurisdiction;
  summary: string; // one-line plain answer carrying the number(s)
  facts: ParameterFact[]; // label → value pairs (cap, thresholds, rate, floor, …)
  citations: Citation[]; // cite + sourceUrl — render as clickable Sources
};

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;
function uniqCites(cs: Citation[]): Citation[] {
  const seen = new Set<string>();
  return cs.filter((c) => c && c.cite && !seen.has(c.cite) && (seen.add(c.cite), true));
}

// Deterministic lookup. Returns null when the provision/year isn't a confirmed figure (the
// underlying getFigures/getObbbaFigures throw on an unknown year — caught here) so the caller
// falls back to grounded research rather than asserting.
export function lookupParameter(
  provision: ParameterProvision,
  taxYear: number,
  jurisdiction: Jurisdiction = "federal",
): ParameterAnswer | null {
  try {
    switch (provision) {
      case "salt_cap": {
        const s = getObbbaFigures(taxYear).saltCap;
        return {
          provision, taxYear, jurisdiction,
          summary: `The SALT deduction cap (IRC §164(b)(6)) for ${taxYear} is ${usd(s.applicableLimitation.value)} — not repealed — reduced by ${pct(s.phaseDownRate.value)} of MAGI over ${usd(s.phaseDownThreshold.value)}, never below the ${usd(s.floor.value)} floor.`,
          facts: [
            { label: "Applicable limitation (cap)", value: usd(s.applicableLimitation.value) },
            { label: "Phase-down threshold (MAGI)", value: usd(s.phaseDownThreshold.value) },
            { label: "Phase-down rate", value: pct(s.phaseDownRate.value) },
            { label: "Floor", value: usd(s.floor.value) },
          ],
          citations: uniqCites([s.applicableLimitation.citation, s.phaseDownThreshold.citation, s.floor.citation]),
        };
      }
      case "tips_deduction": {
        const t = getObbbaFigures(taxYear).tips;
        return {
          provision, taxYear, jurisdiction,
          summary: `The no-tax-on-tips deduction (IRC §224) for ${taxYear} is a deduction (not an exclusion — tips are still reported) capped at ${usd(t.cap.value)}, phasing out by ${usd(t.phaseOutPer1000.value)} per $1,000 of MAGI over ${usd(t.phaseOutThreshold.default.value)} (${usd(t.phaseOutThreshold.mfj.value)} MFJ).`,
          facts: [
            { label: "Cap", value: usd(t.cap.value) },
            { label: "Phase-out threshold (non-joint)", value: usd(t.phaseOutThreshold.default.value) },
            { label: "Phase-out threshold (MFJ)", value: usd(t.phaseOutThreshold.mfj.value) },
            { label: "Phase-out per $1,000 over", value: usd(t.phaseOutPer1000.value) },
          ],
          citations: uniqCites([t.cap.citation, t.phaseOutThreshold.default.citation, t.phaseOutPer1000.citation]),
        };
      }
      case "overtime_deduction": {
        const o = getObbbaFigures(taxYear).overtime;
        return {
          provision, taxYear, jurisdiction,
          summary: `The qualified-overtime deduction (IRC §225) for ${taxYear} is capped at ${usd(o.cap.value)}, phasing out by ${usd(o.phaseOutPer1000.value)} per $1,000 of MAGI over ${usd(o.phaseOutThreshold.default.value)} (${usd(o.phaseOutThreshold.mfj.value)} MFJ).`,
          facts: [
            { label: "Cap", value: usd(o.cap.value) },
            { label: "Phase-out threshold (non-joint)", value: usd(o.phaseOutThreshold.default.value) },
            { label: "Phase-out threshold (MFJ)", value: usd(o.phaseOutThreshold.mfj.value) },
            { label: "Phase-out per $1,000 over", value: usd(o.phaseOutPer1000.value) },
          ],
          citations: uniqCites([o.cap.citation, o.phaseOutThreshold.default.citation, o.phaseOutPer1000.citation]),
        };
      }
      case "senior_deduction": {
        const s = getObbbaFigures(taxYear).senior;
        return {
          provision, taxYear, jurisdiction,
          summary: `The enhanced senior deduction for ${taxYear} is ${usd(s.perIndividual.value)} per qualifying individual age 65+, reduced by ${pct(s.phaseOutRate.value)} of MAGI over ${usd(s.phaseOutThreshold.default.value)} (${usd(s.phaseOutThreshold.mfj.value)} joint) — the reduction applies PER qualifying spouse.`,
          facts: [
            { label: "Per qualifying individual", value: usd(s.perIndividual.value) },
            { label: "Phase-out threshold (non-joint)", value: usd(s.phaseOutThreshold.default.value) },
            { label: "Phase-out threshold (joint)", value: usd(s.phaseOutThreshold.mfj.value) },
            { label: "Phase-out rate (of MAGI over threshold)", value: pct(s.phaseOutRate.value) },
          ],
          citations: uniqCites([s.perIndividual.citation, s.phaseOutThreshold.default.citation, s.phaseOutRate.citation]),
        };
      }
      case "car_loan_interest": {
        const c = getObbbaFigures(taxYear).carLoan;
        return {
          provision, taxYear, jurisdiction,
          summary: `The qualified car-loan interest deduction (IRC §163(h)(4)(A)) for ${taxYear} is capped at ${usd(c.cap.value)} of interest, phasing out by ${usd(c.phaseOutPer1000.value)} per $1,000 of MAGI over ${usd(c.phaseOutThreshold.default.value)} (${usd(c.phaseOutThreshold.mfj.value)} MFJ); the vehicle must be new with US final assembly and the loan originated after 12/31/2024. Note: the phase-out reduces the lesser of the actual interest and the cap.`,
          facts: [
            { label: "Cap (max interest)", value: usd(c.cap.value) },
            { label: "Phase-out threshold (non-joint)", value: usd(c.phaseOutThreshold.default.value) },
            { label: "Phase-out threshold (MFJ)", value: usd(c.phaseOutThreshold.mfj.value) },
            { label: "Phase-out per $1,000 over", value: usd(c.phaseOutPer1000.value) },
          ],
          citations: uniqCites([c.cap.citation, c.phaseOutThreshold.default.citation, c.phaseOutPer1000.citation]),
        };
      }
      case "qbi_threshold": {
        const q = getFigures(taxYear, "federal").qbi;
        return {
          provision, taxYear, jurisdiction: "federal",
          summary: `For ${taxYear}, the §199A QBI deduction is ${pct(q.rate.value)} of QBI; the taxable-income threshold is ${usd(q.threshold.single.value)} (non-joint) / ${usd(q.threshold.mfj.value)} (MFJ), and the SSTB/wage phase-in runs ${usd(q.phaseInRange.value)} above it (×2 for MFJ).`,
          facts: [
            { label: "Deduction rate", value: pct(q.rate.value) },
            { label: "Threshold (non-joint)", value: usd(q.threshold.single.value) },
            { label: "Threshold (MFJ)", value: usd(q.threshold.mfj.value) },
            { label: "Phase-in range above threshold", value: `${usd(q.phaseInRange.value)} (×2 MFJ)` },
          ],
          citations: uniqCites([q.rate.citation, q.threshold.single.citation, q.threshold.mfj.citation, q.phaseInRange.citation]),
        };
      }
      case "standard_deduction": {
        const sd = getFigures(taxYear, "federal").standardDeduction;
        return {
          provision, taxYear, jurisdiction: "federal",
          summary: `The ${taxYear} standard deduction is ${usd(sd.single.value)} (single), ${usd(sd.mfj.value)} (MFJ), and ${usd(sd.hoh.value)} (head of household).`,
          facts: [
            { label: "Single", value: usd(sd.single.value) },
            { label: "Married filing jointly", value: usd(sd.mfj.value) },
            { label: "Head of household", value: usd(sd.hoh.value) },
            { label: "Married filing separately", value: usd(sd.mfs.value) },
          ],
          citations: uniqCites([sd.single.citation, sd.mfj.citation, sd.hoh.citation]),
        };
      }
      case "child_tax_credit": {
        const c = getFigures(taxYear, "federal").ctc;
        return {
          provision, taxYear, jurisdiction: "federal",
          summary: `For ${taxYear}, the Child Tax Credit is ${usd(c.perChild.value)} per qualifying child (${usd(c.odcPerDependent.value)} ODC for other dependents), phasing out by ${usd(c.phaseoutPer1000.value)} per $1,000 of MAGI over ${usd(c.phaseoutThreshold.single.value)} (${usd(c.phaseoutThreshold.mfj.value)} MFJ).`,
          facts: [
            { label: "Per qualifying child", value: usd(c.perChild.value) },
            { label: "Other-dependent credit (ODC)", value: usd(c.odcPerDependent.value) },
            { label: "Phase-out threshold (non-joint)", value: usd(c.phaseoutThreshold.single.value) },
            { label: "Phase-out threshold (MFJ)", value: usd(c.phaseoutThreshold.mfj.value) },
            { label: "Phase-out per $1,000 over", value: usd(c.phaseoutPer1000.value) },
          ],
          citations: uniqCites([c.perChild.citation, c.phaseoutThreshold.single.citation, c.phaseoutPer1000.citation]),
        };
      }
    }
  } catch {
    return null; // unknown year/jurisdiction (getFigures threw) — caller falls back to research
  }
  return null;
}
