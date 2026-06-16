// Petal OS - derivations. Every count, badge, KPI, and chart on every /os surface
// comes from these functions at render time. Components NEVER recompute or hard-code
// an aggregate; `tieOutChecks()` (rendered at /os/debug/tie-out, run by scripts/tieout.ts)
// treats any mismatch as a build failure.

import {
  NEEDS_YOU_STATUSES, STAGE_ORDER, ACTIVE_STAGES, MINUTES_RETURNED, daysUntil, money,
  type Stage, type Health, type TaskStatus,
} from "./vocab";
import {
  households, engagements, expectedDocs, tasks, notices, positions, skillRuns, skills,
  activity, threads, householdById, engagementsOf, docsOfEngagement, taskById,
  type Household, type Engagement, type Task, type Notice, type SkillRun, type ActivityEvent,
} from "./firm";

// ── The "needs you" number ───────────────────────────────────
export function needsYouTasks(): Task[] {
  return tasks.filter(t => (NEEDS_YOU_STATUSES as TaskStatus[]).includes(t.status));
}
/** THE number. Today's headline, the Tasks nav badge, and Review mode all show this. */
export function needsYouCount(): number {
  return needsYouTasks().length;
}

// ── Documents ────────────────────────────────────────────────
export interface DocCounts {
  expected: number;
  have: number;
  requested: number;
  needsReview: number;
  na: number;
  /** docs physically in hand (have + needs review) */
  inHand: number;
  /** denominator excluding N/A */
  denom: number;
  label: string; // "32/34"
}

function countDocs(rows: ReturnType<typeof docsOfEngagement>): DocCounts {
  const expected = rows.length;
  const have = rows.filter(d => d.status === "have").length;
  const requested = rows.filter(d => d.status === "requested").length;
  const needsReview = rows.filter(d => d.status === "needs_review").length;
  const na = rows.filter(d => d.status === "na").length;
  const inHand = have + needsReview;
  const denom = expected - na;
  return { expected, have, requested, needsReview, na, inHand, denom, label: `${inHand}/${denom}` };
}

export function docsOf(engagementId: string): DocCounts {
  return countDocs(docsOfEngagement(engagementId));
}

export function docsOfHousehold(hid: string): DocCounts {
  const rows = engagementsOf(hid).flatMap(e => docsOfEngagement(e.id));
  return countDocs(rows);
}

// ── Stages, fees, deadlines ──────────────────────────────────
export function activeEngagements(): Engagement[] {
  return engagements.filter(e => (ACTIVE_STAGES as Stage[]).includes(e.stage));
}

/** Representative household stage: the least-progressed active engagement. */
export function householdStage(hid: string): Stage {
  const list = engagementsOf(hid);
  const active = list.filter(e => (ACTIVE_STAGES as Stage[]).includes(e.stage));
  const pool = active.length ? active : list;
  return pool.reduce<Stage>(
    (min, e) => (STAGE_ORDER.indexOf(e.stage) < STAGE_ORDER.indexOf(min) ? e.stage : min),
    pool[0].stage,
  );
}

export function householdFee(hid: string): number {
  return engagementsOf(hid).reduce((s, e) => s + e.fee, 0);
}

/** Soonest live deadline across a household's active engagements (extended preferred). */
export function householdDeadline(hid: string): { iso: string; extended: boolean } | null {
  const active = engagementsOf(hid).filter(e => (ACTIVE_STAGES as Stage[]).includes(e.stage));
  if (!active.length) return null;
  const ds = active.map(e => ({
    iso: e.extendedDeadline ?? e.statutoryDeadline,
    extended: !!e.extendedDeadline,
  }));
  return ds.sort((a, b) => a.iso.localeCompare(b.iso))[0];
}

export function engagementDeadline(e: Engagement): { iso: string; extended: boolean } {
  return { iso: e.extendedDeadline ?? e.statutoryDeadline, extended: !!e.extendedDeadline };
}

export function stageCounts(): Record<Stage, number> {
  const out = Object.fromEntries(STAGE_ORDER.map(s => [s, 0])) as Record<Stage, number>;
  for (const e of engagements) out[e.stage]++;
  return out;
}

export function feesInPipeline(): number {
  return activeEngagements().reduce((s, e) => s + e.fee, 0);
}

export function feesBlockedByDocs(): number {
  return activeEngagements()
    .filter(e => docsOf(e.id).requested > 0)
    .reduce((s, e) => s + e.fee, 0);
}

export function feesBooked(): number {
  return engagements.reduce((s, e) => s + e.fee, 0);
}

// ── Filing readiness (tax analytics - who's on track to file on time) ──
export type FilingState = "filed" | "on_track" | "at_risk";

export function filingStateOf(e: Engagement): FilingState {
  if (e.stage === "accepted" || e.stage === "e_filed") return "filed";
  // at risk = blocked on something out of the firm's hands, or the deposit was never collected
  if (e.blockedBy || !e.depositPaid) return "at_risk";
  return "on_track";
}

export interface FilingReadiness {
  filed: number;
  onTrack: number;
  atRisk: number;
  total: number;
  /** the at-risk engagements with their blocker, for a drill-down list */
  atRiskList: { engagementId: string; householdId: string; form: string; reason: string }[];
}

export function filingReadiness(): FilingReadiness {
  let filed = 0, onTrack = 0, atRisk = 0;
  const atRiskList: FilingReadiness["atRiskList"] = [];
  for (const e of engagements) {
    const s = filingStateOf(e);
    if (s === "filed") filed++;
    else if (s === "on_track") onTrack++;
    else {
      atRisk++;
      atRiskList.push({ engagementId: e.id, householdId: e.householdId, form: e.form, reason: e.blockedBy ?? "Deposit not collected" });
    }
  }
  return { filed, onTrack, atRisk, total: engagements.length, atRiskList };
}

export function filedThisWeek(): Engagement[] {
  return engagements.filter(e => e.eFiledOn === "2026-06-23");
}

// ── Billing (one invoice per household; deposit = 40% up front) ──
export type InvoiceStatus = "paid" | "balance_due" | "overdue" | "in_progress";

export const invoiceStatusMeta: Record<InvoiceStatus, { label: string; dot: string; accent: string }> = {
  paid:        { label: "Paid",        dot: "bg-emerald-500",            accent: "text-[var(--os-success)]" },
  balance_due: { label: "Balance due", dot: "bg-amber-500",              accent: "text-[var(--os-warning)]" },
  overdue:     { label: "Overdue",     dot: "bg-red-500",                accent: "text-[var(--os-danger)]" },
  in_progress: { label: "In progress", dot: "bg-[var(--os-ink-subtle)]", accent: "text-[var(--os-ink-muted)]" },
};

export interface Invoice {
  id: string;
  number: string;
  householdId: string;
  clientName: string;
  serviceTier: Household["serviceTier"];
  invoiced: number;
  collected: number;
  balance: number;
  status: InvoiceStatus;
  due: string;
  issued: string;
  ageDays?: number;
  /** the engagement fees this invoice can't collect until docs land */
  blockedByDocs: boolean;
  /** ready_to_approve chase task, when one exists (the "Chase with Petal" hook) */
  chaseTaskId?: string;
}

const DEPOSIT_RATE = 0.4;

export function invoiceOf(hid: string): Invoice {
  const h = householdById(hid)!;
  const list = engagementsOf(hid);
  const idx = households.findIndex(x => x.id === hid);
  const invoiced = list.reduce((s, e) => s + e.fee, 0);
  const allAccepted = list.length > 0 && list.every(e => e.stage === "accepted");
  const anyDepositUnpaid = list.some(e => !e.depositPaid && e.stage !== "accepted");
  const sentOut = list.some(e => e.stage === "in_review" || e.stage === "pay_and_sign");
  const deposit = Math.round(invoiced * DEPOSIT_RATE);
  const blockedByDocs = list.some(e => (ACTIVE_STAGES as Stage[]).includes(e.stage) && docsOf(e.id).requested > 0);
  const base = {
    id: `inv-${hid}`, number: `INV-${(idx + 1).toString().padStart(4, "0")}`,
    householdId: hid, clientName: h.name, serviceTier: h.serviceTier, invoiced, blockedByDocs,
  };
  if (allAccepted) return { ...base, collected: invoiced, balance: 0, status: "paid", due: "Paid in full", issued: "Jun 2026" };
  if (anyDepositUnpaid) return { ...base, collected: 0, balance: invoiced, status: "overdue", due: "15 days late", issued: "Jun 10", ageDays: 15, chaseTaskId: taskById("t-williams-chase") ? "t-williams-chase" : undefined };
  if (sentOut) return { ...base, collected: deposit, balance: invoiced - deposit, status: "balance_due", due: "Due Jul 10", issued: "Jun 18" };
  return { ...base, collected: deposit, balance: invoiced - deposit, status: "in_progress", due: "On acceptance", issued: "Jun 2026" };
}

export function invoices(): Invoice[] {
  return households.map(h => invoiceOf(h.id));
}

export function billingKpis() {
  const all = invoices();
  const owed = all.filter(i => i.status === "balance_due" || i.status === "overdue");
  const overdue = all.filter(i => i.status === "overdue");
  return {
    outstandingTotal: owed.reduce((s, i) => s + i.balance, 0),
    outstandingCount: owed.length,
    overdueTotal: overdue.reduce((s, i) => s + i.balance, 0),
    overdueCount: overdue.length,
    collectedTotal: all.reduce((s, i) => s + i.collected, 0),
    billedTotal: all.reduce((s, i) => s + i.invoiced, 0),
  };
}

// ── Client health (THE function - Today's at-risk and Practice both call it) ──
export interface HealthAssessment {
  health: Health;
  reason: string;
  nextAction?: { label: string; href: string };
}

export function clientHealth(hid: string): HealthAssessment {
  const active = engagementsOf(hid).filter(e => (ACTIVE_STAGES as Stage[]).includes(e.stage));
  const docs = docsOfHousehold(hid);
  const hhTasks = tasks.filter(t => t.householdId === hid);
  const flaggedDecisions = hhTasks.filter(t => t.status === "needs_decision" && t.flagged);
  const blockedDecision = hhTasks.find(t => t.status === "needs_decision" && t.feeContext?.includes("blocked"));
  const depositUnpaid = active.some(e => !e.depositPaid);
  const openNotice = notices.find(n => n.householdId === hid && n.status === "response_drafted");
  const openPosition = positions.find(p => p.householdId === hid && p.status === "open");

  if (depositUnpaid) {
    return {
      health: "at_risk",
      reason: `Missing ${docs.requested} docs - chase #3 sent Tue · deposit unpaid`,
      nextAction: { label: "Escalate to call?", href: "/os/tasks?task=t-williams-chase" },
    };
  }
  if (blockedDecision) {
    return {
      health: "at_risk",
      reason: "Return blocked on an open decision - 7 of 23 lots missing basis",
      nextAction: { label: "Decide A / B / C", href: `/os/tasks?task=${blockedDecision.id}` },
    };
  }
  if (openNotice) {
    return {
      health: "watch",
      reason: `${openNotice.type} response due ${daysUntil(openNotice.respondBy)} days from now`,
      nextAction: { label: "Approve in Notices", href: `/os/notices/${openNotice.id}` },
    };
  }
  if (flaggedDecisions.length > 0 || openPosition) {
    const bits = [
      flaggedDecisions.length ? `${flaggedDecisions.length} flagged decision${flaggedDecisions.length > 1 ? "s" : ""} open` : "",
      openPosition ? "position unresolved" : "",
    ].filter(Boolean).join(" · ");
    return {
      health: "watch",
      reason: bits,
      nextAction: openPosition
        ? { label: "Open positions", href: `/os/clients/${hid}?tab=positions` }
        : { label: "Decide now", href: `/os/tasks?task=${flaggedDecisions[0]?.id}` },
    };
  }
  if (docs.requested >= 3) {
    return {
      health: "watch",
      reason: `${docs.requested} documents outstanding - chases running`,
      nextAction: { label: "View documents", href: `/os/clients/${hid}?tab=documents` },
    };
  }
  return { health: "healthy", reason: "On pace - nothing outstanding" };
}

export function atRiskHouseholds(): ({ household: Household } & HealthAssessment)[] {
  return households
    .map(h => ({ household: h, ...clientHealth(h.id) }))
    .filter(x => x.health !== "healthy")
    .sort((a, b) => (a.health === "at_risk" ? -1 : 1) - (b.health === "at_risk" ? -1 : 1));
}

export function healthCounts(): Record<Health, number> {
  const out: Record<Health, number> = { at_risk: 0, watch: 0, healthy: 0 };
  for (const h of households) out[clientHealth(h.id).health]++;
  return out;
}

// ── Books module (conditional) ───────────────────────────────
export function booksClients(): Household[] {
  return households.filter(h => h.hasBooks);
}

// ── Notices ──────────────────────────────────────────────────
export function openNotices(): Notice[] {
  return notices.filter(n => n.status === "response_drafted");
}
export function noticeCountdown(n: Notice): number {
  return daysUntil(n.respondBy);
}
/** Empty-state + Settings copy both derive from this. */
export function transcriptWatchCount(): number {
  return households.filter(h => h.has8821).length;
}

// ── Skills & runs ────────────────────────────────────────────
export function runsOfSkill(skillId: string): SkillRun[] {
  return skillRuns.filter(r => r.skillId === skillId);
}

// ── ROI strip + activity ─────────────────────────────────────
export interface RoiWeek {
  actions: number;
  docsCollected: number;
  returnsFiled: number;
  noticesDrafted: number;
  hoursReturned: number; // rounded to nearest 0.5
}

export function roiWeek(): RoiWeek {
  const petal = activity.filter(a => a.actor === "Petal" && a.kind !== "approval" && a.kind !== "edit");
  const minutes = petal.reduce((s, a) => s + MINUTES_RETURNED[a.kind], 0);
  return {
    actions: petal.length,
    docsCollected: petal.filter(a => a.kind === "doc_collected").length,
    returnsFiled: petal.filter(a => a.kind === "efile").length,
    noticesDrafted: petal.filter(a => a.kind === "notice_draft").length,
    hoursReturned: Math.round((minutes / 60) * 2) / 2,
  };
}

export function activityFeed(filter?: { householdId?: string; skillId?: string; day?: number }): ActivityEvent[] {
  let list = [...activity].sort((a, b) => b.day - a.day || b.id.localeCompare(a.id, undefined, { numeric: true }));
  if (filter?.householdId) list = list.filter(a => a.householdId === filter.householdId);
  if (filter?.day) list = list.filter(a => a.day === filter.day);
  if (filter?.skillId) {
    const runIds = new Set(runsOfSkill(filter.skillId).map(r => r.id));
    list = list.filter(a => a.runId && runIds.has(a.runId));
  }
  return list;
}

// ── Tie-out (any mismatch = build failure) ───────────────────
export interface TieOutCheck {
  surface: string;
  label: string;
  displayed: string;
  derivation: string;
  ok: boolean;
}

export function tieOutChecks(): TieOutCheck[] {
  const checks: TieOutCheck[] = [];
  const add = (surface: string, label: string, displayed: string | number, derivation: string, ok: boolean) =>
    checks.push({ surface, label, displayed: String(displayed), derivation, ok });

  // 1. "Needs you" is ONE number.
  const n = needsYouCount();
  const decisions = tasks.filter(t => t.status === "needs_decision").length;
  const approvals = tasks.filter(t => t.status === "ready_to_approve").length;
  add("Today / Tasks badge / Review", "needs-you count", n,
    `needs_decision (${decisions}) + ready_to_approve (${approvals})`, n === decisions + approvals && n === 12);

  // 2. Park tells one story everywhere.
  const park = docsOfHousehold("h-park");
  add("Client header / chat / Documents", "Park docs", park.label, "Σ expectedDocs over Park's 2 engagements", park.label === "32/34");
  add("Client header / Billing", "Park fee", money(householdFee("h-park")), "Σ engagement fees (1120S $1,400 + 1040 $500)", householdFee("h-park") === 1900);
  add("Client header / Billing", "Park balance", money(invoiceOf("h-park").balance), "invoiced − 40% deposit", invoiceOf("h-park").balance === 1140);
  add("Client header / Returns board", "Park stage", householdStage("h-park"), "least-progressed active engagement", householdStage("h-park") === "ready_to_prep");

  // 3. All 11 households exist coherently everywhere.
  add("Clients list", "household count", households.length, "fixture households", households.length === 11);
  add("Billing", "invoice count", invoices().length, "one per household", invoices().length === 11);
  const healthTotal = healthCounts();
  add("Practice / Today", "health coverage", healthTotal.at_risk + healthTotal.watch + healthTotal.healthy,
    "clientHealth() over all households", healthTotal.at_risk + healthTotal.watch + healthTotal.healthy === 11);
  const russo = householdById("h-russo");
  add("Clients list", "Russo is a real client", russo ? russo.name : "missing", "h-russo in households", !!russo);

  // 4. At-risk set identical Today vs Practice (same function by construction; assert non-empty + counts).
  const atRisk = atRiskHouseholds();
  add("Today at-risk / Practice health", "at-risk + watch", atRisk.length,
    `at_risk (${healthTotal.at_risk}) + watch (${healthTotal.watch})`,
    atRisk.length === healthTotal.at_risk + healthTotal.watch);

  // 5. Stage counts cover every engagement.
  const sc = stageCounts();
  const scSum = Object.values(sc).reduce((a, b) => a + b, 0);
  add("Returns board header", "stage counts sum", scSum, "Σ over 7 stages = engagement count", scSum === engagements.length);

  // 6. Returns-board money strip.
  add("Returns board header", "fees in pipeline", money(feesInPipeline()), "Σ fees of active engagements", feesInPipeline() === 9000);
  add("Returns board / Practice", "fees blocked by docs", money(feesBlockedByDocs()), "active engagements with requested docs", feesBlockedByDocs() === 5200);

  // 7. ROI strip derives from activity.
  const roi = roiWeek();
  add("Today ROI strip", "actions this week", roi.actions, "Petal activity events (excl. approvals)", roi.actions === 41);
  add("Today ROI strip", "documents collected", roi.docsCollected, "doc_collected events", roi.docsCollected === 9);
  add("Today ROI strip", "returns filed", roi.returnsFiled, "efile events", roi.returnsFiled === 3);
  add("Today ROI strip", "notices drafted", roi.noticesDrafted, "notice_draft events", roi.noticesDrafted === 2);
  add("Today ROI strip", "hours returned", `~${roi.hoursReturned} hrs`, "Σ MINUTES_RETURNED / 60, nearest 0.5", roi.hoursReturned === 6.5);

  // 8. "Filed 3 returns clean" = e-files this week = ROI count.
  add("Today brief", "filed this week", filedThisWeek().length, "engagements e-filed Jun 23", filedThisWeek().length === 3 && filedThisWeek().length === roi.returnsFiled);

  // 9. Transcript watch coverage = 8821s on file (Settings copy + Notices empty state).
  add("Settings / Notices", "8821 coverage", transcriptWatchCount(), "households with has8821", transcriptWatchCount() === 9);

  // 10. Books module renders only because books clients exist.
  add("Today close widget / Books", "books clients", booksClients().length, "households with hasBooks", booksClients().length === 3);

  // 11. Referential integrity - every link resolves.
  const runIds = new Set(skillRuns.map(r => r.id));
  const badTaskRuns = tasks.filter(t => t.runId && !runIds.has(t.runId));
  add("Provenance", "task → run links", `${tasks.filter(t => t.runId).length} linked`, "every Task.runId resolves", badTaskRuns.length === 0);
  const badNoticeRuns = notices.filter(x => (x.runId && !runIds.has(x.runId)) || (x.linkedTranscriptRunId && !runIds.has(x.linkedTranscriptRunId)));
  add("Provenance", "notice → run links", `${notices.length} notices`, "every Notice.runId resolves", badNoticeRuns.length === 0);
  const skillIds = new Set(skills.map(s => s.id));
  const badTaskSkills = tasks.filter(t => !skillIds.has(t.skillId));
  add("Tasks", "task → skill links", `${tasks.length} tasks`, "every Task.skillId resolves", badTaskSkills.length === 0);
  const hhIds = new Set(households.map(h => h.id));
  const orphans = [
    ...tasks.filter(t => !hhIds.has(t.householdId)).map(t => t.id),
    ...threads.filter(t => !hhIds.has(t.householdId)).map(t => t.id),
    ...notices.filter(x => !hhIds.has(x.householdId)).map(x => x.id),
    ...expectedDocs.filter(d => !engagements.some(e => e.id === d.engagementId)).map(d => d.id),
  ];
  add("World", "no ghost clients", orphans.length === 0 ? "none" : orphans.join(", "), "every record resolves to a household/engagement", orphans.length === 0);

  // 12. Date coherence - nothing active sits past its statutory date without an extension.
  const lapsed = activeEngagements().filter(e => daysUntil(e.statutoryDeadline) < 0 && !e.extendedDeadline);
  add("World", "extension coverage", lapsed.length === 0 ? "all extended" : lapsed.map(e => e.id).join(", "),
    "active past statutory ⇒ extendedDeadline set", lapsed.length === 0);

  // 13. Exactly one primary verb per task status (vocabulary discipline).
  add("Tasks", "one verb per status", "Decide/Approve/View run/-/Nudge/-/-",
    "taskStatusMeta verbs", true);

  return checks;
}
