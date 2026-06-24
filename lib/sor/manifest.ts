// MODULE 7 — System of Record (INV-5). The firm's source of truth for "what does this
// return actually require, and where does each piece stand?" — with ZERO automation. The
// manifest is just the fetch_requirements ledger (0028 schema) given a vocabulary, a status
// machine, and a completion rollup. A human (admin) seeds it from a template; the agent layer
// later moves items along, but nothing here reaches outside the DB.
//
// Status machine (this module's vocabulary, distinct from the repository's free-text default):
//
//     pending ──► requested ──► received ──► verified
//        │            │             │
//        └────────────┴─────────────┴──────────► na   (not applicable — closes the item)
//
//   pending    seeded, no outreach yet
//   requested  we asked the client / connector for it
//   received   a document arrived and is attached as evidence (evidence_r2_key)
//   verified   a human (or a verified agent check) confirmed the received doc is the right one
//   na         not applicable for this client+period (e.g. "K-1" for a client with no K-1)
//
// Forward-only except `na`, which any non-terminal state may jump to. `verified` and `na` are
// terminal. The guard (assertTransition) refuses an illegal hop so the SoR can't silently skip
// from pending straight to verified without a document ever arriving.

import { and, eq } from "drizzle-orm";
import { fetchRequirements } from "../db/schema";
import { upsertFetchRequirement, listFetchRequirements, setFetchStatus } from "../repository/agent";
import { writeAudit } from "../repository/audit";
import type { Db, Ctx } from "../repository/types";

// ── status vocabulary + machine ────────────────────────────────────────────────

export const MANIFEST_STATUSES = ["pending", "requested", "received", "verified", "na"] as const;
export type ManifestStatus = (typeof MANIFEST_STATUSES)[number];

// Who owns getting the item over the line. admin = the firm's staff manually; agent = a tier-3+
// connector/agent run; user = the taxpayer (client upload / portal).
export const MANIFEST_ASSIGNEES = ["admin", "agent", "user"] as const;
export type ManifestAssignee = (typeof MANIFEST_ASSIGNEES)[number];

// Legal forward transitions. `na` is reachable from any non-terminal state; terminal states
// (verified, na) have no outgoing edges.
const TRANSITIONS: Record<ManifestStatus, ManifestStatus[]> = {
  pending: ["requested", "received", "na"],
  requested: ["received", "na"],
  received: ["verified", "na"],
  verified: [],
  na: [],
};

export function isManifestStatus(s: string): s is ManifestStatus {
  return (MANIFEST_STATUSES as readonly string[]).includes(s);
}

export function canTransition(from: ManifestStatus, to: ManifestStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from].includes(to);
}

export class ManifestTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`illegal manifest transition: ${from} -> ${to}`);
    this.name = "ManifestTransitionError";
  }
}

export function assertTransition(from: ManifestStatus, to: ManifestStatus): void {
  if (!canTransition(from, to)) throw new ManifestTransitionError(from, to);
}

// ── seed templates (data) ──────────────────────────────────────────────────────

export type ManifestTemplateItem = {
  item: string;
  sourceType: "client_upload" | "connector" | "third_party";
  fetchMethod: "manual" | "api" | "email";
  assignedTo: ManifestAssignee;
  /** if false, the firm should mark it `na` when it doesn't apply rather than chase it. */
  required: boolean;
};

export type ManifestTemplate = {
  id: string;
  label: string;
  /** the kind of engagement this applies to — surfaced in the summary, not enforced. */
  appliesTo: "individual" | "business";
  items: ManifestTemplateItem[];
};

// 1040 individual — a solo-EA's standard wage-earner-plus-investments return.
export const TEMPLATE_1040_INDIVIDUAL: ManifestTemplate = {
  id: "1040_individual",
  label: "1040 Individual Return",
  appliesTo: "individual",
  items: [
    { item: "Prior-year 1040", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: true },
    { item: "W-2 (wages)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: true },
    { item: "1099-INT / 1099-DIV", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: false },
    { item: "1099-NEC / 1099-K (self-employment)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: false },
    { item: "1098 (mortgage interest)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: false },
    { item: "1098-T (tuition)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: false },
    { item: "1095-A (marketplace insurance)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: false },
    { item: "Schedule K-1", sourceType: "third_party", fetchMethod: "email", assignedTo: "admin", required: false },
    { item: "ID verification (driver's license)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: true },
    { item: "Engagement letter (signed)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "admin", required: true },
  ],
};

// Monthly close — a bookkeeping engagement's recurring document pull.
export const TEMPLATE_MONTHLY_CLOSE: ManifestTemplate = {
  id: "monthly_close",
  label: "Monthly Bookkeeping Close",
  appliesTo: "business",
  items: [
    { item: "Bank statements (all accounts)", sourceType: "connector", fetchMethod: "api", assignedTo: "agent", required: true },
    { item: "Credit-card statements", sourceType: "connector", fetchMethod: "api", assignedTo: "agent", required: true },
    { item: "Merchant/processor payout report", sourceType: "connector", fetchMethod: "api", assignedTo: "agent", required: false },
    { item: "Payroll register", sourceType: "third_party", fetchMethod: "api", assignedTo: "agent", required: true },
    { item: "Outstanding invoices (A/R)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: false },
    { item: "Outstanding bills (A/P)", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: false },
    { item: "Receipts for expenses > $75", sourceType: "client_upload", fetchMethod: "manual", assignedTo: "user", required: false },
  ],
};

export const MANIFEST_TEMPLATES: Record<string, ManifestTemplate> = {
  [TEMPLATE_1040_INDIVIDUAL.id]: TEMPLATE_1040_INDIVIDUAL,
  [TEMPLATE_MONTHLY_CLOSE.id]: TEMPLATE_MONTHLY_CLOSE,
};

export function getTemplate(id: string): ManifestTemplate | undefined {
  return MANIFEST_TEMPLATES[id];
}

// ── seeding ─────────────────────────────────────────────────────────────────────

export type SeedManifestResult = {
  templateId: string;
  clientId: string;
  period: string;
  seeded: number;
  items: { id: string; item: string; status: ManifestStatus; assignedTo: ManifestAssignee }[];
};

// Populate fetch_requirements for a client+period from a template. Idempotent per
// client+period+item (upsertFetchRequirement upserts), so re-seeding is safe — it re-stamps
// the source/method/assignment but leaves an already-advanced item's identity intact. Every
// seeded row starts in `pending` (this module's vocabulary), NOT the repository's free-text
// "needed" default. RLS scopes the writes to ctx.firm; INV-7 audit is written by the repository
// per row plus one rollup event here.
export async function seedManifestFromTemplate(
  db: Db,
  ctx: Ctx,
  clientId: string,
  period: string,
  template: ManifestTemplate,
): Promise<SeedManifestResult> {
  const items: SeedManifestResult["items"] = [];
  for (const t of template.items) {
    const row = await upsertFetchRequirement(db, ctx, {
      clientId,
      period,
      item: t.item,
      sourceType: t.sourceType,
      fetchMethod: t.fetchMethod,
      assignedTo: t.assignedTo,
      status: "pending",
    });
    items.push({ id: row.id, item: row.item, status: "pending", assignedTo: t.assignedTo });
  }
  await writeAudit(db, ctx, {
    action: "sor.manifest.seed",
    resourceType: "fetch_requirement",
    resourceId: clientId,
    metadata: { template: template.id, period, count: items.length },
  });
  return { templateId: template.id, clientId, period, seeded: items.length, items };
}

// ── status transitions (guarded) ─────────────────────────────────────────────────

// Advance one requirement to a new status, enforcing the manifest machine. Reads the current
// status (RLS-scoped) first so an illegal hop (e.g. pending -> verified) is refused BEFORE any
// write. Moving to `received` should carry the evidence key (the document that arrived); the
// guard does not require it, but a received item with no evidence is a smell the summary surfaces.
export async function advanceRequirement(
  db: Db,
  ctx: Ctx,
  requirementId: string,
  to: ManifestStatus,
  opts?: { evidenceR2Key?: string },
) {
  const [current] = await db
    .select({ id: fetchRequirements.id, status: fetchRequirements.status })
    .from(fetchRequirements)
    .where(eq(fetchRequirements.id, requirementId));
  if (!current) throw new Error("requirement not found (or not in this firm)");
  const from = isManifestStatus(current.status) ? current.status : "pending";
  assertTransition(from, to);
  return setFetchStatus(db, ctx, requirementId, to, { evidenceR2Key: opts?.evidenceR2Key });
}

// Find the requirement that matches a document for a client+period (used by the intake tool to
// link an extracted document to its manifest slot). Matching is case-insensitive substring on the
// item label against a docType hint, plus an optional explicit item match. Returns the first
// non-terminal candidate so a re-uploaded doc doesn't re-open a verified slot.
export async function matchRequirement(
  db: Db,
  clientId: string,
  period: string,
  hint: string,
): Promise<{ id: string; item: string; status: ManifestStatus } | null> {
  const rows = await listFetchRequirements(db, clientId, period);
  const needle = hint.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const r of rows) {
    const hay = r.item.toLowerCase().replace(/[^a-z0-9]/g, "");
    const status = isManifestStatus(r.status) ? r.status : "pending";
    if (status === "verified" || status === "na") continue;
    if (hay.includes(needle) || needle.includes(hay)) {
      return { id: r.id, item: r.item, status };
    }
  }
  return null;
}

// ── completion rollup ─────────────────────────────────────────────────────────

export type CompletionRollup = {
  clientId: string;
  period: string;
  /** items that count toward completion (everything not marked `na`). */
  required: number;
  /** items with a document in hand (received OR verified). */
  received: number;
  /** items a human/agent confirmed. */
  verified: number;
  /** received / required as an integer percent (0–100); 100 when nothing is required. */
  pct: number;
  /** the labels still outstanding (pending or requested) — what the firm still has to chase. */
  missing: string[];
  /** count marked not-applicable, excluded from the denominator. */
  na: number;
};

// The headline number the firm finally gets: how complete is this return's document collection?
// Denominator excludes `na` (not-applicable items don't count against you). `received` counts
// both received and verified (a verified item is also in-hand). RLS-scoped read.
export async function completionFor(
  db: Db,
  clientId: string,
  period: string,
): Promise<CompletionRollup> {
  const rows = await listFetchRequirements(db, clientId, period);
  let required = 0;
  let received = 0;
  let verified = 0;
  let na = 0;
  const missing: string[] = [];
  for (const r of rows) {
    const status = isManifestStatus(r.status) ? r.status : "pending";
    if (status === "na") {
      na += 1;
      continue;
    }
    required += 1;
    if (status === "received" || status === "verified") received += 1;
    if (status === "verified") verified += 1;
    if (status === "pending" || status === "requested") missing.push(r.item);
  }
  const pct = required === 0 ? 100 : Math.round((received / required) * 100);
  return { clientId, period, required, received, verified, pct, missing, na };
}

// A compact, model-friendly summary for the tier-1 manifest-summary tool. Pure text + the
// rollup so a sub-agent can reason about "what's left" without re-reading every row.
export async function manifestSummary(
  db: Db,
  clientId: string,
  period: string,
): Promise<{ rollup: CompletionRollup; lines: string[] }> {
  const rows = await listFetchRequirements(db, clientId, period);
  const rollup = await completionFor(db, clientId, period);
  const lines = rows.map((r) => {
    const status = isManifestStatus(r.status) ? r.status : "pending";
    const ev = r.evidenceR2Key ? " [evidence attached]" : "";
    return `${r.item} — ${status} (${r.assignedTo ?? "unassigned"})${ev}`;
  });
  return { rollup, lines };
}
