import type { GoldenCase } from "./cases";

// SPEED PROBES — the latency floor-cases. The point is NOT correctness (graded elsewhere) but TIME: does
// the wall-clock track the actual DIFFICULTY of the question, or just fixed harness overhead? Three rungs:
//   - arithmetic : nothing to retrieve — pure math on the user's own numbers. MUST be fast.
//   - framework  : stable law the model knows cold (§1001 gain, QSBS structure) + light lookup. Medium.
//   - multi      : a genuine multi-section question that SHOULD pay for real retrieval. Allowed slow.
// If all three take roughly the same (long) time, the system is spending its budget on overhead, not
// thinking — the "5 minutes for 53% of $5M" failure. Tag each with its expected rung for the report.
export type SpeedRung = "arithmetic" | "framework" | "multi";

export const SPEED_CASES: (GoldenCase & { rung: SpeedRung })[] = [
  {
    id: "speed-arithmetic-share",
    rung: "arithmetic",
    question: "If I own 53% of a company that sold for 5 million dollars, what is my share of the proceeds before any taxes?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "2,650,000|2.65 million|2,650",
    notes: "SPEED FLOOR: pure arithmetic on the user's own numbers — nothing to retrieve. If this is slow, the overhead is the problem, not the difficulty.",
  },
  {
    id: "speed-framework-founder-stock",
    rung: "framework",
    question: "At a high level, how is a founder's gain on selling C-corporation stock taxed for federal purposes?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "gain|amount realized|basis",
    notes: "SPEED MID: stable framework law the model knows cold (§1001 gain) + a light lookup. Should be medium, not minutes.",
  },
  {
    id: "speed-multi-382-nubig",
    rung: "multi",
    question: "After an ownership change, how does the IRC section 382 limitation interact with a net unrealized built-in gain (NUBIG)?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "limitation|built-in|ownership change",
    notes: "SPEED CEILING: a genuine multi-section question (§382/§383/NUBIG) that SHOULD pay for real retrieval — the one rung allowed to be slow.",
  },
];
