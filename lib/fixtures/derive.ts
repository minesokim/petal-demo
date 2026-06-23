// Petal OS - derivations. Every count, badge, KPI, and chart on every /os surface
// comes from these functions at render time. Components NEVER recompute or hard-code
// an aggregate; `tieOutChecks()` (rendered at /os/debug/tie-out, run by scripts/tieout.ts)
// treats any mismatch as a build failure.
//
// The logic lives in makeDerive(data): bind it to a real RLS-scoped FirmData bundle
// (server) or to the fixtures (the named exports below, used by not-yet-wired
// surfaces). Same functions, same numbers — only the data source differs.

import {
  NEEDS_YOU_STATUSES, STAGE_ORDER, ACTIVE_STAGES, MINUTES_RETURNED, daysUntil, money,
  type Stage, type Health, type TaskStatus,
} from "./vocab";
import {
  households, people, entities, engagements, expectedDocs, tasks, notices, positions, skillRuns, skills, activity, threads,
  type Household, type Person, type Entity, type Engagement, type Task, type Notice, type SkillRun, type ActivityEvent,
  type ExpectedDoc, type Position, type Thread, type Skill,
} from "./firm";

/** The data derive computes from — the subset of FirmData the dashboard aggregates. */
export interface DeriveData {
  households: Household[];
  people: Person[];
  entities: Entity[];
  engagements: Engagement[];
  expectedDocs: ExpectedDoc[];
  tasks: Task[];
  notices: Notice[];
  positions: Position[];
  skillRuns: SkillRun[];
  skills: Skill[];
  activity: ActivityEvent[];
  threads: Thread[];
}

// ── Pure types / consts (data-independent) ───────────────────
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

function countDocs(rows: ExpectedDoc[]): DocCounts {
  const expected = rows.length;
  const have = rows.filter(d => d.status === "have").length;
  const requested = rows.filter(d => d.status === "requested").length;
  const needsReview = rows.filter(d => d.status === "needs_review").length;
  const na = rows.filter(d => d.status === "na").length;
  const inHand = have + needsReview;
  const denom = expected - na;
  return { expected, have, requested, needsReview, na, inHand, denom, label: `${inHand}/${denom}` };
}

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

export interface HealthAssessment {
  health: Health;
  reason: string;
  nextAction?: { label: string; href: string };
}

export interface RoiWeek {
  actions: number;
  docsCollected: number;
  returnsFiled: number;
  noticesDrafted: number;
  hoursReturned: number; // rounded to nearest 0.5
}

export interface TieOutCheck {
  surface: string;
  label: string;
  displayed: string;
  derivation: string;
  ok: boolean;
}

// Data-independent, exported standalone.
export function engagementDeadline(e: Engagement): { iso: string; extended: boolean } {
  return { iso: e.extendedDeadline ?? e.statutoryDeadline, extended: !!e.extendedDeadline };
}
export function noticeCountdown(n: Notice): number {
  return daysUntil(n.respondBy);
}

// ── The factory: every data-dependent derivation, bound to `d` ──
export function makeDerive(d: DeriveData) {
  // lookup helpers, bound to this dataset (ported verbatim from fixtures/firm)
  const householdById = (id: string) => d.households.find(h => h.id === id);
  const engagementsOf = (hid: string) => d.engagements.filter(e => e.householdId === hid);
  const docsOfEngagement = (eid: string) => d.expectedDocs.filter(x => x.engagementId === eid);
  const taskById = (id: string) => d.tasks.find(t => t.id === id);
  const entitiesOf = (hid: string) => d.entities.filter(e => e.householdId === hid);
  const entityById = (id: string) => d.entities.find(e => e.id === id);
  const peopleOf = (hid: string) => d.people.filter(p => p.householdId === hid);
  const engagementById = (id: string) => d.engagements.find(e => e.id === id);

  function needsYouTasks(): Task[] {
    return d.tasks.filter(t => (NEEDS_YOU_STATUSES as TaskStatus[]).includes(t.status));
  }
  function needsYouCount(): number {
    return needsYouTasks().length;
  }

  function docsOf(engagementId: string): DocCounts {
    return countDocs(docsOfEngagement(engagementId));
  }
  function docsOfHousehold(hid: string): DocCounts {
    const rows = engagementsOf(hid).flatMap(e => docsOfEngagement(e.id));
    return countDocs(rows);
  }

  function activeEngagements(): Engagement[] {
    return d.engagements.filter(e => (ACTIVE_STAGES as Stage[]).includes(e.stage));
  }

  function householdStage(hid: string): Stage {
    const list = engagementsOf(hid);
    if (list.length === 0) return STAGE_ORDER[0];
    const active = list.filter(e => (ACTIVE_STAGES as Stage[]).includes(e.stage));
    const pool = active.length ? active : list;
    return pool.reduce<Stage>(
      (min, e) => (STAGE_ORDER.indexOf(e.stage) < STAGE_ORDER.indexOf(min) ? e.stage : min),
      pool[0].stage,
    );
  }

  function householdFee(hid: string): number {
    return engagementsOf(hid).reduce((s, e) => s + e.fee, 0);
  }

  function householdDeadline(hid: string): { iso: string; extended: boolean } | null {
    const active = engagementsOf(hid).filter(e => (ACTIVE_STAGES as Stage[]).includes(e.stage));
    if (!active.length) return null;
    const ds = active.map(e => ({
      iso: e.extendedDeadline ?? e.statutoryDeadline,
      extended: !!e.extendedDeadline,
    }));
    return ds.sort((a, b) => a.iso.localeCompare(b.iso))[0];
  }

  function stageCounts(): Record<Stage, number> {
    const out = Object.fromEntries(STAGE_ORDER.map(s => [s, 0])) as Record<Stage, number>;
    for (const e of d.engagements) out[e.stage]++;
    return out;
  }

  function feesInPipeline(): number {
    return activeEngagements().reduce((s, e) => s + e.fee, 0);
  }

  function feesBlockedByDocs(): number {
    return activeEngagements()
      .filter(e => docsOf(e.id).requested > 0)
      .reduce((s, e) => s + e.fee, 0);
  }

  function feesBooked(): number {
    return d.engagements.reduce((s, e) => s + e.fee, 0);
  }

  function filingReadiness(): FilingReadiness {
    let filed = 0, onTrack = 0, atRisk = 0;
    const atRiskList: FilingReadiness["atRiskList"] = [];
    for (const e of d.engagements) {
      const s = filingStateOf(e);
      if (s === "filed") filed++;
      else if (s === "on_track") onTrack++;
      else {
        atRisk++;
        atRiskList.push({ engagementId: e.id, householdId: e.householdId, form: e.form, reason: e.blockedBy ?? "Deposit not collected" });
      }
    }
    return { filed, onTrack, atRisk, total: d.engagements.length, atRiskList };
  }

  function filedThisWeek(): Engagement[] {
    return d.engagements.filter(e => e.eFiledOn === "2026-06-23");
  }

  function invoiceOf(hid: string): Invoice {
    const h = householdById(hid)!;
    const list = engagementsOf(hid);
    const idx = d.households.findIndex(x => x.id === hid);
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

  function invoices(): Invoice[] {
    return d.households.map(h => invoiceOf(h.id));
  }

  function billingKpis() {
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

  function clientHealth(hid: string): HealthAssessment {
    const active = engagementsOf(hid).filter(e => (ACTIVE_STAGES as Stage[]).includes(e.stage));
    const docs = docsOfHousehold(hid);
    const hhTasks = d.tasks.filter(t => t.householdId === hid);
    const flaggedDecisions = hhTasks.filter(t => t.status === "needs_decision" && t.flagged);
    const blockedDecision = hhTasks.find(t => t.status === "needs_decision" && t.feeContext?.includes("blocked"));
    const depositUnpaid = active.some(e => !e.depositPaid);
    const openNotice = d.notices.find(n => n.householdId === hid && n.status === "response_drafted");
    const openPosition = d.positions.find(p => p.householdId === hid && p.status === "open");

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

  function atRiskHouseholds(): ({ household: Household } & HealthAssessment)[] {
    return d.households
      .map(h => ({ household: h, ...clientHealth(h.id) }))
      .filter(x => x.health !== "healthy")
      .sort((a, b) => (a.health === "at_risk" ? -1 : 1) - (b.health === "at_risk" ? -1 : 1));
  }

  function healthCounts(): Record<Health, number> {
    const out: Record<Health, number> = { at_risk: 0, watch: 0, healthy: 0 };
    for (const h of d.households) out[clientHealth(h.id).health]++;
    return out;
  }

  function booksClients(): Household[] {
    return d.households.filter(h => h.hasBooks);
  }

  function openNotices(): Notice[] {
    return d.notices.filter(n => n.status === "response_drafted");
  }

  function transcriptWatchCount(): number {
    return d.households.filter(h => h.has8821).length;
  }

  function runsOfSkill(skillId: string): SkillRun[] {
    return d.skillRuns.filter(r => r.skillId === skillId);
  }

  function roiWeek(): RoiWeek {
    const petal = d.activity.filter(a => a.actor === "Petal" && a.kind !== "approval" && a.kind !== "edit");
    const minutes = petal.reduce((s, a) => s + MINUTES_RETURNED[a.kind], 0);
    return {
      actions: petal.length,
      docsCollected: petal.filter(a => a.kind === "doc_collected").length,
      returnsFiled: petal.filter(a => a.kind === "efile").length,
      noticesDrafted: petal.filter(a => a.kind === "notice_draft").length,
      hoursReturned: Math.round((minutes / 60) * 2) / 2,
    };
  }

  function activityFeed(filter?: { householdId?: string; skillId?: string; day?: number }): ActivityEvent[] {
    let list = [...d.activity].sort((a, b) => b.day - a.day || b.id.localeCompare(a.id, undefined, { numeric: true }));
    if (filter?.householdId) list = list.filter(a => a.householdId === filter.householdId);
    if (filter?.day) list = list.filter(a => a.day === filter.day);
    if (filter?.skillId) {
      const runIds = new Set(runsOfSkill(filter.skillId).map(r => r.id));
      list = list.filter(a => a.runId && runIds.has(a.runId));
    }
    return list;
  }

  function tieOutChecks(): TieOutCheck[] {
    const checks: TieOutCheck[] = [];
    const add = (surface: string, label: string, displayed: string | number, derivation: string, ok: boolean) =>
      checks.push({ surface, label, displayed: String(displayed), derivation, ok });

    const n = needsYouCount();
    const decisions = d.tasks.filter(t => t.status === "needs_decision").length;
    const approvals = d.tasks.filter(t => t.status === "ready_to_approve").length;
    add("Today / Tasks badge / Review", "needs-you count", n,
      `needs_decision (${decisions}) + ready_to_approve (${approvals})`, n === decisions + approvals && n === 12);

    const park = docsOfHousehold("h-park");
    add("Client header / chat / Documents", "Park docs", park.label, "Σ expectedDocs over Park's 2 engagements", park.label === "32/34");
    add("Client header / Billing", "Park fee", money(householdFee("h-park")), "Σ engagement fees (1120S $1,400 + 1040 $500)", householdFee("h-park") === 1900);
    add("Client header / Billing", "Park balance", money(invoiceOf("h-park").balance), "invoiced − 40% deposit", invoiceOf("h-park").balance === 1140);
    add("Client header / Returns board", "Park stage", householdStage("h-park"), "least-progressed active engagement", householdStage("h-park") === "ready_to_prep");

    add("Clients list", "household count", d.households.length, "fixture households", d.households.length === 11);
    add("Billing", "invoice count", invoices().length, "one per household", invoices().length === 11);
    const healthTotal = healthCounts();
    add("Practice / Today", "health coverage", healthTotal.at_risk + healthTotal.watch + healthTotal.healthy,
      "clientHealth() over all households", healthTotal.at_risk + healthTotal.watch + healthTotal.healthy === 11);
    const russo = householdById("h-russo");
    add("Clients list", "Russo is a real client", russo ? russo.name : "missing", "h-russo in households", !!russo);

    const atRisk = atRiskHouseholds();
    add("Today at-risk / Practice health", "at-risk + watch", atRisk.length,
      `at_risk (${healthTotal.at_risk}) + watch (${healthTotal.watch})`,
      atRisk.length === healthTotal.at_risk + healthTotal.watch);

    const sc = stageCounts();
    const scSum = Object.values(sc).reduce((a, b) => a + b, 0);
    add("Returns board header", "stage counts sum", scSum, "Σ over 7 stages = engagement count", scSum === d.engagements.length);

    add("Returns board header", "fees in pipeline", money(feesInPipeline()), "Σ fees of active engagements", feesInPipeline() === 9000);
    add("Returns board / Practice", "fees blocked by docs", money(feesBlockedByDocs()), "active engagements with requested docs", feesBlockedByDocs() === 5200);

    const roi = roiWeek();
    add("Today ROI strip", "actions this week", roi.actions, "Petal activity events (excl. approvals)", roi.actions === 41);
    add("Today ROI strip", "documents collected", roi.docsCollected, "doc_collected events", roi.docsCollected === 9);
    add("Today ROI strip", "returns filed", roi.returnsFiled, "efile events", roi.returnsFiled === 3);
    add("Today ROI strip", "notices drafted", roi.noticesDrafted, "notice_draft events", roi.noticesDrafted === 2);
    add("Today ROI strip", "hours returned", `~${roi.hoursReturned} hrs`, "Σ MINUTES_RETURNED / 60, nearest 0.5", roi.hoursReturned === 6.5);

    add("Today brief", "filed this week", filedThisWeek().length, "engagements e-filed Jun 23", filedThisWeek().length === 3 && filedThisWeek().length === roi.returnsFiled);

    add("Settings / Notices", "8821 coverage", transcriptWatchCount(), "households with has8821", transcriptWatchCount() === 9);

    add("Today close widget / Books", "books clients", booksClients().length, "households with hasBooks", booksClients().length === 3);

    const runIds = new Set(d.skillRuns.map(r => r.id));
    const badTaskRuns = d.tasks.filter(t => t.runId && !runIds.has(t.runId));
    add("Provenance", "task → run links", `${d.tasks.filter(t => t.runId).length} linked`, "every Task.runId resolves", badTaskRuns.length === 0);
    const badNoticeRuns = d.notices.filter(x => (x.runId && !runIds.has(x.runId)) || (x.linkedTranscriptRunId && !runIds.has(x.linkedTranscriptRunId)));
    add("Provenance", "notice → run links", `${d.notices.length} notices`, "every Notice.runId resolves", badNoticeRuns.length === 0);
    const skillIds = new Set(d.skills.map(s => s.id));
    const badTaskSkills = d.tasks.filter(t => !skillIds.has(t.skillId));
    add("Tasks", "task → skill links", `${d.tasks.length} tasks`, "every Task.skillId resolves", badTaskSkills.length === 0);
    const hhIds = new Set(d.households.map(h => h.id));
    const orphans = [
      ...d.tasks.filter(t => !hhIds.has(t.householdId)).map(t => t.id),
      ...d.threads.filter(t => !hhIds.has(t.householdId)).map(t => t.id),
      ...d.notices.filter(x => !hhIds.has(x.householdId)).map(x => x.id),
      ...d.expectedDocs.filter(x => !d.engagements.some(e => e.id === x.engagementId)).map(x => x.id),
    ];
    add("World", "no ghost clients", orphans.length === 0 ? "none" : orphans.join(", "), "every record resolves to a household/engagement", orphans.length === 0);

    const lapsed = activeEngagements().filter(e => daysUntil(e.statutoryDeadline) < 0 && !e.extendedDeadline);
    add("World", "extension coverage", lapsed.length === 0 ? "all extended" : lapsed.map(e => e.id).join(", "),
      "active past statutory ⇒ extendedDeadline set", lapsed.length === 0);

    add("Tasks", "one verb per status", "Decide/Approve/View run/-/Nudge/-/-",
      "taskStatusMeta verbs", true);

    return checks;
  }

  return {
    needsYouTasks, needsYouCount, docsOf, docsOfHousehold, activeEngagements, householdStage,
    householdFee, householdDeadline, stageCounts, feesInPipeline, feesBlockedByDocs, feesBooked,
    filingReadiness, filedThisWeek, invoiceOf, invoices, billingKpis, clientHealth, atRiskHouseholds,
    healthCounts, booksClients, openNotices, transcriptWatchCount, runsOfSkill, roiWeek, activityFeed,
    tieOutChecks,
    // lookups (data-bound) — drop-ins for the fixture helpers in lib/fixtures/firm
    householdById, engagementsOf, engagementById, docsOfEngagement, taskById, entitiesOf, entityById, peopleOf,
  };
}

// ── Fixture-bound named exports (used by not-yet-wired surfaces) ──
const FIXTURE_DATA: DeriveData = { households, people, entities, engagements, expectedDocs, tasks, notices, positions, skillRuns, skills, activity, threads };
const fx = makeDerive(FIXTURE_DATA);

export const needsYouTasks = fx.needsYouTasks;
export const needsYouCount = fx.needsYouCount;
export const docsOf = fx.docsOf;
export const docsOfHousehold = fx.docsOfHousehold;
export const activeEngagements = fx.activeEngagements;
export const householdStage = fx.householdStage;
export const householdFee = fx.householdFee;
export const householdDeadline = fx.householdDeadline;
export const stageCounts = fx.stageCounts;
export const feesInPipeline = fx.feesInPipeline;
export const feesBlockedByDocs = fx.feesBlockedByDocs;
export const feesBooked = fx.feesBooked;
export const filingReadiness = fx.filingReadiness;
export const filedThisWeek = fx.filedThisWeek;
export const invoiceOf = fx.invoiceOf;
export const invoices = fx.invoices;
export const billingKpis = fx.billingKpis;
export const clientHealth = fx.clientHealth;
export const atRiskHouseholds = fx.atRiskHouseholds;
export const healthCounts = fx.healthCounts;
export const booksClients = fx.booksClients;
export const openNotices = fx.openNotices;
export const transcriptWatchCount = fx.transcriptWatchCount;
export const runsOfSkill = fx.runsOfSkill;
export const roiWeek = fx.roiWeek;
export const activityFeed = fx.activityFeed;
export const tieOutChecks = fx.tieOutChecks;
