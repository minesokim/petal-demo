// COMPUTE-HANDOFF INPUT EXTRACTOR (lib/research/extract.ts) — the INV-1 split's deterministic half.
//
// The research engine grounds the RULE and cites it (model authored, gate-policed). This module
// is the OTHER half: a pure, model-free heuristic that decides whether a research question is
// ALSO compute-flavored — i.e. it maps to one of the four OBBBA worksheets AND the question text
// literally contains the numeric inputs that worksheet needs. When it does, the engine can hand
// off to lib/tax-ai/compute() and attach an ENGINE-DERIVED figure alongside the cited rule.
//
// HARD CONSTRAINTS (so this can never fabricate a number):
//   - NO model call. Regex + heuristics only. Determinism is the whole point — the figure this
//     enables is trustworthy precisely because no LLM touched the arithmetic OR the inputs.
//   - If the REQUIRED inputs for the mapped worksheet are not confidently present in the text,
//     return null. The engine then just states the rule (no guessing). A missing input must
//     NEVER be defaulted into a plausible-but-invented number.
//
// Scope: the four OBBBA worksheets the handoff covers — saltCap, tipsDeduction,
// overtimeDeduction, seniorDeduction. Each carries its own taxYear (year-specific figures), so
// the extractor returns the resolved taxYear too.

import type { ComputeRequest } from "../tax-ai/compute";
import type { FilingStatus } from "../tax/types";

// The four worksheets this handoff covers. A strict subset of ComputeRequest["worksheet"].
export type ExtractWorksheet = "saltCap" | "tipsDeduction" | "overtimeDeduction" | "seniorDeduction";

// A confidently-extracted handoff: which worksheet the question maps to, plus a fully-formed
// ComputeRequest ready to pass straight to compute(). taxYear is surfaced for the caller.
export type ExtractedCompute = {
  worksheet: ExtractWorksheet;
  request: ComputeRequest;
  taxYear: number;
};

// ── numeric scanning ─────────────────────────────────────────────────────────────────────────
// Parse "$700,000", "700k", "$25,000.50", "150000" → a number. Unit-aware ($1.2m → 1_200_000)
// so a casually-phrased amount still resolves. Returns null on anything non-numeric.
function parseAmount(raw: string): number | null {
  const m = raw.toLowerCase().replace(/[\s,$]/g, "").match(/^(\d+(?:\.\d+)?)(k|m|b|million|billion)?$/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  switch (m[2]) {
    case "k": n *= 1e3; break;
    case "m": case "million": n *= 1e6; break;
    case "b": case "billion": n *= 1e9; break;
  }
  return Number.isFinite(n) ? n : null;
}

// A dollar amount appearing NEAR (within ~40 chars, either side) any of the given keywords. We
// scan keyword→amount and amount→keyword so "$700,000 of MAGI" and "MAGI of $700,000" both hit.
// Returns the FIRST confident match (left-to-right) or null.
const AMOUNT = String.raw`\$?\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m|b|million|billion)?`;

function amountNear(text: string, keywords: string[]): number | null {
  const kw = keywords.join("|");
  // A "$"/comma/unit-bearing money token is a STRONG dollar signal; a bare 4-digit run is most
  // likely a tax year ("in 2026") and must not be mistaken for a dollar amount. We therefore
  // prefer the amount-BEFORE-keyword form ("$700,000 of MAGI") and an explicit money token over a
  // bare integer that merely sits near the keyword ("MAGI in 2026").
  const before = new RegExp(`(${AMOUNT})[^.]{0,40}?(?:${kw})`, "gi"); // amount … keyword
  const after = new RegExp(`(?:${kw})[^.]{0,40}?(${AMOUNT})`, "gi"); // keyword … amount

  // True for tokens that LOOK like money rather than a bare year: a "$", a comma group, a decimal,
  // or a magnitude unit. A naked 4-digit run (e.g. 2026) is rejected as a probable year.
  const looksLikeMoney = (raw: string): boolean =>
    /[$,.]/.test(raw) || /(k|m|b|million|billion)\s*$/i.test(raw.trim()) || raw.replace(/[\s,$]/g, "").length > 4;

  const candidates: { value: number; money: boolean }[] = [];
  for (const re of [before, after]) {
    for (const m of text.matchAll(re)) {
      const tok = m[1].trim();
      const v = parseAmount(tok);
      if (v != null && /\d/.test(tok)) candidates.push({ value: v, money: looksLikeMoney(tok) });
    }
  }
  if (!candidates.length) return null;
  // Prefer a money-looking token; among ties, the largest (income/MAGI dwarfs incidental small
  // numbers). This keeps "$700,000 of MAGI in 2026" → 700000, never 2026.
  const money = candidates.filter((c) => c.money);
  const pool = money.length ? money : candidates;
  return pool.reduce((best, c) => (c.value > best.value ? c : best)).value;
}

// MAGI / income: a $ amount near MAGI, AGI, income, "earn(s/ed)", or "makes".
function extractIncome(text: string): number | null {
  return amountNear(text, ["magi", "modified adjusted gross income", "\\bagi\\b", "income", "earns?", "earned", "makes?", "salary", "wages?"]);
}

// filing status: joint/married → mfj, else single. Conservative — only these two are needed by
// the four covered worksheets' branch logic (joint vs. not).
function extractFilingStatus(text: string): FilingStatus {
  return /\b(married|jointly|joint|mfj|spouse)\b/i.test(text) ? "mfj" : "single";
}

// tax year: a 20xx in the text wins; otherwise default to 2025 (the OBBBA worksheets' first
// operative year and the engine's compute() default).
function extractTaxYear(text: string, fallback = 2025): number {
  const m = text.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1], 10) : fallback;
}

// ── worksheet mapping (keyword → worksheet) ──────────────────────────────────────────────────
// The mapping the task specifies: salt→saltCap, tip→tipsDeduction, overtime→overtimeDeduction,
// senior/age 65→seniorDeduction. Order matters only in that the first match wins; the keyword
// sets are disjoint enough that ordering is not load-bearing.
function mapWorksheet(text: string): ExtractWorksheet | null {
  if (/\bsalt\b|state and local tax/i.test(text)) return "saltCap";
  if (/\btips?\b|tip income|tipped/i.test(text)) return "tipsDeduction";
  if (/\bovertime\b/i.test(text)) return "overtimeDeduction";
  if (/\bsenior\b|\bage 65\b|65 or older|over 65/i.test(text)) return "seniorDeduction";
  return null;
}

/**
 * Deterministically decide whether `question` is a compute-flavored handoff for one of the four
 * covered worksheets, and if so build the ComputeRequest from inputs literally present in the
 * text. Returns null when the question maps to no covered worksheet OR the required inputs for
 * the mapped worksheet are not confidently extractable (the engine then states only the rule).
 *
 * Pure: no model, no I/O. The number this enables is trustworthy because both the inputs and the
 * arithmetic are deterministic.
 */
export function extractCompute(question: string): ExtractedCompute | null {
  const worksheet = mapWorksheet(question);
  if (!worksheet) return null;

  const taxYear = extractTaxYear(question);
  const filingStatus = extractFilingStatus(question);

  switch (worksheet) {
    case "saltCap": {
      // Required: MAGI. Without an income figure the cap is just the rule, not a number.
      const magi = extractIncome(question);
      if (magi == null) return null;
      return { worksheet, taxYear, request: { worksheet: "saltCap", facts: { magi, filingStatus, taxYear } } };
    }

    case "tipsDeduction": {
      // Required: tips amount AND MAGI. occupationEligible is asserted true here ONLY when the
      // question gives both numbers (the engine attaches a review note that the preparer must
      // confirm the IRS-listed occupation); without the tips figure we do not compute.
      const tips = amountNear(question, ["tips?", "tip income", "tipped"]);
      const magi = extractIncome(question);
      if (tips == null || magi == null) return null;
      return {
        worksheet,
        taxYear,
        request: { worksheet: "tipsDeduction", facts: { tips, magi, filingStatus, occupationEligible: true, taxYear } },
      };
    }

    case "overtimeDeduction": {
      // Required: the FLSA overtime premium amount AND MAGI.
      const overtimePremium = amountNear(question, ["overtime", "premium", "time and a half", "flsa"]);
      const magi = extractIncome(question);
      if (overtimePremium == null || magi == null) return null;
      return {
        worksheet,
        taxYear,
        request: { worksheet: "overtimeDeduction", facts: { overtimePremium, magi, filingStatus, taxYear } },
      };
    }

    case "seniorDeduction": {
      // Required: MAGI. `age` is the COUNT of qualifying 65+ individuals (0–2). We infer the count
      // from the question: a married/joint mention of both spouses 65+ → 2, otherwise 1 (the
      // question already mapped to the senior worksheet via a senior/65 keyword, so at least one).
      const magi = extractIncome(question);
      if (magi == null) return null;
      const bothSeniors = /\bboth\b/i.test(question) && filingStatus === "mfj";
      const age = bothSeniors ? 2 : 1;
      return { worksheet, taxYear, request: { worksheet: "seniorDeduction", facts: { age, magi, filingStatus, taxYear } } };
    }
  }
}
