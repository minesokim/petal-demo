// GOLDEN EVAL HARNESS — the grader (tests/research/golden/grade.ts)
//
// gradeAnswer(answer, testCase) is a PURE function: same inputs → same {pass, reasons}.
// It is deliberately decoupled from the live orchestrator's TaxAnswer shape so the engine can
// be plugged in later behind a thin adapter. All it needs from a candidate answer is:
//   - bucket: which observable shape the engine produced (answer | hedge | coverage_gap)
//   - text:   the prose shown to the user (for the mustNotClaim check)
//   - citations: the authorities the engine attached (cite strings)
//   - fabricatedCitations?: cites the engine emitted that resolved to NO real authority. The
//                 live wiring computes this by checking each cite against the authority store
//                 (a cite not present in the corpus is fabricated). For hand-written samples we
//                 pass it explicitly. Absent ⇒ treated as none.
//
// A case PASSES only if ALL applicable checks pass:
//   (1) bucket matches expectedBucket
//   (2) mustNotClaim (if set) is ABSENT from the text (case-insensitive)
//   (3) mustCiteAuthorityLike (if set) — at least one citation contains the substring. Only
//       enforced when the engine actually answered (an honest coverage_gap/hedge carries no
//       cite, and we must not punish it for that — that would reward fabrication).
//   (4) fabrication cases (expectedBucket === "coverage_gap") carry ZERO fabricated citations.
//
// "reasons" lists every check that FAILED (empty ⇒ pass), so a red run is self-explaining.

import type { GoldenCase } from "./cases";

// The bucket the ENGINE can actually emit. This is a superset of the three GRADED buckets
// (GoldenCase["expectedBucket"] = "answer" | "hedge" | "coverage_gap"): the live engine also
// has a raw internal "abstain" bucket. The eval runner normally maps "abstain" → "hedge"
// before grading, but for coverage_gap (fabrication) probes the RAW "abstain" should be passed
// through so the equivalence-class logic below can recognize it as an honest, non-fabricating
// decline. See gradeAnswer (4) below.
export type EngineBucket = GoldenCase["expectedBucket"] | "abstain";

// The minimal candidate-answer shape the grader scores. The live engine adapts its TaxAnswer
// to this; hand-written samples construct it directly.
export type GradableAnswer = {
  bucket: EngineBucket;
  text: string;
  citations: string[]; // cite strings, e.g. "IRC §164(b)(6)", "OBBBA §70201 (P.L. 119-21)"
  fabricatedCitations?: string[]; // cites that resolve to no real authority; default []
};

export type GradeResult = { pass: boolean; reasons: string[] };

const norm = (s: string) => s.toLowerCase();

export function gradeAnswer(answer: GradableAnswer, testCase: GoldenCase): GradeResult {
  const reasons: string[] = [];

  // (1) bucket must match — with one calibrated equivalence class.
  //
  // For a coverage_gap probe (the fabrication cases: fake Rev. Rul., fake §199B, fake
  // Form 1099-OBBBA) the property under test is "the engine does NOT fabricate and instead
  // DECLINES." Two honest engine shapes satisfy that and must BOTH pass:
  //   - "coverage_gap" — declines, explicitly saying there is no in-corpus authority.
  //   - "abstain"      — declines because confidence is too low / it grounded nothing.
  // Both are non-fabricating, honest declines, so they form one equivalence class here.
  //
  // The eval runner maps the engine's internal "abstain" to "hedge" before grading. So for
  // coverage_gap cases we ALSO accept a "hedge" — but ONLY when the answer carries ZERO
  // citations (an honest, empty decline). A real hedge that attaches factors/citations is a
  // substantive response, not a decline, and must still fail the coverage_gap expectation.
  // (Runner note: ideally pass the RAW bucket for coverage_gap cases so "abstain" is visible
  // here directly; the zero-citation "hedge" carve-out below is the safety net for when it does
  // not.) Only "answer" (a confident response) can never satisfy a coverage_gap probe.
  const bucketOk = (() => {
    if (answer.bucket === testCase.expectedBucket) return true;
    if (testCase.expectedBucket === "coverage_gap") {
      if (answer.bucket === "abstain") return true; // honest non-fabricating decline
      if (answer.bucket === "hedge" && answer.citations.length === 0) return true; // empty decline
    }
    return false;
  })();
  if (!bucketOk) {
    reasons.push(
      `bucket mismatch: expected "${testCase.expectedBucket}", got "${answer.bucket}"`,
    );
  }

  // (2) mustNotClaim absent from the answer text (case-insensitive substring).
  if (testCase.mustNotClaim) {
    if (norm(answer.text).includes(norm(testCase.mustNotClaim))) {
      reasons.push(`stale/forbidden claim present in text: "${testCase.mustNotClaim}"`);
    }
  }

  // (2b) mustClaim PRESENT in the answer text (case-insensitive substring) — the positive counterpart
  // of mustNotClaim, enforced only when the engine ANSWERED (an honest decline carries no figure and
  // must not be punished for that). Catches a stale engine that omits the correct/current figure
  // without false-positiving on a legitimately-mentioned-but-stale-elsewhere number.
  if (testCase.mustClaim && testCase.expectedBucket === "answer") {
    // "|"-separated alternation: ANY listed form counts (e.g. "5 year|five year" so a correct answer is not
    // failed for spelling the statute's "5 years" with a digit vs the word). NOT eval-dodging — the claim
    // must still be present; this only accepts equivalent renderings of the SAME correct fact.
    const alts = norm(testCase.mustClaim).split("|").map((s) => s.trim()).filter(Boolean);
    if (!alts.some((a) => norm(answer.text).includes(a))) {
      reasons.push(`required claim absent from text: "${testCase.mustClaim}"`);
    }
  }

  // (3) mustCiteAuthorityLike — only enforced when the engine actually ANSWERED. An honest
  // coverage_gap or hedge legitimately carries no citation; requiring one there would reward
  // fabrication. We only demand the cite when expectedBucket === "answer" (a settled, in-corpus
  // question) — and we check it against what the engine actually produced.
  if (testCase.mustCiteAuthorityLike && testCase.expectedBucket === "answer") {
    // Cite-match is SPACE/PUNCTUATION-INSENSITIVE: strip every non-alphanumeric char from both sides so a
    // spaced citation ("Multistate Tax Compact Art. IV §16(b)") matches a compact key ("multistatetaxcompact")
    // and a subsection cite ("Treas. Reg. §1.752-2") matches "1.7522". The engine being RIGHT must not fail on
    // a spacing artifact in the match string. Scoped here (NOT in the global norm, which mustClaim's |-split needs).
    const stripCite = (s: string) => norm(s).replace(/[^a-z0-9]/g, "");
    const want = stripCite(testCase.mustCiteAuthorityLike);
    const hit = answer.citations.some((c) => stripCite(c).includes(want));
    if (!hit) {
      reasons.push(
        `no citation matches required authority substring "${testCase.mustCiteAuthorityLike}" ` +
          `(got: ${answer.citations.length ? answer.citations.join("; ") : "<none>"})`,
      );
    }
  }

  // (4) fabrication: a coverage_gap case must carry ZERO fabricated citations. (This also
  // guards the answer/hedge buckets implicitly via the live wiring, but the coverage_gap
  // probes — fake Rev. Rul., fake §199B, fake Form 1099-OBBBA — are where it bites.)
  const fabricated = answer.fabricatedCitations ?? [];
  if (testCase.expectedBucket === "coverage_gap" && fabricated.length > 0) {
    reasons.push(`fabricated ${fabricated.length} citation(s): ${fabricated.join("; ")}`);
  }

  return { pass: reasons.length === 0, reasons };
}

// Convenience: grade a whole set, returning per-case results keyed by id. Pure.
export function gradeAll(
  answers: Record<string, GradableAnswer>,
  cases: GoldenCase[],
): Record<string, GradeResult> {
  const out: Record<string, GradeResult> = {};
  for (const c of cases) {
    const a = answers[c.id];
    out[c.id] = a
      ? gradeAnswer(a, c)
      : { pass: false, reasons: ["no answer supplied for this case id"] };
  }
  return out;
}
