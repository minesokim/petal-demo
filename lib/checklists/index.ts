// CAPABILITY 6 — Tax review checklists (the chunked-parallel pattern, INV-6). A checklist is a
// flat list of items; runChecklist fans each item out to a BOUNDED sub-agent (the planner ->
// sub-agent decomposition INV-6 calls for), gathers a structured {item, status, evidence,
// citations?} verdict per item, and aggregates them into a single review-report artifact
// (createArtifact type "report").
//
// Grounding (INV-1): an item that makes a TAX ASSERTION is verified through lib/research
// (researchAnswer) — the verdict's citations are the authority the research layer returned, never
// model memory. Non-research items (presence/consistency checks over the manifest or extracted
// fields) carry their own evidence.
//
// runtime seam: each item runs via a runSubAgent function whose signature mirrors
// lib/agent/runtime.ts. That module is not landed yet, so runChecklist takes runSubAgent as an
// injected dependency (the runtime wires the real one; tests inject a deterministic stub). When
// the runtime ships, its runSubAgent is passed straight through — no shape change here. See the
// CONTRACT note on ChecklistSubAgent below.

import type { AIProvider } from "../ai/provider";
import { researchAnswer } from "../research/engine";
import type { SourcedAnswer } from "../research/engine";
import type { Jurisdiction } from "../tax/types";
import { createArtifact } from "../repository/agent";
import type { Db, Ctx } from "../repository/types";

// ── checklist shape ──────────────────────────────────────────────────────────

export type ChecklistItemKind =
  // a tax-law assertion to verify against authority (grounded via researchAnswer)
  | "tax_assertion"
  // a presence/consistency check the sub-agent evaluates from supplied context
  | "review_check";

export type ChecklistItem = {
  id: string;
  prompt: string; // the question / assertion the reviewer must resolve
  kind: ChecklistItemKind;
  /** for tax_assertion items, the research framing. */
  research?: { taxYear: number; jurisdiction: Jurisdiction };
};

export type Checklist = {
  id: string;
  label: string;
  description: string;
  items: ChecklistItem[];
};

// ── per-item verdict ─────────────────────────────────────────────────────────

export type ItemStatus = "pass" | "fail" | "flag";

export type ChecklistCitation = {
  authority: string;
  cite: string;
  sourceUrl: string;
};

export type ItemVerdict = {
  item: string; // the item id
  status: ItemStatus;
  evidence: string; // the one-line basis for the verdict
  citations?: ChecklistCitation[]; // present for grounded tax_assertion verdicts
};

// CONTRACT — the sub-agent seam. The runtime's runSubAgent (lib/agent/runtime.ts) resolves ONE
// bounded unit of work and returns a verdict. Signature mirrors the runtime contract:
//   runSubAgent({ item, context }) -> Promise<ItemVerdict>
// When the runtime lands, pass its runSubAgent here directly. Until then, the default below
// (researchSubAgent) covers tax_assertion items via researchAnswer; review_check items must be
// resolved by an injected runSubAgent (no generic resolver exists for them yet).
export type ChecklistSubAgentArgs = {
  item: ChecklistItem;
  /** free-form context the runtime would assemble (manifest summary, extracted fields, …). */
  context?: Record<string, unknown>;
};
export type ChecklistSubAgent = (args: ChecklistSubAgentArgs) => Promise<ItemVerdict>;

// Map a research bucket to a checklist verdict. A grounded `answer` is a pass; a `hedge`/
// `abstain` (calibrated uncertainty) is a flag for human judgement; a `coverage_gap` is a flag
// too — the reviewer must check primary authority directly (never silently passed).
function bucketToStatus(a: SourcedAnswer): ItemStatus {
  if (a.bucket === "answer") return "pass";
  return "flag"; // hedge | abstain | coverage_gap all surface for human review
}

// The default research-backed sub-agent for tax_assertion items. Grounds the assertion through
// researchAnswer (INV-1), carrying the returned citations onto the verdict. judge is a SEPARATE
// model per the research contract (Opus vs the proposer's Sonnet) when provided.
export function makeResearchSubAgent(
  proposer: AIProvider,
  judge?: AIProvider,
): ChecklistSubAgent {
  return async ({ item }) => {
    if (item.kind !== "tax_assertion" || !item.research) {
      // No generic resolver for review_check items; the runtime injects that path.
      return { item: item.id, status: "flag", evidence: "no resolver for this item kind" };
    }
    const ans = await researchAnswer(proposer, judge, item.prompt, {
      taxYear: item.research.taxYear,
      jurisdiction: item.research.jurisdiction,
      scope: "synthetic", // public-authority research; §7216-clear
    });
    return {
      item: item.id,
      status: bucketToStatus(ans),
      evidence: ans.answer.slice(0, 400),
      citations: ans.citations.map((c) => ({
        authority: c.authority,
        cite: c.cite,
        sourceUrl: c.sourceUrl,
      })),
    };
  };
}

// ── report ───────────────────────────────────────────────────────────────────

export type ChecklistReport = {
  checklistId: string;
  clientId: string;
  total: number;
  pass: number;
  fail: number;
  flag: number;
  verdicts: ItemVerdict[];
};

export type RunChecklistOpts = {
  /** the sub-agent that resolves each item (the runtime's runSubAgent, or a test stub). */
  runSubAgent: ChecklistSubAgent;
  /** context handed to every sub-agent (manifest summary, extracted fields, …). */
  context?: Record<string, unknown>;
  /** bound on concurrent sub-agents (INV-6 compute budget). Default 4. */
  concurrency?: number;
  taskId: string; // the agent_task this review runs under (artifact FK)
};

// Run a worker pool with a bounded concurrency (INV-6) — not an unbounded Promise.all over every
// item. Preserves input order in the results array.
async function mapBounded<I, O>(items: I[], limit: number, fn: (item: I, i: number) => Promise<O>): Promise<O[]> {
  const out = new Array<O>(items.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  };
  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

// Fan out the checklist's items to bounded parallel sub-agents, aggregate the verdicts, and
// persist a `report` artifact (createArtifact, RLS-scoped + audited). Returns the report. The
// artifact's content is the full report so the review is durable + inspectable.
export async function runChecklist(
  db: Db,
  ctx: Ctx,
  clientId: string,
  checklist: Checklist,
  opts: RunChecklistOpts,
): Promise<{ report: ChecklistReport; artifactId: string }> {
  const verdicts = await mapBounded(
    checklist.items,
    opts.concurrency ?? 4,
    (item) => opts.runSubAgent({ item, context: opts.context }),
  );

  const report: ChecklistReport = {
    checklistId: checklist.id,
    clientId,
    total: verdicts.length,
    pass: verdicts.filter((v) => v.status === "pass").length,
    fail: verdicts.filter((v) => v.status === "fail").length,
    flag: verdicts.filter((v) => v.status === "flag").length,
    verdicts,
  };

  const artifact = await createArtifact(db, ctx, {
    taskId: opts.taskId,
    clientId,
    type: "report",
    content: report as unknown as Record<string, unknown>,
  });

  return { report, artifactId: artifact.id };
}

// ── example checklist (data) ──────────────────────────────────────────────────

// A real 1040 pre-file review: six items a preparer runs before transmitting a return. The
// tax_assertion items are framed as public-authority questions so researchAnswer can ground
// them; the review_check items are presence/consistency checks the runtime resolves from the
// assembled context (manifest + extracted fields).
export const CHECKLIST_1040_PREFILE: Checklist = {
  id: "1040_prefile_review",
  label: "1040 Pre-File Review",
  description: "Six checks a preparer runs before transmitting an individual return.",
  items: [
    {
      id: "filing_status_standard_deduction",
      kind: "tax_assertion",
      prompt:
        "For the applicable tax year, is the standard deduction amount applied consistent with the taxpayer's filing status under current federal law?",
      research: { taxYear: 2025, jurisdiction: "federal" },
    },
    {
      id: "ctc_eligibility",
      kind: "tax_assertion",
      prompt:
        "Does each child claimed for the Child Tax Credit meet the current age, relationship, residency, and SSN requirements under federal law?",
      research: { taxYear: 2025, jurisdiction: "federal" },
    },
    {
      id: "eitc_due_diligence",
      kind: "tax_assertion",
      prompt:
        "Are the §6695(g) paid-preparer EITC due-diligence requirements (Form 8867, computation worksheets, knowledge requirement) satisfied for this return?",
      research: { taxYear: 2025, jurisdiction: "federal" },
    },
    {
      id: "saltt_cap",
      kind: "tax_assertion",
      prompt:
        "Is the state-and-local-tax deduction on Schedule A within the current federal cap for the applicable tax year?",
      research: { taxYear: 2025, jurisdiction: "federal" },
    },
    {
      id: "all_income_documents_received",
      kind: "review_check",
      prompt:
        "Are all expected income documents (W-2, 1099 series) in the manifest marked received or verified, with none still outstanding?",
    },
    {
      id: "id_and_engagement_on_file",
      kind: "review_check",
      prompt:
        "Are the client's ID verification and a signed engagement letter on file (manifest items received/verified) before transmitting?",
    },
  ],
};

export const CHECKLISTS: Record<string, Checklist> = {
  [CHECKLIST_1040_PREFILE.id]: CHECKLIST_1040_PREFILE,
};

export function getChecklist(id: string): Checklist | undefined {
  return CHECKLISTS[id];
}
