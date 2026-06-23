import { describe, it, expect } from "vitest";
import { MockProvider } from "../../lib/ai/provider";
import { retrieve } from "../../lib/ai/authority";
import { reason } from "../../lib/ai/reasoning";
import { verifyStructural } from "../../lib/ai/verify";
import type { ReasoningOutput } from "../../lib/ai/schema";

const signals = { retrieval: "on_point", computation: "na", agreement: "high", edgeCase: false } as const;
const notes = { verify: ["Confirm dependent status"], factAssumptions: [], disclosureFlag: false };

// Build a MockProvider that returns a fixed raw ReasoningOutput (schema validates it).
const mockReturning = (raw: ReasoningOutput) => new MockProvider(() => raw);

describe("④ reasoning vertical slice (synthetic/public authority)", () => {
  it("retrieves on-point authority by keyword", () => {
    const chunks = retrieve("standard deduction limit for a dependent with earned income");
    expect(chunks.map((c) => c.chunkId)).toContain("irc-63-c-5");
  });

  it("keeps a properly grounded position and the verifier PASSes", async () => {
    const chunks = retrieve("dependent standard deduction");
    const out = await reason(
      mockReturning({
        positions: [{
          claim: "A dependent's standard deduction is limited under §63(c)(5).",
          citations: [{ chunkId: "irc-63-c-5", citation: "IRC §63(c)(5)", taxYear: 2025 }],
          computedValueRefs: [], confidenceSignals: signals, reviewNotes: notes,
        }],
        abstained: false,
      }),
      "dependent standard deduction", chunks,
    );
    expect(out.positions).toHaveLength(1);
    expect(out.abstained).toBe(false);
    expect(verifyStructural(out, chunks).overall).toBe("PASS");
  });

  it("drops a position citing a chunkId we never provided (no citation, no claim)", async () => {
    const chunks = retrieve("dependent standard deduction");
    const out = await reason(
      mockReturning({
        positions: [{
          claim: "Fabricated claim citing invented authority.",
          citations: [{ chunkId: "irc-does-not-exist", citation: "IRC §999", taxYear: 2025 }],
          computedValueRefs: [], confidenceSignals: signals, reviewNotes: notes,
        }],
        abstained: false,
      }),
      "dependent standard deduction", chunks,
    );
    expect(out.positions).toHaveLength(0);
    expect(out.abstained).toBe(true); // forced abstention — the dangling claim never reaches a human
  });

  it("abstains when retrieval finds no authority", async () => {
    const chunks = retrieve("how do I register an LLC in Delaware"); // off-domain → no chunks
    const out = await reason(mockReturning({ positions: [], abstained: true }), "off-domain", chunks);
    expect(chunks).toHaveLength(0);
    expect(out.abstained).toBe(true);
  });

  it("verifier FAILs an uncited position", () => {
    const bad: ReasoningOutput = {
      positions: [{ claim: "Uncited.", citations: [], computedValueRefs: [], confidenceSignals: signals, reviewNotes: notes }],
      abstained: false,
    };
    const v = verifyStructural(bad, retrieve("dependent standard deduction"));
    expect(v.overall).toBe("FAIL");
    expect(v.blockingFailures.length).toBeGreaterThan(0);
  });
});
