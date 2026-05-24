"use client";

/**
 * Fill the **real IRS Form 8867** (Rev. November 2024) with the preparer's
 * due-diligence answers.
 *
 * Loads `public/forms/f8867.pdf` at runtime, writes the captured answers into
 * the PDF's acroform fields using `pdf-lib`, and returns the filled PDF as a
 * `Uint8Array`. The output is a real, downloadable, retainable PDF — the same
 * artifact a preparer would print/store from Drake, ProSeries, etc.
 *
 * Field-name discovery: see `node --input-type=module` enumeration script
 * (committed in this PR's notes). Mapping below was reverse-engineered from
 * the field positions + the form's text. All field names use the prefix
 * `topmostSubform[0].`, which is the IRS's PDF subform convention.
 */

import { PDFDocument, type PDFForm } from "pdf-lib";
import type { Form8867Completion, YesNo } from "./form-8867-store";

const PREFIX = "topmostSubform[0]";

// ─── Helpers ───

function safeCheck(form: PDFForm, name: string): void {
  try {
    form.getCheckBox(name).check();
  } catch {
    // Field name didn't resolve — silently skip rather than blow up the whole fill
    if (typeof console !== "undefined") {
      console.warn(`[fill-form-8867] checkbox not found: ${name}`);
    }
  }
}

function safeText(form: PDFForm, name: string, value: string): void {
  if (!value) return;
  try {
    form.getTextField(name).setText(value);
  } catch {
    if (typeof console !== "undefined") {
      console.warn(`[fill-form-8867] text field not found: ${name}`);
    }
  }
}

/**
 * Apply a Yes/No (or Yes/No/N-A) answer to a checkbox group. The IRS form
 * uses one checkbox widget per option (variant [0]=Yes, [1]=No, [2]=N/A);
 * we tick the appropriate one and leave the others blank.
 */
function setYesNo(form: PDFForm, baseName: string, answer: YesNo): void {
  if (answer === "yes") safeCheck(form, `${baseName}[0]`);
  else if (answer === "no") safeCheck(form, `${baseName}[1]`);
  else if (answer === "na") safeCheck(form, `${baseName}[2]`);
  // null → leave all three blank (question unanswered)
}

// ─── Main: fill the IRS PDF ───

export async function fillForm8867(completion: Form8867Completion): Promise<Uint8Array> {
  const res = await fetch("/forms/f8867.pdf");
  if (!res.ok) {
    throw new Error(`Failed to fetch Form 8867 PDF: ${res.status} ${res.statusText}`);
  }
  const pdfBytes = await res.arrayBuffer();
  const pdf = await PDFDocument.load(pdfBytes);
  const form = pdf.getForm();
  const a = completion.answers;

  // ─── Header (page 1, taxpayer + preparer block) ───
  // f1_1 is the 2-digit tax year ("25" for 2025) — the "20" prefix is baked into the form
  safeText(form, `${PREFIX}.Page1[0].PgHeader[0].f1_1[0]`, a.taxYear.slice(-2));
  safeText(form, `${PREFIX}.Page1[0].f1_2[0]`, completion.clientName);
  safeText(
    form,
    `${PREFIX}.Page1[0].f1_3[0]`,
    completion.clientTINLast4 ? `XXX-XX-${completion.clientTINLast4}` : ""
  );
  safeText(form, `${PREFIX}.Page1[0].f1_4[0]`, a.preparerName);
  safeText(form, `${PREFIX}.Page1[0].f1_5[0]`, a.preparerPTIN);

  // ─── "Check all that apply" — credits/HOH claimed on return ───
  if (a.applicableCredits.eitc) safeCheck(form, `${PREFIX}.Page1[0].c1_1[0]`);
  if (a.applicableCredits.ctc) safeCheck(form, `${PREFIX}.Page1[0].c1_2[0]`);
  if (a.applicableCredits.aotc) safeCheck(form, `${PREFIX}.Page1[0].c1_3[0]`);
  if (a.applicableCredits.hoh) safeCheck(form, `${PREFIX}.Page1[0].c1_4[0]`);

  // ─── Part I — Due Diligence Requirements (all returns) ───
  setYesNo(form, `${PREFIX}.Page1[0].c1_5`, a.q1);                // Q1 — based on tax-year info
  setYesNo(form, `${PREFIX}.Page1[0].c1_6`, a.q2);                // Q2 — worksheets completed
  setYesNo(form, `${PREFIX}.Page1[0].c1_7`, a.q3);                // Q3 — knowledge requirement
  setYesNo(form, `${PREFIX}.Page1[0].c1_8`, a.q4);                // Q4 — info appear incorrect?
  setYesNo(form, `${PREFIX}.Page1[0].c1_9`, a.q4a);               // Q4a — reasonable inquiries?
  setYesNo(form, `${PREFIX}.Page1[0].c1_10`, a.q4b);              // Q4b — contemporaneously documented?
  setYesNo(form, `${PREFIX}.Page1[0].c1_11`, a.q5);               // Q5 — record retention
  safeText(form, `${PREFIX}.Page1[0].Line5Entry[0].f1_6[0]`, a.q5Documents);
  setYesNo(form, `${PREFIX}.Page1[0].c1_12`, a.q6);               // Q6 — substantiation
  setYesNo(form, `${PREFIX}.Page1[0].c1_13`, a.q7);               // Q7 — prior disallowance
  setYesNo(form, `${PREFIX}.Page1[0].c1_14`, a.q7a);              // Q7a — Form 8862 completed
  setYesNo(form, `${PREFIX}.Page1[0].c1_15`, a.q8);               // Q8 — self-employment questions

  // ─── Part II — EIC (Page 2) ───
  setYesNo(form, `${PREFIX}.Page2[0].c2_1`, a.q9a);               // Q9a — EIC eligibility determined
  setYesNo(form, `${PREFIX}.Page2[0].c2_2`, a.q9b);               // Q9b — child lived with taxpayer
  setYesNo(form, `${PREFIX}.Page2[0].c2_3`, a.q9c);               // Q9c — tiebreaker rules explained

  // ─── Part III — CTC / ACTC / ODC (Page 2) ───
  setYesNo(form, `${PREFIX}.Page2[0].c2_4`, a.q10);               // Q10 — qualifying dependent
  setYesNo(form, `${PREFIX}.Page2[0].c2_5`, a.q11);               // Q11 — CTC residency rules
  setYesNo(form, `${PREFIX}.Page2[0].c2_6`, a.q12);               // Q12 — divorced/separated parents rules

  // ─── Part IV — AOTC (Page 2) ───
  setYesNo(form, `${PREFIX}.Page2[0].c2_7`, a.q13);               // Q13 — AOTC substantiation

  // ─── Part V — HOH (Page 2) ───
  setYesNo(form, `${PREFIX}.Page2[0].c2_8`, a.q14);               // Q14 — HOH qualifying

  // ─── Part VI — Eligibility Certification (Page 2) ───
  setYesNo(form, `${PREFIX}.Page2[0].c2_9`, a.q15);               // Q15 — certify all answers true

  return await pdf.save();
}

/**
 * Wraps `fillForm8867` and returns a Blob URL suitable for an iframe `src=`
 * or an `<a download>` link. Caller is responsible for revoking the URL.
 */
export async function fillForm8867AsBlobUrl(completion: Form8867Completion): Promise<string> {
  const bytes = await fillForm8867(completion);
  // Copy into a fresh ArrayBuffer to satisfy BlobPart typing (Uint8Array → ArrayBuffer)
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const blob = new Blob([buf], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
