// Tax engine — shared types for the deterministic core (L1 figures + L2 worksheets).
// Model-free by construction: nothing here imports from lib/ai/*. Every material
// number a worksheet emits carries a resolvable citation ("no citation, no claim").

import { z } from "zod";

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh" | "qss";
export type Jurisdiction = "federal" | "CA";

// A resolvable pointer to primary authority. `cite` is the legal string a preparer
// would write on a workpaper; `sourceUrl` resolves to the official text.
export type Citation = {
  authority: string; // "IRC" | "26 CFR" | "Rev. Proc." | "Pub" | "CA RTC" | "FTB" | …
  cite: string; // "IRC §32(b)(2)(A)" | "Rev. Proc. 2025-32 §2.10" | "FTB 540 Inst."
  sourceUrl: string; // official, free source (irs.gov / govinfo.gov / ftb.ca.gov / ecfr.gov)
};

// A single tax figure as DATA, not prose (spec L1): typed, keyed by year + jurisdiction,
// carrying its citation. Superseding a value adds a new Figure with `supersededBy`;
// the old one is never edited (git is the version store). `verified:false` means the
// value still needs confirmation against `citation.sourceUrl` and is excluded from
// golden scenarios until confirmed.
export type Figure<T> = {
  value: T;
  taxYear: number;
  jurisdiction: Jurisdiction;
  citation: Citation;
  verified: boolean;
  effectiveFrom?: string; // ISO date the value takes effect (e.g. an OBBBA change)
  supersededBy?: string; // citation string of the value that replaced this one
};

// A deterministic worksheet's flag — a reject-style rule hit, a review prompt, or info.
// Reject mirrors an MeF business-rule rejection; review routes a preparer to authority.
export type Flag = {
  code: string; // "EITC_INVESTMENT_INCOME" | "AOTC_YEARS_EXCEEDED" | …
  severity: "reject" | "review" | "info";
  message: string;
  citation?: Citation;
};

// One line of a worksheet's trace — what a preparer would see on the IRS worksheet.
export type WorksheetLine = { line: string; label: string; amount: number };

// The result of a deterministic worksheet. `value` is the computed amount; `lines`
// is the auditable trace; `citations` is non-empty (the authority the value rests on);
// `flags` carries any rule hits.
export type WorksheetResult = {
  value: number;
  lines: WorksheetLine[];
  citations: Citation[];
  flags: Flag[];
};

// ── Zod schemas (validate fixtures + golden scenarios; enforce the invariants) ──

export const citationSchema = z.object({
  authority: z.string().min(1),
  cite: z.string().min(1),
  sourceUrl: z.string().url(),
});

export function figureSchema<T extends z.ZodTypeAny>(value: T) {
  return z.object({
    value,
    taxYear: z.number().int(),
    jurisdiction: z.enum(["federal", "CA"]),
    citation: citationSchema,
    verified: z.boolean(),
    effectiveFrom: z.string().optional(),
    supersededBy: z.string().optional(),
  });
}

export const flagSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(["reject", "review", "info"]),
  message: z.string().min(1),
  citation: citationSchema.optional(),
});

// A WorksheetResult MUST carry at least one citation — "no citation, no claim".
export const worksheetResultSchema = z.object({
  value: z.number(),
  lines: z.array(z.object({ line: z.string(), label: z.string(), amount: z.number() })),
  citations: z.array(citationSchema).min(1, "no citation, no claim: a result needs at least one citation"),
  flags: z.array(flagSchema),
});
