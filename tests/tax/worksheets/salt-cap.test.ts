import { describe, it, expect } from "vitest";
import { saltCap } from "../../../lib/tax/worksheets/salt-cap";
import { getObbbaFigures } from "../../../lib/tax/figures/obbba-2025";
import { worksheetResultSchema } from "../../../lib/tax/types";

const f2025 = getObbbaFigures(2025).saltCap;
const f2026 = getObbbaFigures(2026).saltCap;

describe("SALT cap worksheet (OBBBA §70120 / IRC §164(b)(6),(7))", () => {
  it("returns a schema-valid WorksheetResult with at least one citation", () => {
    const r = saltCap({ magi: 100000, filingStatus: "mfj", taxYear: 2025 });
    expect(worksheetResultSchema.safeParse(r).success).toBe(true);
    expect(r.citations.length).toBeGreaterThan(0);
  });

  it("(a) MAGI below the threshold returns the full base cap (2025 = $40,000)", () => {
    // MAGI 100,000 < 500,000 threshold -> no reduction -> base cap.
    const r = saltCap({ magi: 100000, filingStatus: "mfj", taxYear: 2025 });
    expect(r.value).toBe(f2025.applicableLimitation.value); // 40,000
    expect(r.value).toBe(40000);
    expect(r.flags.some((fl) => fl.code === "SALT_PHASE_DOWN")).toBe(false);
  });

  it("(b) 2025 MAGI $520,000 -> $34,000 (spec example)", () => {
    // excess = 520,000 - 500,000 = 20,000; reduction = 0.30 * 20,000 = 6,000;
    // 40,000 - 6,000 = 34,000 (above the 10,000 floor).
    const r = saltCap({ magi: 520000, filingStatus: "mfj", taxYear: 2025 });
    expect(r.value).toBe(34000);
    expect(r.flags.some((fl) => fl.code === "SALT_PHASE_DOWN")).toBe(true);
    expect(r.flags.some((fl) => fl.code === "SALT_FLOOR")).toBe(false);
  });

  it("(c) 2026 MAGI $700,000 -> floor $10,000 (spec example)", () => {
    // excess = 700,000 - 505,000 = 195,000; reduction = 0.30 * 195,000 = 58,500;
    // 40,400 - 58,500 = -18,100 -> held at the 10,000 floor.
    const r = saltCap({ magi: 700000, filingStatus: "mfj", taxYear: 2026 });
    expect(r.value).toBe(10000);
    expect(r.value).toBe(f2026.floor.value);
    expect(r.flags.some((fl) => fl.code === "SALT_FLOOR")).toBe(true);
  });

  it("(d) 2026 MAGI $520,000 uses 2026 params (base 40,400, threshold 505,000) -> $35,900", () => {
    // excess = 520,000 - 505,000 = 15,000; reduction = 0.30 * 15,000 = 4,500;
    // 40,400 - 4,500 = 35,900.
    const r = saltCap({ magi: 520000, filingStatus: "mfj", taxYear: 2026 });
    expect(r.value).toBe(35900);
  });

  it("(e) MAGI exactly AT the threshold is not phased down (excess = 0)", () => {
    // 2025: at 500,000 the excess is 0 -> full 40,000.
    const r = saltCap({ magi: 500000, filingStatus: "single", taxYear: 2025 });
    expect(r.value).toBe(40000);
    expect(r.flags.some((fl) => fl.code === "SALT_PHASE_DOWN")).toBe(false);
  });

  it("(f) MFS floor is $5,000, not $10,000", () => {
    // 2025 MFS at very high MAGI: phase-down drives below floor -> held at the MFS floor 5,000.
    const r = saltCap({ magi: 2000000, filingStatus: "mfs", taxYear: 2025 });
    expect(r.value).toBe(f2025.floorMFS.value); // 5,000
    expect(r.value).toBe(5000);
  });

  it("(g) an unknown tax year throws (no silent fallback)", () => {
    expect(() => saltCap({ magi: 100000, filingStatus: "single", taxYear: 2030 })).toThrow();
  });
});
