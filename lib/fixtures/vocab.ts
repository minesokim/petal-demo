// Petal OS — single status/stage/category vocabulary. Used identically on every surface.
// Canon rules: no other status words exist anywhere in /os; every count derives from
// lib/fixtures/firm.ts via lib/fixtures/derive.ts. See docs/superpowers/plans/2026-06-09-petal-os-overhaul.md.

// ── Demo clock ─────────────────────────────────────────────
export const DEMO_DATE = new Date(2026, 5, 25); // Thursday, June 25, 2026
export const DEMO_DATE_LABEL = "Thursday, June 25, 2026";
export function daysUntil(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  return Math.round((d.getTime() - DEMO_DATE.getTime()) / 86_400_000);
}
export function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function fmtDateYear(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Task status (THE vocabulary) ───────────────────────────
export type TaskStatus =
  | "needs_decision" | "ready_to_approve" | "running" | "scheduled"
  | "waiting_client" | "waiting_third_party" | "done";
export const TASK_STATUS_ORDER: TaskStatus[] = [
  "needs_decision", "ready_to_approve", "running", "scheduled",
  "waiting_client", "waiting_third_party", "done",
];
export const taskStatusMeta: Record<TaskStatus, { label: string; dot: string; verb: string | null }> = {
  needs_decision:      { label: "Needs decision",         dot: "bg-red-500",                verb: "Decide" },
  ready_to_approve:    { label: "Ready to approve",       dot: "bg-amber-500",              verb: "Approve" },
  running:             { label: "Running",                dot: "bg-blue-500",               verb: "View run" },
  scheduled:           { label: "Scheduled",              dot: "bg-[var(--os-ink-subtle)]", verb: null },
  waiting_client:      { label: "Waiting on client",      dot: "bg-slate-400",              verb: "Nudge" },
  waiting_third_party: { label: "Waiting on third party", dot: "bg-slate-400",              verb: null },
  done:                { label: "Done",                   dot: "bg-emerald-500",            verb: null },
};
/** "Needs you" — THE number. Today's headline, the Tasks badge, and Review mode all derive from this. */
export const NEEDS_YOU_STATUSES: TaskStatus[] = ["needs_decision", "ready_to_approve"];

// ── Engagement stages (7 — extensions are a deadline attribute, not a stage) ──
export type Stage =
  | "collecting_docs" | "ready_to_prep" | "in_preparation" | "in_review"
  | "pay_and_sign" | "e_filed" | "accepted";
export const STAGE_ORDER: Stage[] = [
  "collecting_docs", "ready_to_prep", "in_preparation", "in_review",
  "pay_and_sign", "e_filed", "accepted",
];
export const stageMeta: Record<Stage, { label: string; dot: string }> = {
  collecting_docs: { label: "Collecting Docs", dot: "bg-amber-500" },
  ready_to_prep:   { label: "Ready to Prep",   dot: "bg-cyan-500" },
  in_preparation:  { label: "In Preparation",  dot: "bg-blue-500" },
  in_review:       { label: "In Review",       dot: "bg-purple-500" },
  pay_and_sign:    { label: "Pay & Sign",      dot: "bg-orange-500" },
  e_filed:         { label: "E-filed",         dot: "bg-emerald-500" },
  accepted:        { label: "Accepted",        dot: "bg-emerald-600" },
};
export const ACTIVE_STAGES: Stage[] = STAGE_ORDER.filter(s => s !== "e_filed" && s !== "accepted");

// ── Skill categories ↔ the six petal colors (THE legend) ──
export type SkillCategory =
  | "prep_filing" | "signatures_chase" | "books" | "meetings_calls" | "briefs" | "estimates_deadlines";
export const skillCategoryMeta: Record<SkillCategory, { label: string; petal: string; dot: string }> = {
  prep_filing:         { label: "Tax prep & filing",     petal: "/petals/purplepetal.png", dot: "bg-violet-500" },
  signatures_chase:    { label: "Signatures & chase",    petal: "/petals/orangepetal.png", dot: "bg-orange-500" },
  books:               { label: "Books",                 petal: "/petals/cyanpetal.png",   dot: "bg-cyan-500" },
  meetings_calls:      { label: "Meetings & calls",      petal: "/petals/yellowpetal.png", dot: "bg-yellow-500" },
  briefs:              { label: "Briefs",                petal: "/petals/redpetal.png",    dot: "bg-rose-500" },
  estimates_deadlines: { label: "Estimates & deadlines", petal: "/petals/bluepetal.png",   dot: "bg-blue-500" },
};
export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  "prep_filing", "signatures_chase", "books", "meetings_calls", "briefs", "estimates_deadlines",
];

// ── Trust tiers (per skill, 4-step dial) ──────────────────
export type TrustTier = 0 | 1 | 2 | 3;
export const trustTierMeta: Record<TrustTier, { code: string; label: string; blurb: string }> = {
  0: { code: "T0", label: "Suggest",          blurb: "Petal proposes only." },
  1: { code: "T1", label: "Draft",            blurb: "Petal prepares everything; you approve each send." },
  2: { code: "T2", label: "Act after window", blurb: "Petal acts after 24h unless you stop it." },
  3: { code: "T3", label: "Act & report",     blurb: "Petal acts and logs." },
};
export const TRUST_TIER_ORDER: TrustTier[] = [0, 1, 2, 3];

// ── Expected-doc status ────────────────────────────────────
export type ExpectedDocStatus = "have" | "requested" | "needs_review" | "na";
export const expectedDocMeta: Record<ExpectedDocStatus, { label: string; dot: string }> = {
  have:         { label: "Have",         dot: "bg-emerald-500" },
  needs_review: { label: "Needs review", dot: "bg-amber-500" },
  requested:    { label: "Requested",    dot: "bg-[var(--os-ink-subtle)]" },
  na:           { label: "N/A",          dot: "bg-[var(--os-border-strong)]" },
};

// ── Client health (ONE function's vocabulary — Today + Practice share it) ──
export type Health = "at_risk" | "watch" | "healthy";
export const healthMeta: Record<Health, { label: string; dot: string; text: string }> = {
  at_risk: { label: "At risk", dot: "bg-red-500",     text: "text-[var(--os-danger)]" },
  watch:   { label: "Watch",   dot: "bg-amber-500",   text: "text-[var(--os-warning)]" },
  healthy: { label: "Healthy", dot: "bg-emerald-500", text: "text-[var(--os-success)]" },
};

// ── ROI: minutes returned per activity kind ────────────────
export type ActivityKind =
  | "draft" | "send" | "doc_collected" | "extraction" | "reconciliation"
  | "efile" | "notice_draft" | "brief" | "transcript_check" | "approval" | "edit";
export const MINUTES_RETURNED: Record<ActivityKind, number> = {
  draft: 10, send: 2, doc_collected: 5, extraction: 9, reconciliation: 35,
  efile: 25, notice_draft: 55, brief: 20, transcript_check: 4, approval: 0, edit: 0,
};

export function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
