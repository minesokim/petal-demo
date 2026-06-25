// ── §6662 WEIGHT-OF-AUTHORITIES ENGINE (deterministic, model-free) ──────────────────────────────
// The goal's defensibility hinge: confidence in a tax position is the WEIGHT of supporting vs
// contrary authority under Treas. Reg. §1.6662-4(d)(3)(iii), NOT a hand-rolled linear tier and NOT
// the model's self-report. This is a pure function over typed authorities → a substantial-authority
// standard + a Form 8275 disclosure recommendation. The HARD INVARIANTS are load-bearing law, not
// tunables; the numeric weights are a documented v1 (an EA tunes them against the golden set later).
//
// HARD INVARIANTS encoded here:
//  (1) A ruling / PLR / TAM / non-precedential opinion NEVER outweighs a CONTRARY CONTROLLING
//      in-circuit holding. (post-Loper-Bright: a court holding controls over agency interpretation.)
//  (2) A Summary Opinion / PLR / TAM is NEVER sole "substantial authority" — if the only support is
//      non-precedential, the standard caps at "reasonable basis" (disclosure recommended).
//  (3) Post-Loper-Bright: a §7805-general (interpretive) reg is weighted BELOW an express-delegation
//      reg and does NOT auto-win against a strong contrary in-circuit holding.

import type { AuthorityType } from "./store";

export type AuthorityStance = "for" | "against";

// The weighting inputs — a subset of AuthorityChunk's metadata (the fields added in the spine).
export type WeighedAuthority = {
  citation: string;
  authorityType: AuthorityType;
  stance: AuthorityStance;
  precedential?: boolean; // false ⇒ PLR/TAM/Summary Opinion — never sole substantial authority
  authorityClass?: number; // lower = stronger; overrides the kind default when present
  delegationBasis?: "express" | "general_7805" | "skidmore"; // for regulations
  courtLevel?: "tax" | "district" | "circuit" | "supreme"; // for cases
  circuit?: string; // the case's circuit (for in-circuit controlling-holding analysis)
};

export type SubstantialAuthorityStandard =
  | "more-likely-than-not" // > 50%: supporting weight clearly exceeds contrary
  | "substantial-authority" // ~40%: substantial support, no contrary controlling holding
  | "reasonable-basis" // ~20%: some authority, but weak / only non-precedential
  | "no-substantial-authority"; // contradicted by controlling authority or unsupported

export type WeightOfAuthorities = {
  standard: SubstantialAuthorityStandard;
  forWeight: number;
  againstWeight: number;
  disclosureRecommended: boolean; // Form 8275 — below substantial authority
  controllingContra: boolean; // a precedential, in-circuit (or higher-court) holding AGAINST
  soleSupportNonPrecedential: boolean; // the only support is PLR/TAM/Summary → never sole substantial authority
  rationale: string;
  invariantsApplied: string[];
};

// Coarse base weight per KIND, anchored to the §1.6662-4(d)(3)(iii) hierarchy (statute strongest).
// authorityClass overrides when present (lower class = stronger → higher weight).
const KIND_WEIGHT: Record<AuthorityType, number> = {
  statute: 100,
  regulation: 90,
  case: 70,
  irs_guidance: 45,
  form_instruction: 20,
};

// Post-Loper-Bright delegation factor for regulations: an express-delegation reg keeps full weight; a
// §7805-general interpretive reg is more contestable; Skidmore-only is weakest.
const DELEGATION_FACTOR: Record<NonNullable<WeighedAuthority["delegationBasis"]>, number> = {
  express: 1.0,
  general_7805: 0.7,
  skidmore: 0.5,
};

function weightOf(a: WeighedAuthority): number {
  let w = typeof a.authorityClass === "number" ? Math.max(10, 110 - a.authorityClass * 10) : KIND_WEIGHT[a.authorityType];
  if (a.authorityType === "regulation" && a.delegationBasis) w *= DELEGATION_FACTOR[a.delegationBasis];
  // A non-precedential item (PLR/TAM/Summary Opinion) is informative but weak — never carries the day.
  if (a.precedential === false) w *= 0.35;
  // A higher court carries more weight than the Tax Court for the same holding.
  if (a.authorityType === "case" && a.courtLevel) {
    w *= a.courtLevel === "supreme" ? 1.3 : a.courtLevel === "circuit" ? 1.15 : 1.0;
  }
  return w;
}

// A CONTROLLING holding against the position: a precedential case at the circuit/supreme level (or a
// precedential Tax Court Division opinion) on the "against" side. (Circuit-specificity is honored when
// the caller supplies the taxpayer's circuit; absent that, a precedential circuit/supreme holding is
// treated as controlling — the conservative reading.)
function isControllingContra(a: WeighedAuthority, taxpayerCircuit?: string): boolean {
  if (a.stance !== "against" || a.authorityType !== "case" || a.precedential === false) return false;
  if (a.courtLevel === "supreme") return true;
  if (a.courtLevel === "circuit") return !taxpayerCircuit || !a.circuit || a.circuit === taxpayerCircuit;
  if (a.courtLevel === "tax") return true; // a precedential T.C. Division opinion binds nationally
  return false;
}

/**
 * Compute the §6662 weight-of-authorities standard for a position. Pure + deterministic. `opts.circuit`
 * is the taxpayer's circuit (for the in-circuit controlling-holding test); omit for the conservative read.
 */
export function weighAuthorities(
  authorities: WeighedAuthority[],
  opts: { circuit?: string } = {},
): WeightOfAuthorities {
  const fors = authorities.filter((a) => a.stance === "for");
  const againsts = authorities.filter((a) => a.stance === "against");
  const forWeight = round(fors.reduce((s, a) => s + weightOf(a), 0));
  const againstWeight = round(againsts.reduce((s, a) => s + weightOf(a), 0));

  const controllingContra = againsts.some((a) => isControllingContra(a, opts.circuit));
  const soleSupportNonPrecedential = fors.length > 0 && fors.every((a) => a.precedential === false);
  const invariantsApplied: string[] = [];

  let standard: SubstantialAuthorityStandard;
  let rationale: string;

  if (fors.length === 0) {
    standard = "no-substantial-authority";
    rationale = "No supporting authority for the position.";
  } else if (controllingContra) {
    // INVARIANT 1: a contrary controlling in-circuit holding is not outweighed by rulings/regs.
    invariantsApplied.push("ruling/reg cannot outweigh a contrary controlling in-circuit holding (§1.6662-4)");
    standard = forWeight > againstWeight * 1.25 ? "reasonable-basis" : "no-substantial-authority";
    rationale = "A controlling holding cuts against the position; supporting authority cannot overcome it.";
  } else if (soleSupportNonPrecedential) {
    // INVARIANT 2: a Summary Opinion / PLR / TAM is never sole substantial authority.
    invariantsApplied.push("a Summary Opinion / PLR / TAM is never SOLE substantial authority");
    standard = "reasonable-basis";
    rationale = "Only non-precedential authority (PLR/TAM/Summary Opinion) supports the position.";
  } else if (forWeight > againstWeight * 1.5) {
    standard = "more-likely-than-not";
    rationale = "Supporting authority clearly outweighs contrary authority.";
  } else if (forWeight >= againstWeight) {
    standard = "substantial-authority";
    rationale = "Substantial authority supports the position with no contrary controlling holding.";
  } else {
    standard = "reasonable-basis";
    rationale = "Some authority supports the position but contrary authority is weightier.";
  }

  // Form 8275 disclosure: recommended below "substantial authority" (it cures the §6662 penalty where
  // a reasonable basis exists; a no-substantial-authority position is flagged as high-risk).
  const disclosureRecommended = standard === "reasonable-basis" || standard === "no-substantial-authority";

  return { standard, forWeight, againstWeight, disclosureRecommended, controllingContra, soleSupportNonPrecedential, rationale, invariantsApplied };
}

const round = (n: number) => Math.round(n * 10) / 10;
