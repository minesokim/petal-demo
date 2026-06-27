// PREMISE GATE — the librarian audit's "only architectural HOLE." A tax conclusion C = f(legal_rule R,
// external_state S): the engine grounds the RULE (cited authority), but can silently ASSUME the external
// state S from stale training and be confidently wrong (the §280E cannabis miss — the answer turned on
// marijuana's Title-21 CSA schedule, a fact outside the tax corpus). This promotes those load-bearing
// premises to first-class, code-gated objects: when an answer rests on a premise that is EXTERNAL (a non-tax
// / out-of-corpus fact) or TIME-SENSITIVE (depends on a current status that can change) AND is OUTCOME-
// DETERMINATIVE AND was NOT grounded in a cited authority, the engine must HEDGE on it rather than assert —
// "cited, grounded, abstaining" extended one level up, from the rule to the predicate the rule rests on.

// The Premise SHAPE lives with the rest of the reasoning contract (lib/ai/schema); this module owns the GATE
// LOGIC over it. Re-exported here so callers of the gate get the type from one import.
export type { Premise } from "@/lib/ai/schema";
import type { Premise } from "@/lib/ai/schema";

/**
 * Returns the FIRST load-bearing premise that forces a hedge, or null if none does. A premise forces a hedge
 * when it is outcome-determinative AND (external OR time-sensitive) AND NOT grounded: the engine cannot vouch
 * for a fact outside its cited authority, so asserting on it would be the §280E-class "confidently wrong on
 * an external premise." Conservative by construction — a grounded premise, or a non-determinative one, or a
 * purely in-corpus static one, never trips the gate, so settled-law answers (whose premise IS the cited
 * statute) are untouched.
 */
export function hedgeForcingPremise(premises: Premise[] | undefined | null): Premise | null {
  if (!premises?.length) return null;
  return premises.find((p) => p.outcomeDeterminative && (p.external || p.timeSensitive) && !p.grounded) ?? null;
}
