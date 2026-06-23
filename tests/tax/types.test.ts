import { describe, it, expect } from "vitest";
import { figureSchema, worksheetResultSchema, citationSchema } from "../../lib/tax/types";
import { z } from "zod";

const cite = { authority: "IRC", cite: "IRC §63(c)", sourceUrl: "https://www.govinfo.gov/app/details/USCODE-2024-title26" };

describe("tax types — invariants", () => {
  it("a Figure requires an explicit verified flag", () => {
    const schema = figureSchema(z.number());
    const ok = schema.safeParse({ value: 16100, taxYear: 2025, jurisdiction: "federal", citation: cite, verified: true });
    expect(ok.success).toBe(true);
    const missingVerified = schema.safeParse({ value: 16100, taxYear: 2025, jurisdiction: "federal", citation: cite });
    expect(missingVerified.success).toBe(false);
  });

  it("a citation must resolve to a real URL", () => {
    expect(citationSchema.safeParse(cite).success).toBe(true);
    expect(citationSchema.safeParse({ ...cite, sourceUrl: "not-a-url" }).success).toBe(false);
  });

  it("a WorksheetResult cannot claim a number with zero citations (no citation, no claim)", () => {
    const noCites = worksheetResultSchema.safeParse({ value: 2500, lines: [], citations: [], flags: [] });
    expect(noCites.success).toBe(false);
    const withCite = worksheetResultSchema.safeParse({ value: 2500, lines: [], citations: [cite], flags: [] });
    expect(withCite.success).toBe(true);
  });
});
