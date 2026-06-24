// OBBBA (P.L. 119-21, July 4, 2025) structured figures for the four temporary/limited
// individual provisions added by the One Big Beautiful Bill Act, as typed Figure<T> records.
//
// Model-free by construction: every dollar amount / rate / threshold below was confirmed
// THIS RUN against PRIMARY authority — the enrolled text of Public Law 119-21 (congress.gov)
// and the IRS newsroom implementation guidance on irs.gov — NOT recalled by a model. The
// same figures live as prose in lib/research/corpus-obbba.ts; here they are DATA the
// deterministic worksheets compute against. `verified:true` means the value was read off the
// cited primary source in this session.
//
// These provisions are year-aware: SALT (§70120) has distinct 2025 vs 2026 amounts, and the
// three deductions (§70201 tips, §70202 overtime, §70103 senior) run 2025-2028 with fixed
// statutory caps. getObbbaFigures(taxYear) returns the right snapshot or throws.

import type { Citation, Figure, FilingStatus, Jurisdiction } from "../types";

const J: Jurisdiction = "federal";

// Official, free PRIMARY-source URLs (mirrors lib/research/corpus-obbba.ts).
const URL_PL = "https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf";
const URL_SALT_IRS = "https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill";
const URL_WORKERS_SENIORS = "https://www.irs.gov/newsroom/one-big-beautiful-bill-act-tax-deductions-for-working-americans-and-seniors";
const URL_OT_QA = "https://www.irs.gov/newsroom/questions-and-answers-about-the-new-deduction-for-qualified-overtime-compensation";
const URL_SENIOR = "https://www.irs.gov/newsroom/check-your-eligibility-for-the-new-enhanced-deduction-for-seniors";
const URL_CAR_LOAN = "https://www.irs.gov/newsroom/treasury-irs-provide-guidance-on-the-new-deduction-for-car-loan-interest-under-the-one-big-beautiful-bill";

const cite = (authority: string, c: string, sourceUrl: string): Citation => ({ authority, cite: c, sourceUrl });

// Builder pinned to a tax year (SALT figures differ 2025 vs 2026).
function fig<T>(taxYear: number, value: T, citation: Citation, verified = true): Figure<T> {
  return { value, taxYear, jurisdiction: J, citation, verified, effectiveFrom: "2025-01-01" };
}

// ── §70120 SALT cap (IRC §164(b)(6),(7)) ──
// Applicable limitation amount: $40,000 (2025) / $40,400 (2026); reduced by 30% of MAGI over
// a threshold ($500,000 in 2025; $505,000 in 2026); never below the $10,000 floor.
export type SaltCapFigures = {
  applicableLimitation: Figure<number>; // base cap before phase-down
  phaseDownThreshold: Figure<number>; // MAGI above which the 30% reduction applies
  phaseDownRate: Figure<number>; // 0.30 (statutory, not indexed)
  floor: Figure<number>; // the reduction can never push the cap below this
  floorMFS: Figure<number>; // §164(b)(6) MFS gets half the floor
};

// ── §70201 tips / §70202 overtime / §70103 senior — common above-the-line caps + phase-outs ──
export type TipsFigures = {
  cap: Figure<number>; // $25,000
  phaseOutThreshold: Record<"default" | "mfj", Figure<number>>; // $150k / $300k
  phaseOutPer1000: Figure<number>; // $100 per $1,000 over threshold
};
export type OvertimeFigures = {
  cap: Figure<number>; // $12,500
  capMFJ: Figure<number>; // $25,000
  phaseOutThreshold: Record<"default" | "mfj", Figure<number>>; // $150k / $300k
  phaseOutPer1000: Figure<number>; // $100 per $1,000 over threshold
};
export type CarLoanFigures = {
  cap: Figure<number>; // $10,000 max interest deductible
  phaseOutThreshold: Record<"default" | "mfj", Figure<number>>; // $100k / $200k MAGI
  phaseOutPer1000: Figure<number>; // $200 per $1,000 of MAGI over threshold
};
export type SeniorFigures = {
  perIndividual: Figure<number>; // $6,000 per qualifying individual age 65+
  phaseOutThreshold: Record<"default" | "mfj", Figure<number>>; // $75k / $150k
  phaseOutRate: Figure<number>; // 0.06 (6% of MAGI over threshold)
};

export type ObbbaFigureSet = {
  taxYear: number;
  jurisdiction: Jurisdiction;
  saltCap: SaltCapFigures;
  tips: TipsFigures;
  overtime: OvertimeFigures;
  senior: SeniorFigures;
  carLoan: CarLoanFigures;
};

// Statuses that use the "married/joint" thresholds for the tips/overtime/senior phase-outs.
// OBBBA keys these off "joint return" — MFJ and the qualifying surviving spouse (QSS) file a
// joint-style return. MFS does NOT (and §224/§225/§151(d)(5)(C) require MFJ to claim at all,
// enforced in the worksheets).
export const JOINT_RETURN_STATUSES: ReadonlySet<FilingStatus> = new Set<FilingStatus>(["mfj", "qss"]);

// cite(authority, cite, sourceUrl): authority = coarse family (IRC / IRS), cite = the section
// string a preparer writes on a workpaper. (Earlier these had the two swapped, so the Sources
// chips showed prose; corrected so they render the clean cite.)
const saltCite = cite("IRC", "IRC §164(b)(6),(7) (OBBBA §70120)", URL_PL);
const saltIrsCite = cite("IRS", "IRS guidance — SALT cap (OBBBA §70120)", URL_SALT_IRS);
const tipsCite = cite("IRC", "IRC §224 (OBBBA §70201)", URL_PL);
const tipsIrsCite = cite("IRS", "IRS guidance — no tax on tips (OBBBA §70201)", URL_WORKERS_SENIORS);
const otCite = cite("IRC", "IRC §225 (OBBBA §70202)", URL_PL);
const otIrsCite = cite("IRS", "IRS guidance — no tax on overtime (OBBBA §70202)", URL_OT_QA);
const seniorCite = cite("IRC", "IRC §151(d)(5)(C) (OBBBA §70103)", URL_PL);
const seniorIrsCite = cite("IRS", "IRS guidance — enhanced senior deduction (OBBBA §70103)", URL_SENIOR);
// NOTE: cite() is cite(authority, cite, sourceUrl). The sibling OBBBA cites above put the section
// string in `authority` and a prose description in `cite` (a pre-existing swap — flagged for a
// follow-up sweep). car-loan uses the CORRECT convention so its Source chip renders the clean cite.
const carLoanCite = cite(
  "IRC", // authority = coarse family
  "IRC §163(h)(4)(A) (OBBBA, P.L. 119-21)", // cite = the section string the preparer writes
  URL_CAR_LOAN,
);

// Tips/overtime/senior caps + phase-out rates are FIXED by statute (not indexed) for 2025-2028,
// so the three deduction blocks are identical across those years. SALT differs by year.
function deductionBlocks(taxYear: number): Pick<ObbbaFigureSet, "tips" | "overtime" | "senior" | "carLoan"> {
  return {
    tips: {
      cap: fig(taxYear, 25000, tipsCite),
      phaseOutThreshold: {
        default: fig(taxYear, 150000, tipsIrsCite),
        mfj: fig(taxYear, 300000, tipsIrsCite),
      },
      phaseOutPer1000: fig(taxYear, 100, tipsCite),
    },
    overtime: {
      cap: fig(taxYear, 12500, otCite),
      capMFJ: fig(taxYear, 25000, otCite),
      phaseOutThreshold: {
        default: fig(taxYear, 150000, otIrsCite),
        mfj: fig(taxYear, 300000, otIrsCite),
      },
      phaseOutPer1000: fig(taxYear, 100, otCite),
    },
    senior: {
      perIndividual: fig(taxYear, 6000, seniorCite),
      phaseOutThreshold: {
        default: fig(taxYear, 75000, seniorIrsCite),
        mfj: fig(taxYear, 150000, seniorIrsCite),
      },
      phaseOutRate: fig(taxYear, 0.06, seniorCite),
    },
    carLoan: {
      cap: fig(taxYear, 10000, carLoanCite),
      phaseOutThreshold: {
        default: fig(taxYear, 100000, carLoanCite),
        mfj: fig(taxYear, 200000, carLoanCite),
      },
      phaseOutPer1000: fig(taxYear, 200, carLoanCite),
    },
  };
}

export const OBBBA_2025: ObbbaFigureSet = {
  taxYear: 2025,
  jurisdiction: J,
  saltCap: {
    applicableLimitation: fig(2025, 40000, saltIrsCite),
    phaseDownThreshold: fig(2025, 500000, saltCite),
    phaseDownRate: fig(2025, 0.3, saltCite),
    floor: fig(2025, 10000, saltCite),
    floorMFS: fig(2025, 5000, saltCite),
  },
  ...deductionBlocks(2025),
};

export const OBBBA_2026: ObbbaFigureSet = {
  taxYear: 2026,
  jurisdiction: J,
  saltCap: {
    applicableLimitation: fig(2026, 40400, saltIrsCite),
    phaseDownThreshold: fig(2026, 505000, saltCite),
    phaseDownRate: fig(2026, 0.3, saltCite),
    floor: fig(2026, 10000, saltCite),
    floorMFS: fig(2026, 5000, saltCite),
  },
  ...deductionBlocks(2026),
};

const OBBBA_REGISTRY: Record<number, ObbbaFigureSet> = {
  2025: OBBBA_2025,
  2026: OBBBA_2026,
};

// Deterministic lookup — a missing year throws rather than silently computing against the
// wrong constants (mirrors getFigures in figures/index.ts).
export function getObbbaFigures(taxYear: number): ObbbaFigureSet {
  const set = OBBBA_REGISTRY[taxYear];
  if (!set) {
    throw new Error(
      `No OBBBA figures for tax year ${taxYear}. Available: ${Object.keys(OBBBA_REGISTRY).join(", ")}. ` +
        `OBBBA figures (cited + verified) must be added before the engine can compute for a new year.`,
    );
  }
  return set;
}

// Years for which the three temporary deductions (tips §224 / overtime §225 / senior §151(d)(5)(C))
// are operative. They terminate for tax years beginning after Dec 31, 2028.
export const OBBBA_DEDUCTION_YEARS: ReadonlySet<number> = new Set([2025, 2026, 2027, 2028]);
