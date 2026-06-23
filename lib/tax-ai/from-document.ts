// ④ ③→④ bridge: a document's extracted fields → the compute engine. The document
// classifier (lib/ai/schema DocClassification, a Haiku worker) reads a W-2/1099/return
// into structured fields; this hands those fields to the orchestrator, whose proposer maps
// them to a worksheet's inputs and lib/tax computes the cited, tiered figure. It is the link
// that turns "drop a document" into "a defensible position the preparer reviews".
//
// Model-discipline unchanged: the proposer only MAPS fields → inputs (schema-validated);
// the number still comes from lib/tax, judged by a second model, tier derived. §7216: the
// document fields are taxpayer data, so the caller declares the scope (assertCleared, via opts).

import type { AIProvider } from "../ai/provider";
import { answerComputation, type AnswerOpts, type TaxAnswer } from "./orchestrator";

export type DocumentFacts = {
  docType?: string; // "W-2" | "1099-NEC" | … (DocClassification.docType)
  taxYear?: number | null; // DocClassification.taxYear
  fields: Record<string, string>; // extracted field → value, e.g. { wages: "52000", federalWithholding: "6100" }
};

// Compute a tiered position from a document's extracted facts. `question` scopes WHICH
// computation (e.g. "What's their EITC?"); the proposer maps the document fields (plus any
// the question adds) to the worksheet inputs. The document's tax year wins over opts.taxYear
// unless absent. The result is a PROPOSAL for the preparer — never a filed number.
export async function computeFromDocument(
  provider: AIProvider,
  question: string,
  doc: DocumentFacts,
  opts: AnswerOpts = {},
): Promise<TaxAnswer> {
  const facts = {
    source: "extracted-document",
    docType: doc.docType ?? null,
    taxYear: doc.taxYear ?? null,
    ...doc.fields,
  };
  const taxYear = typeof doc.taxYear === "number" ? doc.taxYear : opts.taxYear;
  return answerComputation(provider, question, facts, { ...opts, taxYear });
}
