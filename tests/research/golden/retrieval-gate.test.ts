import { describe, it, expect } from "vitest";
import { GOLDEN_CASES } from "./cases";
import { retrieve, REGISTERED_CORPUS } from "@/lib/tax/authority/store";

// DETERMINISTIC RECALL GATE (the per-PR half of the moat gate). The full measured error rate needs a live
// model (slow/nondeterministic/costly → a periodic keyed run, see scripts/eval-gate.mts). But the most
// common regression is mechanical and MODEL-FREE: a corpus edit or keyword change that makes a settled
// answer-case's authority un-retrievable, so the engine silently abstains. This gate catches that class in
// CI with zero model calls: for every ANSWER case that pins a required authority, retrieve() (at the
// engine's k) MUST surface a chunk whose citation contains that authority substring. A drop here fails the
// build — the corpus can no longer silently lose recall on a case it is supposed to answer.
//
// EXEMPT: a small allowlist of answer-cases NOT answered by direct corpus retrieve() — reached instead via
// the LIFECYCLE fallback (a sunset/effective-range provision the point-in-time year filter correctly
// excludes) or a LIVE fetch (the "third door"). Each must be justified; the list cannot grow silently to
// hide a real recall regression.
const NOT_DIRECTLY_RETRIEVED = new Set<string>([
  // §70201 (tips deduction) SUNSETS after 2028, so its chunk's tax_years exclude 2029 and retrieve()
  // correctly returns it nothing for TY2029; the engine answers "expired after 2028" via retrieveLifecycle
  // (which surfaces the §70201 sunset chunk). Answered, just not by the year-filtered direct path.
  "tips-deduction-sunset-2029",
]);

const K = 4; // the engine's default retrieval k (researchAnswer opts.k)

describe("deterministic recall gate — every answer-case's authority is retrievable", () => {
  const answerCases = GOLDEN_CASES.filter(
    (c) => c.expectedBucket === "answer" && c.mustCiteAuthorityLike && !NOT_DIRECTLY_RETRIEVED.has(c.id),
  );

  it("retrieves at least one matching authority for EVERY corpus-backed answer-case (no silent recall loss)", () => {
    const missed: string[] = [];
    for (const c of answerCases) {
      const hits = retrieve(c.question, { taxYear: c.taxYear, jurisdiction: c.jurisdiction, k: K }, REGISTERED_CORPUS);
      const found = hits.some((h) => h.citation.toLowerCase().includes(c.mustCiteAuthorityLike!.toLowerCase()));
      if (!found) missed.push(`${c.id} (needs "${c.mustCiteAuthorityLike}", got: ${hits.map((h) => h.citation.split(",")[0]).join(" | ") || "<empty>"})`);
    }
    expect(missed, `answer-cases whose required authority is NOT retrievable (corpus/keyword regression)`).toEqual([]);
  });

  it("guards the gate itself: there ARE corpus-backed answer-cases to check (the gate cannot be vacuous)", () => {
    expect(answerCases.length).toBeGreaterThanOrEqual(30);
  });
});
