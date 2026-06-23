// Figure registry — getFigures(year, jurisdiction) is the single deterministic lookup
// the worksheets use. Figures are versioned by (year, jurisdiction); a missing key
// throws rather than silently falling back, so a worksheet never computes against the
// wrong year's constants.

import type { Jurisdiction } from "../types";
import { FEDERAL_2025, type FederalFigureSet } from "./federal-2025";

const REGISTRY: Record<string, FederalFigureSet> = {
  "federal:2025": FEDERAL_2025,
};

const key = (year: number, jurisdiction: Jurisdiction) => `${jurisdiction}:${year}`;

export function getFigures(taxYear: number, jurisdiction: Jurisdiction): FederalFigureSet {
  const set = REGISTRY[key(taxYear, jurisdiction)];
  if (!set) {
    throw new Error(
      `No tax figures for ${jurisdiction} ${taxYear}. Available: ${Object.keys(REGISTRY).join(", ")}. ` +
        `Figures must be added (cited + verified) before the engine can compute for a new year/jurisdiction.`,
    );
  }
  return set;
}

export type { FederalFigureSet, EitcParams } from "./federal-2025";
