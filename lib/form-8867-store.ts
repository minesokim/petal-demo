"use client";

import { getFirmOwner, memberSignatureLine } from "@/lib/firm-mock-data";

/**
 * Store for completed Form 8867 (Paid Preparer's Due Diligence Checklist)
 * submissions.
 *
 * The shape of `Form8867Answers` mirrors the **actual IRS Form 8867 (Rev. November
 * 2024)** field-for-field — same question numbering (Q1–Q15 with sub-parts), same
 * Yes/No/N-A options, same "list of documents" text on Q5. This makes the
 * answer record a 1:1 source for both:
 *
 *   1. Filling the real IRS PDF (`public/forms/f8867.pdf`) via `lib/fill-form-8867.ts`
 *   2. (Future) Producing the MeF XML when an e-file backend is wired up
 *
 * In production this would live in Convex. Today it's process-local +
 * localStorage so completions survive navigation and reload.
 *
 * Reference: https://www.irs.gov/pub/irs-pdf/f8867.pdf
 */

export type YesNo = "yes" | "no" | "na" | null;

export interface Form8867Answers {
  /** Tax year covered (e.g., "2025") */
  taxYear: string;

  /** Which credits/status the return claims — drives which Parts are required */
  applicableCredits: {
    eitc: boolean;  // Earned Income Tax Credit
    ctc: boolean;   // Child Tax Credit / ACTC / ODC
    aotc: boolean;  // American Opportunity Tax Credit
    hoh: boolean;   // Head of Household filing status
  };

  // ─── Part I — Due Diligence Requirements (applies to all returns) ───
  /** Q1 — Did you complete the return based on info for the applicable tax year? */
  q1: YesNo;
  /** Q2 — Did you complete the applicable EIC/CTC/ACTC/ODC/AOTC worksheets? */
  q2: YesNo;
  /** Q3 — Did you satisfy the knowledge requirement? (interview + review) */
  q3: YesNo;
  /** Q4 — Did any info appear incorrect, incomplete, or inconsistent? */
  q4: YesNo;
  /** Q4a — (If Q4=Yes) Did you make reasonable inquiries? */
  q4a: YesNo;
  /** Q4b — (If Q4=Yes) Did you contemporaneously document your inquiries? */
  q4b: YesNo;
  /** Q5 — Did you satisfy the record retention requirement? */
  q5: YesNo;
  /** Q5 list — Documents the taxpayer provided that you relied on */
  q5Documents: string;
  /** Q6 — Did you ask if the taxpayer can substantiate the credits/HOH? */
  q6: YesNo;
  /** Q7 — Did you ask if any of these credits were disallowed/reduced previously? */
  q7: YesNo;
  /** Q7a — (If Q7=Yes) Did you complete the required Form 8862? */
  q7a: YesNo;
  /** Q8 — If self-employment income, did you ask questions to prepare Schedule C? */
  q8: YesNo;

  // ─── Part II — EIC (only if EITC claimed) ───
  /** Q9a — Have you determined the taxpayer is eligible for EIC? */
  q9a: YesNo;
  /** Q9b — Did you ask if the child lived with the taxpayer over half the year? */
  q9b: YesNo;
  /** Q9c — Did you explain the EIC tiebreaker rules? */
  q9c: YesNo;

  // ─── Part III — CTC / ACTC / ODC (only if CTC claimed) ───
  /** Q10 — Each qualifying person is taxpayer's dependent who is US citizen/national/resident? */
  q10: YesNo;
  /** Q11 — Did you explain CTC/ACTC residency rules (half-year, custodial release)? */
  q11: YesNo;
  /** Q12 — Did you explain CTC/ACTC/ODC rules for divorced/separated parents? */
  q12: YesNo;

  // ─── Part IV — AOTC (only if AOTC claimed) ───
  /** Q13 — Did the taxpayer provide substantiation (Form 1098-T and/or receipts)? */
  q13: YesNo;

  // ─── Part V — HOH (only if HOH filing status) ───
  /** Q14 — Was the taxpayer unmarried + provided >half cost of keeping up a home? */
  q14: YesNo;

  // ─── Part VI — Certification ───
  /** Q15 — Do you certify the answers are true, correct, and complete? */
  q15: YesNo;

  // ─── Preparer & taxpayer identification (header) ───
  preparerName: string;
  preparerPTIN: string;
  signatureDate: string;
}

export interface Form8867Completion {
  clientId: string;
  clientName: string;
  /** Last four of TIN — full TIN is never stored client-side */
  clientTINLast4: string;
  completedAt: string;
  answers: Form8867Answers;
}

const STORAGE_KEY = "petal:form-8867:completions";

const completions = new Map<string, Form8867Completion>();
type Listener = () => void;
const listeners = new Set<Listener>();

// Cached snapshot — rebuilt only when something actually changes, so
// useSyncExternalStore consumers get a stable reference and don't infinite-loop.
let cachedAllCompletions: Form8867Completion[] = [];

function rebuildCache() {
  cachedAllCompletions = Array.from(completions.values());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const entries = Array.from(completions.entries());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore quota / serialization errors — completions still live in memory
  }
}

function hydrate() {
  if (typeof window === "undefined" || completions.size > 0) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw) as Array<[string, Form8867Completion]>;
    for (const [k, v] of entries) completions.set(k, v);
    rebuildCache();
  } catch {
    // Corrupted JSON — start fresh
  }
}

// Hydrate from localStorage on first import (browser only).
// This way completed forms survive page refresh / navigation.
hydrate();

function emit() {
  rebuildCache();
  persist();
  listeners.forEach((l) => l());
}

export function saveForm8867Completion(completion: Form8867Completion): void {
  completions.set(completion.clientId, completion);
  emit();
}

export function getForm8867Completion(clientId: string): Form8867Completion | undefined {
  return completions.get(clientId);
}

/**
 * Stable-reference snapshot of all completions. Same array identity until
 * something actually changes (then `emit()` rebuilds it). Safe to pass as
 * the `getSnapshot` argument to `useSyncExternalStore`.
 */
export function getAllForm8867Completions(): Form8867Completion[] {
  return cachedAllCompletions;
}

export function subscribeForm8867(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Empty default — what the form starts with for a new completion */
export function defaultAnswers(): Form8867Answers {
  return {
    taxYear: new Date().getFullYear().toString(),
    applicableCredits: { eitc: false, ctc: false, aotc: false, hoh: false },
    q1: null,
    q2: null,
    q3: null,
    q4: null,
    q4a: null,
    q4b: null,
    q5: null,
    q5Documents: "",
    q6: null,
    q7: null,
    q7a: null,
    q8: null,
    q9a: null,
    q9b: null,
    q9c: null,
    q10: null,
    q11: null,
    q12: null,
    q13: null,
    q14: null,
    q15: null,
    // Default to the firm owner's signature line + PTIN. The actual signer
    // is recorded when the form is signed (a non-owner preparer with their
    // own PTIN can override before submitting). This is just the seed value.
    preparerName: memberSignatureLine(getFirmOwner()),
    preparerPTIN: getFirmOwner().ptin ?? "",
    signatureDate: "",
  };
}
