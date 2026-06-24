// The evidenced review artifact — the standard shape attached to every staged action so a human
// verifies against evidence (each output field -> its source) in seconds instead of redoing the
// work. Builders map REAL producer data into this one shape; there is always an artifact (the
// generic builder uses the action's own args), so a proposal is never un-reviewable.
//
// Pure + type-only imports (erased at compile time) so this stays cheap to test and free of the
// heavy research/integration runtime. See docs/superpowers/specs/2026-06-24-risk-gate-*.

import type { OltStagePlan } from "../integrations/olt";
import type { SourcedAnswer } from "../research/engine";

export type EvidenceSource = {
  kind: "document" | "extraction" | "bank_txn" | "ledger" | "research" | "intake" | "prior_return" | "message" | "manual";
  ref: string; // id / locator (doc id, txn id, citation url, …)
  label: string; // human label, e.g. "W-2 — Hartline Logistics"
  detail?: string; // e.g. "box 1"
};

export type EvidencedField = {
  label: string; // "Wages (1040 line 1a)"
  value: string; // staged value (decimal string for money — never float)
  source: EvidenceSource;
  confidence?: number | null;
  note?: string;
};

export type ReviewArtifact = {
  summary: string;
  fields: EvidencedField[];
  research?: {
    bucket: "answer" | "hedge" | "coverage_gap" | "abstain";
    citations: { label: string; ref: string }[];
    reviewNotes: string[];
    currencyNote?: string;
  };
  warnings: string[];
};

/** Recon match evidence (shape produced by the deterministic matcher, fed to the staged write). */
export type ReconEvidence = {
  matchType: "bank_to_ledger" | "manual_journal";
  bankTxnId: string;
  ledgerItemId: string;
  bankAmount: string;
  ledgerAmount: string;
  matchScore: number;
  matchReasons: string[];
  mismatches: string[];
};

// Parse an OLT provenance string ("extracted:W-2 box 1", "From the 2024 return", …) into a source.
function oltSource(raw: string): EvidenceSource {
  const ex = /^extracted:\s*(.+)$/i.exec(raw);
  if (ex) return { kind: "extraction", ref: ex[1], label: ex[1] };
  if (/intake/i.test(raw)) return { kind: "intake", ref: raw, label: raw };
  if (/return/i.test(raw)) return { kind: "prior_return", ref: raw, label: raw };
  return { kind: "document", ref: raw, label: raw };
}

export function artifactFromOltPlan(plan: OltStagePlan): ReviewArtifact {
  return {
    summary: `Draft the ${plan.ref.taxYear} return for ${plan.ref.clientId} in OLT (${plan.entries.length} field${plan.entries.length === 1 ? "" : "s"})`,
    fields: plan.entries.map((e) => ({
      label: `${e.screen} · ${e.field}`,
      value: e.value,
      source: oltSource(e.source),
    })),
    warnings: [],
  };
}

export function artifactFromReconMatch(ev: ReconEvidence): ReviewArtifact {
  return {
    summary: `Reconcile bank txn ${ev.bankTxnId} ↔ ledger ${ev.ledgerItemId}`,
    fields: [
      {
        label: "Bank transaction",
        value: ev.bankAmount,
        confidence: ev.matchScore,
        source: { kind: "bank_txn", ref: ev.bankTxnId, label: `Bank txn ${ev.bankTxnId}`, detail: ev.matchReasons.join(", ") || undefined },
      },
      {
        label: "Ledger entry",
        value: ev.ledgerAmount,
        confidence: ev.matchScore,
        source: { kind: "ledger", ref: ev.ledgerItemId, label: `Ledger ${ev.ledgerItemId}` },
      },
    ],
    warnings: [...ev.mismatches],
  };
}

export function artifactFromResearch(answer: SourcedAnswer): ReviewArtifact {
  const warnings: string[] = [];
  if (answer.bucket !== "answer") {
    warnings.push(
      answer.bucket === "abstain" ? "Research abstained — no groundable authority; verify manually"
      : answer.bucket === "coverage_gap" ? "Research coverage gap — rule not retrieved; verify manually"
      : "Research is indeterminate (facts-and-circumstances) — confirm the factors",
    );
  }
  const firstSentence = (answer.answer || "").split(/(?<=\.)\s/)[0] || "Tax research position";
  return {
    summary: firstSentence,
    fields: [],
    research: {
      bucket: answer.bucket,
      citations: answer.citations.map((c) => ({ label: c.cite, ref: c.sourceUrl || c.chunkId })),
      reviewNotes: answer.reviewNotes ?? [],
      currencyNote: answer.currencyNote || undefined,
    },
    warnings,
  };
}

export function artifactGeneric(toolName: string, summary: string, args: Record<string, unknown>): ReviewArtifact {
  const entries = Object.entries(args).filter(([, v]) => v !== undefined && v !== null && v !== "");
  const fields: EvidencedField[] = entries.map(([k, v]) => ({
    label: k,
    value: typeof v === "string" ? v : JSON.stringify(v),
    source: { kind: "manual", ref: toolName, label: "Entered for this action" },
  }));
  if (fields.length === 0) {
    fields.push({ label: "action", value: toolName, source: { kind: "manual", ref: toolName, label: "Entered for this action" } });
  }
  return { summary, fields, warnings: [] };
}
