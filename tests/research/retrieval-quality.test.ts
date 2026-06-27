// MODEL-FREE RETRIEVAL-QUALITY HARNESS. Measures whether retrieve() ranks the EXPECTED authority into the
// top-k for the REAL benchmark questions (the entity golden set) — no model, no codex, so it's a fast,
// deterministic regression guard for any change to the ranking/scoring in lib/tax/authority/store.ts.
// Using the real test questions (not queries written to match keywords) keeps this honest, not overfit.
import { describe, it, expect } from "vitest";
import { retrieve } from "../../lib/tax/authority/store";
import { ENTITY_CASES } from "./golden/entity";

const K = 3; // what the engine actually sees

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// For each answer-case with an expected authority, does retrieve() surface that authority in the top-3?
function retrievesExpectedAuthority(c: (typeof ENTITY_CASES)[number]): boolean {
  if (c.expectedBucket !== "answer" || !c.mustCiteAuthorityLike) return true; // not a retrieval target
  const hits = retrieve(c.question, { taxYear: c.taxYear, jurisdiction: c.jurisdiction, k: K });
  const want = norm(c.mustCiteAuthorityLike);
  return hits.some((h) => norm(h.citation).includes(want));
}

describe("retrieval quality — expected authority in the top-3 for the real entity questions", () => {
  const targets = ENTITY_CASES.filter((c) => c.expectedBucket === "answer" && c.mustCiteAuthorityLike);
  const passed = targets.filter(retrievesExpectedAuthority);
  const misses = targets.filter((c) => !retrievesExpectedAuthority(c)).map((c) => c.id);

  it(`ranks the expected authority top-${K} for the entity set (floor guards against ranking regressions)`, () => {
    // Recorded baseline: this floor must NEVER drop on a ranking/scoring change. Raise it as retrieval improves.
    // (Logged so a regression shows exactly which questions lost their authority from the top-3.)
    console.log(`retrieval-quality: ${passed.length}/${targets.length} entity authorities ranked top-${K}` + (misses.length ? `; misses: ${misses.join(", ")}` : " (all)"));
    expect(passed.length, `expected authority should rank top-${K} for the entity set; misses: ${misses.join(", ")}`).toBeGreaterThanOrEqual(28);
  });
});
