// MeF-reject-style validators (deterministic, model-free).
//
// The IRS Modernized e-File (MeF) system rejects a return that violates a "business rule"
// before it is ever accepted. This module reproduces the subset of those rules that the
// deterministic core can check from the computed return + the eligibility facts a preparer
// gathered — the four §6695(g) due-diligence credits (EITC, CTC, AOTC) plus the §26(a)
// limit and the 1040↔schedule tie-outs (in ./tieouts). Each reject flag carries the
// primary-authority citation a preparer would cite on a workpaper: "no citation, no claim."
//
// Model-free by construction: nothing here imports from lib/ai/*. These are pure rules over
// numbers the worksheets (not a model) produced. The reasoning model never reaches this
// code; it only proposes the inputs that the worksheets then turn into the numbers checked
// here.
//
// Primary authority for each rule (verified against the cited free source):
//   • EITC investment-income cap        → IRC §32(i)
//   • EITC SSN-valid-for-work required  → IRC §32(m)
//   • CTC qualifying-child SSN required → IRC §24(h)(7)
//   • AOTC ≤ 4 prior years per student  → IRC §25A(b)(2)(A) (Form 8863 line 23)
//   • Nonrefundable credits ≤ tax       → IRC §26(a)            (./tieouts)
//   • 1040 total ties to subtotals      → Form 1040 instructions (./tieouts)

import type { Citation, Flag, Jurisdiction, WorksheetResult } from "../types";
import { getFigures } from "../figures";
import { tieOutFlags } from "./tieouts";

// ── The validator's input contract ─────────────────────────────────────────────────────
//
// ReturnComputation is the assembled return the validators check. It is deliberately a
// thin, self-contained shape (NOT importing a worksheets/index orchestrator, which is built
// in a later task) so the validators can run the moment the worksheets exist. When the
// runFederal1040 orchestrator lands it produces exactly this shape.

export type ReturnComputation = {
  taxYear: number;
  jurisdiction: Jurisdiction;
  /** Tax liability before any credits (the ceiling for nonrefundable personal credits). */
  taxBeforeCredits: number;
  /** Each nonrefundable credit amount actually claimed on the return, by key. */
  nonRefundableCredits: Record<string, number>;
  /** The worksheet results, by credit, for cross-checking what was claimed. */
  credits: {
    eitc?: WorksheetResult;
    ctc?: WorksheetResult;
    aotc?: WorksheetResult;
  };
  /** 1040 summary-line tie-out: the aggregated total vs. what the return reports. */
  totals?: {
    /** Sum of the schedule subtotals (the correct arithmetic total). */
    totalCredits: number;
    /** The number actually written on the 1040 total-credits line. */
    reportedTotalCredits: number;
  };
  /** This year's values for the fields whose year-over-year swing is monitored. */
  priorYearDeltaInputs?: Record<string, number>;
};

// ValidationFacts are the eligibility facts the worksheet RESULTS don't carry (SSN
// validity, per-child SSN status, per-student prior-year count, prior-year amounts). MeF
// rejects on these even when the arithmetic is correct, so they are validated separately
// from the computed numbers.
export type ValidationFacts = {
  eitc?: {
    investmentIncome: number;
    taxpayerSsnValidForWork: boolean;
    qualifyingChildren: number;
  };
  /** One entry per qualifying child the CTC was claimed for. */
  ctcChildren?: { ssnValidForWork: boolean }[];
  /** One entry per student the AOTC was claimed for. */
  aotcStudents?: { yearsAOTCClaimed: number }[];
  /** Prior-year values for the monitored fields (omit to skip the anomaly check). */
  priorYear?: Record<string, number>;
};

// ── Citations (each verified against the cited free primary source) ─────────────────────

// IRC §24 — the govinfo URL used by the figures store; §24(h)(7) is the child-SSN rule.
const SEC_24_URL =
  "https://www.govinfo.gov/app/details/USCODE-2024-title26/USCODE-2024-title26-subtitleA-chap1-subchapA-partIV-subpartA-sec24";
const SEC_24_H7: Citation = {
  authority: "IRC",
  cite: "IRC §24(h)(7) — qualifying child must have an SSN valid for employment",
  sourceUrl: SEC_24_URL,
};

// IRC §32 — EITC. The investment-income cap (§32(i)) and the SSN rule (§32(m)).
const SEC_32_URL =
  "https://www.govinfo.gov/app/details/USCODE-2024-title26/USCODE-2024-title26-subtitleA-chap1-subchapA-partIV-subpartA-sec32";
const SEC_32_I: Citation = {
  authority: "IRC",
  cite: "IRC §32(i) — EITC denied when disqualified investment income exceeds the limit",
  sourceUrl: SEC_32_URL,
};
const SEC_32_M: Citation = {
  authority: "IRC",
  cite: "IRC §32(m) — taxpayer (and qualifying child) must have an SSN valid for work",
  sourceUrl: SEC_32_URL,
};

// IRC §25A(b)(2)(A) — the American Opportunity Credit 4-year-per-student limit.
const SEC_25A_B2A: Citation = {
  authority: "IRC",
  cite: "IRC §25A(b)(2)(A) — AOTC may not be claimed for a student in any 4 prior taxable years (Form 8863 line 23)",
  sourceUrl:
    "https://www.govinfo.gov/app/details/USCODE-2024-title26/USCODE-2024-title26-subtitleA-chap1-subchapA-partIV-subpartA-sec25A",
};

// AOTC may be claimed for at most 4 tax years per student (the 5th claim — yearsAOTCClaimed
// ≥ this — is rejected). Defined here as a rule constant, not a dollar figure.
const AOTC_MAX_PRIOR_YEARS = 4;

/** True when this credit's worksheet result indicates the credit was actually claimed. */
function wasClaimed(result: WorksheetResult | undefined): boolean {
  return !!result && result.value > 0;
}

/**
 * Run every MeF-reject-style rule + the internal tie-outs against an assembled return.
 *
 * Deterministic and pure: same inputs → same flags, no I/O, no model. Returns the full
 * Flag[] (reject + review + info); the caller decides what blocks filing. Every `reject`
 * flag carries a resolvable citation.
 */
export function validateReturn(computation: ReturnComputation, facts: ValidationFacts): Flag[] {
  const flags: Flag[] = [];

  // Touch the figures registry so the validator throws on an unknown year/jurisdiction
  // rather than validating against figures that don't exist (defensive; keeps the
  // validator honest about which year's rules it is enforcing).
  if (computation.jurisdiction === "federal") {
    getFigures(computation.taxYear, "federal");
  }

  // ── EITC rules (only when the EITC was actually claimed) ──
  if (wasClaimed(computation.credits.eitc) && facts.eitc) {
    const e = facts.eitc;
    const limit = getFigures(computation.taxYear, "federal").eitc.investmentIncomeLimit;

    // §32(i): disqualified investment income strictly over the limit denies the credit.
    if (e.investmentIncome > limit.value) {
      flags.push({
        code: "EITC_INVESTMENT_INCOME",
        severity: "reject",
        message: `EITC claimed but investment income (${e.investmentIncome}) exceeds the limit (${limit.value}); the EITC is not allowed (IRC §32(i)).`,
        citation: SEC_32_I,
      });
    }

    // §32(m): the taxpayer must have an SSN valid for work to claim the EITC.
    if (!e.taxpayerSsnValidForWork) {
      flags.push({
        code: "EITC_SSN_INVALID",
        severity: "reject",
        message: "EITC claimed but the taxpayer does not have an SSN valid for work (IRC §32(m)). An ITIN cannot be used to claim the EITC.",
        citation: SEC_32_M,
      });
    }
  }

  // ── CTC rule: every qualifying child the CTC is claimed for needs a work-valid SSN ──
  if (wasClaimed(computation.credits.ctc) && facts.ctcChildren) {
    facts.ctcChildren.forEach((child, i) => {
      if (!child.ssnValidForWork) {
        flags.push({
          code: "CTC_CHILD_SSN_REQUIRED",
          severity: "reject",
          message: `Child Tax Credit claimed for child #${i + 1}, but that child does not have an SSN valid for employment issued before the return due date; the CTC ($2,200) is not allowed for that child (IRC §24(h)(7)). (The $500 credit for other dependents may apply instead.)`,
          citation: SEC_24_H7,
        });
      }
    });
  }

  // ── AOTC rule: at most 4 prior years claimed per student (the 5th is rejected) ──
  if (facts.aotcStudents) {
    facts.aotcStudents.forEach((student, i) => {
      if (student.yearsAOTCClaimed >= AOTC_MAX_PRIOR_YEARS) {
        flags.push({
          code: "AOTC_YEARS_EXCEEDED",
          severity: "reject",
          message: `AOTC student #${i + 1} has already been claimed for ${student.yearsAOTCClaimed} prior years; the American Opportunity Credit is allowed for at most ${AOTC_MAX_PRIOR_YEARS} taxable years per student (IRC §25A(b)(2)(A); Form 8863 line 23).`,
          citation: SEC_25A_B2A,
        });
      }
    });
  }

  // ── Internal tie-outs + prior-year anomaly (./tieouts) ──
  flags.push(...tieOutFlags(computation, facts));

  return flags;
}
