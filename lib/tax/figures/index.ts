// Figure registry — getFigures(year, jurisdiction) is the single deterministic lookup
// the worksheets use. Figures are versioned by (year, jurisdiction); a missing key
// throws rather than silently falling back, so a worksheet never computes against the
// wrong year's constants.
//
// Overloads keep the return type jurisdiction-specific: getFigures(..., "federal")
// returns a FederalFigureSet, getFigures(..., "CA") returns a CaliforniaFigureSet.

import type { Jurisdiction } from "../types";
import { FEDERAL_2025, type FederalFigureSet } from "./federal-2025";
import { CALIFORNIA_2025, type CaliforniaFigureSet } from "./california-2025";

type AnyFigureSet = FederalFigureSet | CaliforniaFigureSet;

const REGISTRY: Record<string, AnyFigureSet> = {
  "federal:2025": FEDERAL_2025,
  "CA:2025": CALIFORNIA_2025,
};

const key = (year: number, jurisdiction: Jurisdiction) => `${jurisdiction}:${year}`;

function lookup(taxYear: number, jurisdiction: Jurisdiction): AnyFigureSet {
  const set = REGISTRY[key(taxYear, jurisdiction)];
  if (!set) {
    throw new Error(
      `No tax figures for ${jurisdiction} ${taxYear}. Available: ${Object.keys(REGISTRY).join(", ")}. ` +
        `Figures must be added (cited + verified) before the engine can compute for a new year/jurisdiction.`,
    );
  }
  return set;
}

export function getFigures(taxYear: number, jurisdiction: "federal"): FederalFigureSet;
export function getFigures(taxYear: number, jurisdiction: "CA"): CaliforniaFigureSet;
export function getFigures(taxYear: number, jurisdiction: Jurisdiction): AnyFigureSet;
export function getFigures(taxYear: number, jurisdiction: Jurisdiction): AnyFigureSet {
  return lookup(taxYear, jurisdiction);
}

export type { FederalFigureSet, EitcParams } from "./federal-2025";
export type { CaliforniaFigureSet, CalEitcParams } from "./california-2025";
