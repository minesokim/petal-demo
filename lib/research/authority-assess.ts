// Bridge the engine's grounded AuthorityChunks to the §6662 weight-of-authorities engine — the LIVE
// consumer that turns weighAuthorities() from dead code into a real signal on every answer.
//
// HONESTY CAP (the load-bearing rule): "more-likely-than-not" is a >50% standard that requires weighing
// support against a COMPREHENSIVE contrary-authority search. Petal does not yet automate that search and
// runs on a thin corpus, so asserting MLTN would manufacture confidence the corpus cannot defend — the
// exact failure the calibration layer exists to prevent. Until a contra search is wired (opts.contraSearched),
// the surfaced standard is CAPPED at "substantial-authority". The genuinely defensible signals flow through
// uncapped: Form 8275 disclosure when support is non-precedential-only (INVARIANT 2), and a dropped standard
// when a contrary controlling holding IS found.
import { weighAuthorities, type WeighedAuthority, type WeightOfAuthorities } from "@/lib/tax/authority/weighting";
import type { AuthorityChunk } from "@/lib/tax/authority/store";

export type AuthorityAssessment = {
  standard: WeightOfAuthorities["standard"];
  disclosureRecommended: boolean;
  controllingContra: boolean;
  rationale: string;
  /** Honesty boundary: what was actually weighed, so the standard is never read as more than it is. */
  scopeNote: string;
};

function toWeighed(c: AuthorityChunk, stance: "for" | "against"): WeighedAuthority {
  return {
    citation: c.citation,
    authorityType: c.authorityType,
    stance,
    precedential: c.precedential,
    authorityClass: c.authorityClass,
    delegationBasis: c.delegationBasis,
    courtLevel: c.courtLevel,
    circuit: c.circuit,
  };
}

/**
 * Honest §6662 assessment over the engine's grounded (support) authorities plus any found contrary
 * authority. Pure + deterministic. With no comprehensive contra search (the default), the standard is
 * capped at "substantial-authority" — never "more-likely-than-not" — and the scope note says so.
 */
export function assessAuthorityWeight(
  support: AuthorityChunk[],
  contra: AuthorityChunk[] = [],
  opts: { circuit?: string; contraSearched?: boolean } = {},
): AuthorityAssessment {
  const authorities = [
    ...support.map((c) => toWeighed(c, "for")),
    ...contra.map((c) => toWeighed(c, "against")),
  ];
  const w = weighAuthorities(authorities, { circuit: opts.circuit });
  // Honesty cap: do not claim MLTN without a real contrary-authority search.
  const standard = w.standard === "more-likely-than-not" && !opts.contraSearched ? "substantial-authority" : w.standard;
  const scopeNote = opts.contraSearched
    ? "Weighed supporting vs contrary authority within Petal's corpus."
    : "Reflects SUPPORTING authority within Petal's corpus; an automated contrary-authority search is not yet wired, so the standard is capped at 'substantial authority' (never 'more likely than not'). A preparer must confirm no contrary controlling authority applies.";
  return {
    standard,
    disclosureRecommended: w.disclosureRecommended,
    controllingContra: w.controllingContra,
    rationale: w.rationale,
    scopeNote,
  };
}
