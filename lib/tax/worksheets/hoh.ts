// Head-of-Household qualification — the §2(b) filing-status test, expressed as the
// §6695(g) due-diligence determination Petal must defend for any HoH return. This is a
// boolean determination, NOT a dollar amount, so it returns { qualifies, flags } rather
// than a WorksheetResult (there is no figure to compute — only a status conclusion).
//
// Model-free by construction: nothing here imports from lib/ai/*. No tax figure is read
// because §2(b) status turns on facts, not on an inflation-indexed constant.
//
// Source transcribed: IRC §2(b)(1) — "Definition of head of household." An individual is
// a head of household if, AND ONLY IF, such individual is not married at the close of the
// taxable year, is not a surviving spouse (§2(a)), and EITHER (A) maintains as his home a
// household which constitutes for more than one-half of the taxable year the principal
// place of abode of a qualifying child or a dependent qualifying relative, OR (B) maintains
// a household for a qualifying parent. §2(b)(1) flush language further requires that the
// taxpayer furnish over half the cost of maintaining the household. §2(c) treats a married
// individual living apart (per §7703(b)) as "not married" — captured by the
// `unmarriedOrConsideredUnmarried` fact. We model the three operative prongs the preparer
// must verify for due diligence: (i) unmarried/considered-unmarried, (ii) >½ cost of the
// home, (iii) a qualifying person had that home as their principal place of abode.

import type { Citation, Flag } from "../types";

// IRC §2(b), Title 26 U.S. Code — official free text on govinfo.gov.
const SEC_2B: Citation = {
  authority: "IRC",
  cite: "IRC §2(b)(1) — head of household",
  sourceUrl:
    "https://www.govinfo.gov/app/details/USCODE-2024-title26/USCODE-2024-title26-subtitleA-chap1-subchapA-partI-sec2",
};

export type HohFacts = {
  // §2(b)(1)/§2(c): not married at year-end, or "considered unmarried" (lived apart per §7703(b)).
  unmarriedOrConsideredUnmarried: boolean;
  // §2(b)(1) flush language: the taxpayer furnished more than one-half the cost of maintaining the home.
  paidMoreThanHalfHomeCost: boolean;
  // §2(b)(1)(A): a qualifying child / dependent qualifying relative had the home as their
  // principal place of abode for more than half the year (the §2(b)(3) exclusions are assumed handled upstream).
  qualifyingPerson: boolean;
};

export type HohResult = {
  qualifies: boolean;
  flags: Flag[];
};

// Each prong, with the info flag emitted when it FAILS. The message names the failed prong
// so a preparer's §6695(g) workpaper records exactly which §2(b) requirement was not met.
const PRONGS: ReadonlyArray<{
  key: keyof HohFacts;
  code: string;
  message: string;
}> = [
  {
    key: "unmarriedOrConsideredUnmarried",
    code: "HOH_NOT_UNMARRIED",
    message:
      "Head-of-household fails IRC §2(b)(1): the taxpayer was married at year-end and is not 'considered unmarried' under §2(c)/§7703(b).",
  },
  {
    key: "paidMoreThanHalfHomeCost",
    code: "HOH_NOT_HALF_COST",
    message:
      "Head-of-household fails IRC §2(b)(1): the taxpayer did not furnish more than one-half the cost of maintaining the household.",
  },
  {
    key: "qualifyingPerson",
    code: "HOH_NO_QUALIFYING_PERSON",
    message:
      "Head-of-household fails IRC §2(b)(1)(A): no qualifying person had the taxpayer's home as their principal place of abode for more than half the year.",
  },
];

/**
 * §2(b) head-of-household qualification (the §6695(g) due-diligence determination).
 * Qualifies if, and only if, ALL three statutory prongs hold. Every failed prong emits an
 * `info` flag carrying the §2(b) citation, so the determination is auditable and never
 * asserts a conclusion without authority ("no citation, no claim").
 */
export function headOfHousehold(facts: HohFacts): HohResult {
  const flags: Flag[] = [];

  for (const prong of PRONGS) {
    if (!facts[prong.key]) {
      flags.push({
        code: prong.code,
        severity: "info",
        message: prong.message,
        citation: SEC_2B,
      });
    }
  }

  return { qualifies: flags.length === 0, flags };
}
