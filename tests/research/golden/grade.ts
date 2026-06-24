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

// The minimal candidate-answer shape the grader scores. The live engine adapts its TaxAnswer
// to this; hand-written samples construct it directly.
export type GradableAnswer = {
  bucket: GoldenCase["expectedBucket"];
  text: string;
  citations: string[]; // cite strings, e.g. "IRC §164(b)(6)", "OBBBA §70201 (P.L. 119-21)"
  fabricatedCitations?: string[]; // cites that resolve to no real authority; default []
};

export type GradeResult = { pass: boolean; reasons: string[] };

const norm = (s: string) => s.toLowerCase();

export function gradeAnswer(answer: GradableAnswer, testCase: GoldenCase): GradeResult {
  const reasons: string[] = [];

  // (1) bucket must match.
  if (answer.bucket !== testCase.expectedBucket) {
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

  // (3) mustCiteAuthorityLike — only enforced when the engine actually ANSWERED. An honest
  // coverage_gap or hedge legitimately carries no citation; requiring one there would reward
  // fabrication. We only demand the cite when expectedBucket === "answer" (a settled, in-corpus
  // question) — and we check it against what the engine actually produced.
  if (testCase.mustCiteAuthorityLike && testCase.expectedBucket === "answer") {
    const want = norm(testCase.mustCiteAuthorityLike);
    const hit = answer.citations.some((c) => norm(c).includes(want));
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
