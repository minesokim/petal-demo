// CAPABILITY 1 — Document intake / extraction (tier-1 read). The extraction CORE: take a
// stored document (an R2 / Supabase-storage key) + a docType hint, run it through the EXISTING
// Ask-Petal analyze pipeline (AIProvider.analyzeDocument — the same provider path the
// /api/ask/analyze route uses, NOT a rebuilt OCR stack), and return schema-validated structured
// fields. When the document maps to a manifest item, advance that fetch_requirement to
// `received` and stamp the evidence key.
//
// §7216: a client document is REAL taxpayer data. assertCleared(scope) gates the model call —
// scope defaults to "synthetic" (Phase 1, passes) and a caller wiring real bytes must pass
// "real" (gated by PETAL_7216_CLEARED). The provider + bytes loader are injected so this is unit-
// testable with a MockProvider and no network — the deterministic path the tests exercise.

import { z } from "zod";
import type { AIProvider } from "../ai/provider";
import { assertCleared, type DataScope } from "../ai/guard";
import { advanceRequirement, matchRequirement } from "../sor/manifest";
import type { Db, Ctx } from "../repository/types";

// The structured shape an extraction returns. Deliberately conservative: the model fills what it
// can read and abstains (null / empty) on the rest — a tax document never gets a guessed figure.
export const ExtractedDocument = z.object({
  docType: z.string(), // the model's classification (e.g. "W-2", "1099-NEC", "1098")
  taxYear: z.number().int().nullable().optional(),
  // Named parties on the form (employer/payer, employee/recipient) — strings only, no SSNs.
  parties: z.array(z.object({ role: z.string(), name: z.string() })).default([]),
  // Key figures the form reports. amount is a number; label is the box/line it came from.
  figures: z.array(z.object({ label: z.string(), amount: z.number() })).default([]),
  // Anything a preparer must double-check (missing box, illegible field, odd amount).
  flags: z.array(z.string()).default([]),
});
export type ExtractedDocument = z.infer<typeof ExtractedDocument>;

const EXTRACT_SYSTEM =
  "You are Petal, extracting structured data from a tax document a preparer dropped in. " +
  "Identify the document type, the tax year, the named parties (employer/payer and " +
  "employee/recipient by NAME only — never an SSN or account number), and the key reported " +
  "figures with the box/line label each came from. Flag anything to double-check. Return ONLY a " +
  "JSON object matching the schema: {docType, taxYear, parties[], figures[], flags[]}. Do not " +
  "invent values — if a field is illegible or absent, omit it or note it in flags.";

export type DocRef = {
  /** the stored object key (Supabase storage path / R2 key). */
  storageKey: string;
  /** mime so the provider sends the right block type. */
  mediaType: string;
  /** optional original filename, for the prompt + audit. */
  fileName?: string;
};

export type ExtractInput = {
  doc: DocRef;
  /** the caller's classification hint (e.g. "W-2"); also used to match a manifest item. */
  docTypeHint: string;
  /** when set, link the extraction to this client+period's manifest and mark the slot received. */
  manifest?: { clientId: string; period: string };
  scope?: DataScope; // §7216 — defaults to "synthetic"
};

export type ExtractDeps = {
  provider: AIProvider;
  /** load the document bytes (base64) for a stored key. Injected so tests need no storage. */
  loadBytes: (key: string) => Promise<string>;
};

export type ExtractResult = {
  gated: boolean;
  fields: ExtractedDocument | null;
  /** the manifest requirement this document was linked to (advanced to `received`), if any. */
  linkedRequirementId: string | null;
  /** the evidence key stamped on that requirement. */
  evidenceKey: string | null;
  message?: string;
};

// Parse the model's analysis text into the structured schema. The model is asked for JSON; we
// tolerate a fenced ```json block and validate with Zod (the same validation path the rest of
// the AI layer uses). A non-JSON / invalid reply throws — extraction never fabricates fields.
function parseExtraction(text: string): ExtractedDocument {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("extraction did not return valid JSON");
  }
  return ExtractedDocument.parse(parsed);
}

// Run the extraction. Pure of HTTP/storage specifics (both injected). The DB handle + ctx are
// passed only when manifest linking is requested; the link is a single guarded
// `received` transition (advanceRequirement enforces the manifest machine), so a re-upload can't
// re-open a verified slot.
export async function extractDocument(
  deps: ExtractDeps,
  input: ExtractInput,
  link?: { db: Db; ctx: Ctx },
): Promise<ExtractResult> {
  const scope = input.scope ?? "synthetic";

  // §7216 GATE. In Phase 1 (synthetic) this passes; the moment a caller passes scope "real" it
  // throws unless PETAL_7216_CLEARED. We surface a gate trip as gated:true (honest, not an error)
  // so the manifest is never touched by an ungated read.
  try {
    assertCleared(scope);
  } catch {
    return {
      gated: true,
      fields: null,
      linkedRequirementId: null,
      evidenceKey: null,
      message:
        `Extraction for "${input.doc.fileName ?? input.doc.storageKey}" is built and ready, but ` +
        `reading a client document sends its contents to Petal's AI, governed by IRS §7216. It ` +
        `stays gated until document-AI is cleared (a written tax-attorney opinion).`,
    };
  }

  const base64 = await deps.loadBytes(input.doc.storageKey);
  const { text } = await deps.provider.analyzeDocument({
    system: EXTRACT_SYSTEM,
    prompt:
      `Extract structured fields from this document` +
      (input.doc.fileName ? ` (${input.doc.fileName})` : "") +
      (input.docTypeHint ? `. Hint: it is likely a ${input.docTypeHint}.` : "") +
      ` Return ONLY the JSON object.`,
    base64,
    mediaType: input.doc.mediaType,
  });

  const fields = parseExtraction(text);

  // Link to a manifest slot if requested AND a non-terminal requirement matches the hint.
  let linkedRequirementId: string | null = null;
  let evidenceKey: string | null = null;
  if (input.manifest && link) {
    const match = await matchRequirement(
      link.db,
      input.manifest.clientId,
      input.manifest.period,
      fields.docType || input.docTypeHint,
    );
    if (match && (match.status === "pending" || match.status === "requested")) {
      await advanceRequirement(link.db, link.ctx, match.id, "received", {
        evidenceR2Key: input.doc.storageKey,
      });
      linkedRequirementId = match.id;
      evidenceKey = input.doc.storageKey;
    }
  }

  return { gated: false, fields, linkedRequirementId, evidenceKey };
}
