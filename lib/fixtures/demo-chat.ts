// Petal OS - the scripted demo brain behind Ask Petal.
// Typed questions are keyword-matched against this bank; every answer is BUILT
// from the canonical fixtures at call time, so chat numbers always tie out.
// Unmatched questions get a graceful fallback with suggestions (live-demo safety).
//
// Flagship answers (risk scan, revenue, capacity) carry an agentic step trace,
// stat metrics, an inline chart, and ranked findings - the deepest expression of
// the product: Petal reasoning across the whole book, every finding grounded.

import { money, fmtDate, stageMeta, daysUntil, MINUTES_RETURNED, STAGE_ORDER, type SkillCategory, type ActivityKind } from "./vocab";
import {
  householdById, engagementsOf, tasksOf, noticesOf, positionsOf, taskById, noticeById,
  expectedDocs, engagements, tasks, notices, positions, activity, type Household,
} from "./firm";
import {
  needsYouTasks, docsOfHousehold, householdStage, householdFee, householdDeadline,
  invoiceOf, clientHealth, atRiskHouseholds, healthCounts, roiWeek, filedThisWeek,
  noticeCountdown, billingKpis, feesInPipeline, feesBlockedByDocs, feesBooked,
  activeEngagements, booksClients,
} from "./derive";

type Tone = "neutral" | "danger" | "warning" | "brand";

export interface ChatStep { label: string; detail?: string }
export interface ChatMetric { value: string; label: string; tone?: Tone }
export interface ChatChartBar { label: string; value: number; display: string; tone?: Tone }
export interface ChatChart { kind: "bars"; title?: string; bars: ChatChartBar[]; max?: number }
export interface ChatFinding {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  impact?: string;
  href?: string;
}

export interface ChatAnswer {
  /** plain text paragraphs; **bold** spans supported */
  paragraphs: string[];
  /** agentic reasoning trace - reveals step by step before the prose */
  steps?: ChatStep[];
  /** stat callout row (number-over-label) */
  metrics?: ChatMetric[];
  /** inline chart */
  chart?: ChatChart;
  /** ranked finding cards, each deep-linked to its record */
  findings?: ChatFinding[];
  sources?: string[];
  /** cited legal authority for a research answer — each links to its official primary source. */
  citations?: { cite: string; url?: string; authority?: string }[];
  /** research calibration reason-code when it's a caution worth flagging (unsettled law, coverage gap, …). */
  calibration?: string;
  links?: { label: string; href: string }[];
  /** the "Do" card - turns the answer into a run */
  action?: { title: string; desc: string; button: string; category: SkillCategory; href?: string };
  /** suggestion chips that SEND a new question */
  suggest?: string[];
  /** agentic confirm cards: writes Petal staged, each executed only on the preparer's click */
  confirmActions?: { tool: string; args: Record<string, unknown>; title: string }[];
}

export interface QAEntry {
  id: string;
  question: string;
  match: string[][];
  build: () => ChatAnswer;
}

const norm = (s: string) => " " + s.toLowerCase().replace(/[^a-z0-9$]+/g, " ").trim() + " ";

function groupMatches(input: string, group: string[]): boolean {
  return group.every(kw => kw.split("|").some(syn => input.includes(syn.trim())));
}

/* ── practice-wide analysis helpers (all derived from canon) ──── */

type Severity = "high" | "medium" | "low";

interface Exposure {
  severity: Severity;
  household: string;
  title: string;
  detail: string;
  impact: string;
  href: string;
}

/** Scan the whole book for exposures - notices, blocked decisions, flags, open positions, unpaid deposits. */
function practiceExposures(): Exposure[] {
  const out: Exposure[] = [];

  for (const n of notices.filter(x => x.status === "response_drafted")) {
    const h = householdById(n.householdId)!;
    out.push({
      severity: "high", household: h.name,
      title: `${n.type} - ${h.name}`,
      detail: `${n.amount} proposed by the IRS. Respond by ${fmtDate(n.respondBy)}. Response already drafted with the position documented.`,
      impact: n.amount ?? "IRS notice",
      href: `/os/notices/${n.id}`,
    });
  }

  for (const t of tasks.filter(t => t.status === "needs_decision" && t.flagged)) {
    const h = householdById(t.householdId)!;
    const blocked = t.feeContext?.toLowerCase().includes("blocked") ?? false;
    out.push({
      severity: blocked ? "high" : "medium", household: h.name,
      title: t.title,
      detail: t.why,
      impact: t.feeContext ?? "Flagged for your decision",
      href: `/os/tasks?task=${t.id}`,
    });
  }

  for (const p of positions.filter(p => p.status === "open")) {
    const h = householdById(p.householdId)!;
    out.push({
      severity: p.confidence < 0.6 ? "high" : "medium", household: h.name,
      title: `${p.issue} - ${h.name}`,
      detail: `${p.authorityLevel} · ${Math.round(p.confidence * 100)}% confidence · ${p.documentation.length} supporting docs attached. Unresolved.`,
      impact: p.authorityLevel,
      href: `/os/clients/${p.householdId}?tab=positions`,
    });
  }

  for (const e of activeEngagements().filter(e => !e.depositPaid)) {
    const h = householdById(e.householdId)!;
    const missing = docsOfHousehold(h.id).requested;
    out.push({
      severity: "medium", household: h.name,
      title: `${h.name} - deposit unpaid, ${missing} docs missing`,
      detail: "New client; deposit never collected and the W-2 is still outstanding after three chases. At risk of slipping the deadline.",
      impact: money(e.fee),
      href: `/os/clients/${h.id}`,
    });
  }

  const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function exposureBars(exps: Exposure[]): ChatChartBar[] {
  const W: Record<Severity, number> = { high: 5, medium: 2, low: 1 };
  const byHH: Record<string, { score: number; sev: Severity }> = {};
  for (const f of exps) {
    const cur = byHH[f.household] ?? { score: 0, sev: "low" as Severity };
    cur.score += W[f.severity];
    if (f.severity === "high") cur.sev = "high";
    else if (f.severity === "medium" && cur.sev !== "high") cur.sev = "medium";
    byHH[f.household] = cur;
  }
  const tone = (s: Severity): Tone => (s === "high" ? "danger" : s === "medium" ? "warning" : "brand");
  return Object.entries(byHH)
    .map(([label, v]) => ({ label, value: v.score, display: v.sev === "high" ? "High" : v.sev === "medium" ? "Med" : "Low", tone: tone(v.sev) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function feesByStage(): ChatChartBar[] {
  const sums: Record<string, number> = {};
  for (const e of engagements) sums[e.stage] = (sums[e.stage] ?? 0) + e.fee;
  return STAGE_ORDER.filter(s => sums[s]).map(s => ({
    label: stageMeta[s].label,
    value: sums[s],
    display: money(sums[s]),
    tone: s === "e_filed" || s === "accepted" ? ("brand" as Tone) : ("neutral" as Tone),
  }));
}

function hoursByCategory(): ChatChartBar[] {
  const LABELS: Partial<Record<ActivityKind, string>> = {
    doc_collected: "Document collection",
    extraction: "Data extraction",
    notice_draft: "Notice responses",
    efile: "E-filing",
    brief: "Call prep",
    draft: "Drafting",
    send: "Client outreach",
    transcript_check: "Transcript watch",
  };
  const mins: Record<string, number> = {};
  for (const a of activity) {
    if (a.actor !== "Petal" || a.kind === "approval" || a.kind === "edit") continue;
    const label = LABELS[a.kind];
    if (!label) continue;
    mins[label] = (mins[label] ?? 0) + MINUTES_RETURNED[a.kind];
  }
  return Object.entries(mins)
    .map(([label, m]) => ({ label, value: m, display: `${(m / 60).toFixed(1)}h`, tone: "brand" as Tone }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

/* ── global bank ─────────────────────────────────────────────── */

export const QA_BANK: QAEntry[] = [
  {
    id: "qa-needs-me",
    question: "What needs me today?",
    match: [["what|anything", "need|do|review", "me|today|now"], ["needs me"], ["my queue"], ["what should i"]],
    build: () => {
      const queue = needsYouTasks();
      const decisions = queue.filter(t => t.status === "needs_decision");
      const mins = queue.reduce((s, t) => s + t.estimatedMin, 0);
      return {
        paragraphs: [
          `**${queue.length} items** are waiting on you - ${decisions.length} decisions and ${queue.length - decisions.length} drafts ready to approve. About **${mins} minutes** end to end.`,
          `The one I'd start with: **${decisions[0].title}** - ${householdById(decisions[0].householdId)!.name}. I've laid out three options and recommend option A.`,
        ],
        links: [
          { label: "Start reviewing", href: "/os/review" },
          { label: "Open tasks", href: "/os/tasks" },
        ],
      };
    },
  },

  /* ── FLAGSHIP: practice-wide risk scan ── */
  {
    id: "qa-risk-scan",
    question: "Run a risk scan across my book",
    match: [
      ["risk", "scan"], ["scan", "book|practice|return"], ["expose|exposed|exposure"],
      ["audit", "risk|book|scan|exposure|expose"], ["blow up"],
      ["biggest", "risk|exposure|problem|issue"], ["most", "exposed|risk"], ["where", "exposed"],
    ],
    build: () => {
      const exps = practiceExposures();
      const high = exps.filter(f => f.severity === "high").length;
      const cp = noticeById("n-cp2000")!;
      return {
        steps: [
          { label: "Read 19 open engagements across 11 clients" },
          { label: "Cross-referenced 2 tax positions, 1 open IRS notice, 4 variance flags" },
          { label: "Weighted by authority level, deadline proximity, and document gaps" },
          { label: "Ranked exposure across the book" },
        ],
        paragraphs: [
          `I found **${exps.length} exposures** worth your attention - **${high} high-severity**. The book is healthy overall, but two items could cost real money or a missed deadline if they slip.`,
          `The sharpest two are **${exps[0].title}** and **${exps[1].title}**. Both already have a drafted next step waiting in your queue - you're not starting from scratch on either.`,
        ],
        metrics: [
          { value: String(exps.length), label: "exposures flagged" },
          { value: String(high), label: "high severity", tone: "danger" },
          { value: "$4.3k", label: "tax at stake", tone: "warning" },
          { value: `${noticeCountdown(cp)} days`, label: "to the CP2000 deadline" },
        ],
        chart: { kind: "bars", title: "Exposure by client", bars: exposureBars(exps) },
        findings: exps.slice(0, 5).map(f => ({ severity: f.severity, title: f.title, detail: f.detail, impact: f.impact, href: f.href })),
        links: [{ label: "Start reviewing", href: "/os/review" }],
        suggest: ["What's blocking the Russo return?", "What's the deal with the Rodriguez CP2000?"],
      };
    },
  },

  /* ── FLAGSHIP: revenue / practice financials ── */
  {
    id: "qa-revenue",
    question: "Show me the financial picture",
    match: [
      ["revenue"], ["financ", "picture|health|practice|look"],
      ["money", "making|practice|season|book"], ["fees", "stage|pipeline|breakdown|picture"],
      ["season", "look|going|doing|health"], ["how", "practice|business", "doing|going"],
    ],
    build: () => {
      const k = billingKpis();
      return {
        steps: [
          { label: "Summed fees across 19 engagements" },
          { label: "Reconciled collected against outstanding from invoices" },
          { label: "Flagged fees blocked behind missing documents" },
        ],
        paragraphs: [
          `**${money(feesBooked())} booked** this season. You've collected **${money(k.collectedTotal)}**; **${money(k.outstandingTotal)}** is still outstanding, and **${money(feesBlockedByDocs())}** of the pipeline is stuck behind missing documents - which is exactly what the document chases are clearing.`,
          `One invoice is overdue (DeShawn - deposit never collected). Everything else is on schedule for the extension deadlines.`,
        ],
        metrics: [
          { value: money(feesBooked()), label: "fees booked" },
          { value: money(k.collectedTotal), label: "collected", tone: "brand" },
          { value: money(k.outstandingTotal), label: "outstanding", tone: "warning" },
          { value: money(feesBlockedByDocs()), label: "blocked on docs", tone: "danger" },
        ],
        chart: { kind: "bars", title: "Fees by stage", bars: feesByStage() },
        links: [{ label: "Practice", href: "/os/practice" }, { label: "Billing", href: "/os/billing" }],
        suggest: ["Run a risk scan across my book", "Can I take on more clients?"],
      };
    },
  },

  {
    id: "qa-chen-wages",
    question: "Why did Marcus Chen's wages drop 40%?",
    match: [["chen|marcus", "wage|drop|salary|w-2|w2"], ["wages", "40"]],
    build: () => ({
      paragraphs: [
        "Marcus's W-2 wages fell from **$96,400** to **$58,000** because his second restaurant location closed in May 2026. That matches his Jun 23 email, where he confirmed winding down the Riverside spot.",
        "His K-1 income from Golden Dragon actually rose 19% over the same period, so total household income is down only ~8%, not 40%.",
        "One thing to confirm before filing: the reduction isn't backed by a termination letter in his documents, so I've flagged it rather than treating it as final - the flag is in your review queue.",
      ],
      sources: ["W-2 - Golden Dragon LLC", "Jun 23 email - Marcus", "2024 Return.pdf"],
      links: [{ label: "Open the flag", href: "/os/tasks?task=t-chen-wages" }],
      action: { title: "Clear the flag with his email as support?", desc: "Logs the confirmation and lets prep continue - lands in Tasks for your approval.", button: "Queue it", category: "prep_filing" },
    }),
  },
  {
    id: "qa-park-status",
    question: "Where does Park Family Dental stand?",
    match: [["park", "stand|status|where|return|story|catch"]],
    build: () => buildClientStatus(householdById("h-park")!),
  },
  {
    id: "qa-russo",
    question: "What's blocking the Russo return?",
    match: [["russo"], ["capital gains"], ["basis", "lots|missing|blocking"]],
    build: () => {
      const t = taskById("t-russo-basis")!;
      return {
        paragraphs: [
          "Anthony's Schwab 1099-B is missing cost basis on **7 of 23 lots** - filing as-is would overstate the gain by roughly **$3,100 of tax**, so I stopped rather than guess.",
          "Your options: **A** - request the purchase confirmations from Anthony (I've drafted the ask). **B** - pull historical basis from Schwab, which needs his authorization. **C** - proceed with $0 basis, which is compliant but costs him money.",
          "I recommend **A**. He answered the CP14 same-day earlier this month, so turnaround should be quick.",
        ],
        sources: ["1099-B - Schwab", "Schedule D worksheet"],
        links: [{ label: "Decide now", href: `/os/tasks?task=${t.id}` }],
      };
    },
  },
  {
    id: "qa-cp2000",
    question: "What's the deal with the Rodriguez CP2000?",
    match: [["cp2000"], ["rodriguez", "notice|irs|letter"], ["notice", "respond|due|deal"]],
    build: () => {
      const n = noticeById("n-cp2000")!;
      const days = noticeCountdown(n);
      return {
        paragraphs: [
          `The IRS proposes **+$1,210 of tax** on 2024 interest income it says was unreported. It WAS reported - the same interest is on Schedule B of the filed return; the payer matched it to the wrong year.`,
          `I drafted the response disputing the notice with Schedule B and the 1099-INT attached. The respond-by date is **${fmtDate(n.respondBy)}** - ${days} days out - and yesterday's transcript sweep picked up the matching AUR marker, so nothing new is hiding.`,
        ],
        sources: ["IRS CP2000 - tax year 2024", "2024 Return - Schedule B", "1099-INT - Chase"],
        links: [{ label: "Review the response", href: "/os/notices/n-cp2000" }],
      };
    },
  },
  {
    id: "qa-q2",
    question: "Who missed Q2 estimates?",
    match: [["q2|quarterly", "estimate|payment|missed"], ["missed", "estimate"]],
    build: () => ({
      paragraphs: [
        "Two clients show no Q2 payment confirmation: **Sandoval Plumbing** and **Park Family Dental**. The other 7 voucher clients all confirmed by Jun 15.",
        "Follow-ups with voucher copies are drafted and sitting in your queue - paying this week keeps any penalty negligible.",
      ],
      sources: ["Q2 voucher ledger", "Safe-harbor worksheet - 2025 returns"],
      links: [{ label: "Approve the follow-ups", href: "/os/tasks?task=t-est-q2" }],
    }),
  },
  {
    id: "qa-filed",
    question: "What did you file this week?",
    match: [["file|filed|efile", "week|recent|lately"]],
    build: () => {
      const filed = filedThisWeek();
      return {
        paragraphs: [
          `**${filed.length} returns** went out clean on ${fmtDate(filed[0].eFiledOn!)} after your approval - Linda's 1040 + Etsy Schedule C and Karen's 1040. All accepted by the IRS the next morning.`,
          "Every transmission is logged with its sources and your approval in the activity log.",
        ],
        links: [
          { label: "View in activity log", href: "/os/activity?run=run-efile-nak" },
          { label: "Returns board", href: "/os/returns" },
        ],
      };
    },
  },

  /* ── FLAGSHIP: ROI / time returned with breakdown chart ── */
  {
    id: "qa-roi",
    question: "How much time did you save me this week?",
    match: [["time|hours", "save|saved|return|back"], ["roi"], ["how much", "did you do|work|save"]],
    build: () => {
      const roi = roiWeek();
      const monthly = Math.round(roi.hoursReturned * 4.3);
      return {
        steps: [
          { label: "Tallied every action I ran this week" },
          { label: "Priced each against your minutes-per-task" },
        ],
        paragraphs: [
          `**${roi.actions} actions** this week - ${roi.docsCollected} documents collected, ${roi.returnsFiled} returns e-filed, ${roi.noticesDrafted} notice responses drafted. That's **~${roi.hoursReturned} hours returned**.`,
          "Most of it was the work you'd never bill for anyway - chasing documents and keying in extractions. Here's where the time came back:",
        ],
        metrics: [
          { value: `${roi.hoursReturned}h`, label: "returned this week", tone: "brand" },
          { value: `~${monthly}h`, label: "this month" },
          { value: String(roi.actions), label: "actions run" },
        ],
        chart: { kind: "bars", title: "Where your hours came back", bars: hoursByCategory() },
        links: [{ label: "Activity log", href: "/os/activity" }],
        suggest: ["Can I take on more clients?", "Run a risk scan across my book"],
      };
    },
  },

  /* ── FLAGSHIP: capacity / the venture story ── */
  {
    id: "qa-capacity",
    question: "Can I take on more clients?",
    match: [["capacity|headroom"], ["take on", "more|client"], ["how many", "more|client"], ["room", "more|grow|client"], ["more clients"]],
    build: () => {
      const roi = roiWeek();
      const monthly = Math.round(roi.hoursReturned * 4.3);
      const perReturn = 9;
      const headroom = Math.floor(monthly / perReturn);
      return {
        steps: [
          { label: "Measured the hours Petal returned this week" },
          { label: "Projected against your average return time" },
        ],
        paragraphs: [
          `At **~${roi.hoursReturned} hours a week** returned, that's roughly **${monthly} hours a month** back in your calendar.`,
          `At your average of ~${perReturn} hours per return, that's headroom for about **${headroom} more returns** - or the bandwidth to take on the advisory work you've been turning away. The point isn't to replace you; it's to let one EA carry the book of three.`,
        ],
        metrics: [
          { value: `~${monthly}h`, label: "returned per month", tone: "brand" },
          { value: `+${headroom}`, label: "returns of headroom" },
          { value: "1 → 3", label: "book one EA can carry" },
        ],
        chart: { kind: "bars", title: "Where your hours came back", bars: hoursByCategory() },
        links: [{ label: "Activity log", href: "/os/activity" }],
        suggest: ["Run a risk scan across my book", "Show me the financial picture"],
      };
    },
  },

  {
    id: "qa-at-risk",
    question: "Which clients are at risk?",
    match: [["at risk"], ["risk|trouble|behind|watch", "client|who|which"]],
    build: () => {
      const list = atRiskHouseholds();
      const counts = healthCounts();
      const top = list.filter(x => x.health === "at_risk");
      return {
        paragraphs: [
          `**${counts.at_risk} at risk, ${counts.watch} on watch.** The two that matter today: **${top[0].household.name}** - ${top[0].reason.toLowerCase()} - and **${top[1].household.name}** - ${top[1].reason.toLowerCase()}.`,
          "Both have a next step already drafted in your queue. The watch-list four are flagged decisions and open documents - nothing time-critical yet.",
        ],
        links: [
          { label: "Open clients", href: "/os/clients" },
          { label: "Start reviewing", href: "/os/review" },
        ],
        suggest: ["Run a risk scan across my book"],
      };
    },
  },
  {
    id: "qa-deshawn",
    question: "Chase DeShawn's W-2 again",
    match: [["deshawn|williams", "chase|w-2|w2|remind|doc"]],
    build: () => ({
      paragraphs: [
        "DeShawn's W-2 from Hartline Logistics is still the only thing blocking his return - three messages since Jun 12, no upload. Chase #4 is drafted, and this one offers a 10-minute call instead of another reminder.",
        "His deposit is also unpaid, so I'd send this one personally.",
      ],
      sources: ["Document checklist - DeShawn Williams", "SMS thread"],
      links: [{ label: "Approve & send", href: "/os/tasks?task=t-williams-chase" }],
      action: { title: "Escalate to a call?", desc: "Books a 10-minute slot and sends him the link - lands in Tasks first.", button: "Queue it", category: "signatures_chase" },
    }),
  },
  {
    id: "qa-fuentes",
    question: "Did Roberto sign the 8879 yet?",
    match: [["fuentes|roberto", "sign|8879|signature"], ["8879"]],
    build: () => ({
      paragraphs: [
        "Not yet - Roberto **viewed the 8879 on Jun 23** and stopped. The 1120S is final and transmits the moment he signs.",
        "A nudge is drafted in your queue, and you have him on the phone at 3:00 today - his bonus-depreciation question from Monday is probably what's holding him. The answer is yes, the two trucks qualify for 60% bonus.",
      ],
      sources: ["E-sign envelope status", "Jun 22 email - Roberto"],
      links: [
        { label: "Approve the nudge", href: "/os/tasks?task=t-fuentes-8879" },
        { label: "Pre-call brief", href: "/os/tasks?task=t-brief-fuentes" },
      ],
    }),
  },
  {
    id: "qa-books",
    question: "Where are the May books?",
    match: [["books|close", "may|status|where|stand"]],
    build: () => {
      const clients = booksClients();
      return {
        paragraphs: [
          `May books for ${clients.map(h => h.name).join(", ")} are **wrapping up - 2 of 7 items complete, 3 in progress**.`,
          "I can run the three reconciliation and categorization items; the AP review and owner sign-off stay with you. Park's bank rec is already done - 142 of 145 matched, and David confirmed the three stragglers by email.",
        ],
        links: [{ label: "Open books", href: "/os/books" }],
        action: { title: "Run the remaining items?", desc: "Reconciliations and categorization queue as drafts for your approval.", button: "Run with Petal", category: "books", href: "/os/books" },
      };
    },
  },
];

/* ── client-scoped templates (work for any household) ────────── */

function buildClientStatus(h: Household): ChatAnswer {
  const stage = stageMeta[householdStage(h.id)].label;
  const docs = docsOfHousehold(h.id);
  const inv = invoiceOf(h.id);
  const deadline = householdDeadline(h.id);
  const open = tasksOf(h.id).filter(t => t.status === "needs_decision" || t.status === "ready_to_approve");
  const engs = engagementsOf(h.id);
  const blocked = engs.find(e => e.blockedBy);
  const health = clientHealth(h.id);
  return {
    paragraphs: [
      `**${h.name}** is **${stage}** - documents **${docs.label}**, fee **${money(householdFee(h.id))}**, balance **${money(inv.balance)}**${deadline ? `, next deadline **${fmtDate(deadline.iso)}**` : ""}.`,
      blocked
        ? `Blocking item: ${blocked.blockedBy}. ${open.length ? `${open.length} item${open.length > 1 ? "s" : ""} for this client ${open.length > 1 ? "are" : "is"} in your queue.` : ""}`
        : health.health === "healthy"
          ? "Nothing is blocking - on pace."
          : `Health: ${health.reason}.`,
    ],
    links: [
      { label: "Open record", href: `/os/clients/${h.id}` },
      ...(open[0] ? [{ label: "Review their items", href: `/os/tasks?task=${open[0].id}` }] : []),
    ],
  };
}

function buildClientDocs(h: Household): ChatAnswer {
  const docs = docsOfHousehold(h.id);
  const missing = engagementsOf(h.id).flatMap(e =>
    expectedDocs.filter(d => d.engagementId === e.id && d.status === "requested").map(d => d.source));
  return {
    paragraphs: [
      `**${docs.label} in hand** - ${docs.requested} still out${docs.needsReview ? `, ${docs.needsReview} extraction awaiting your review` : ""}.`,
      missing.length ? `Still missing: ${missing.slice(0, 4).join(" · ")}${missing.length > 4 ? ` and ${missing.length - 4} more` : ""}. The chase cadence is running.` : "The checklist is complete.",
    ],
    links: [{ label: "Open documents", href: `/os/clients/${h.id}?tab=documents` }],
  };
}

function buildClientBalance(h: Household): ChatAnswer {
  const inv = invoiceOf(h.id);
  return {
    paragraphs: [
      `Invoiced **${money(inv.invoiced)}**, collected **${money(inv.collected)}** - balance **${money(inv.balance)}** (${inv.status === "overdue" ? `overdue, ${inv.due.toLowerCase()}` : inv.due.toLowerCase()}).`,
    ],
    links: [{ label: "Open billing", href: `/os/clients/${h.id}?tab=billing` }],
  };
}

const CLIENT_TEMPLATES: { match: string[][]; build: (h: Household) => ChatAnswer }[] = [
  { match: [["doc|w-2|w2|1099|checklist|missing|outstanding"]], build: buildClientDocs },
  { match: [["owe|balance|invoice|paid|bill"]], build: buildClientBalance },
  { match: [["stand|status|where|catch|stage|return|story|update|going"]], build: buildClientStatus },
];

/* ── matcher + fallback ──────────────────────────────────────── */

export const SUGGESTED_QUESTIONS = [
  "Run a risk scan across my book",
  "How much time did you save me this week?",
  "Show me the financial picture",
  "What's the deal with the Rodriguez CP2000?",
];

export function fallbackAnswer(scopeHouseholdId?: string): ChatAnswer {
  const h = scopeHouseholdId ? householdById(scopeHouseholdId) : undefined;
  return {
    paragraphs: [
      h
        ? `In the full product I answer anything from ${h.name}'s records - returns, documents, billing, history. In this demo, try one of these:`
        : "In the full product I answer anything from your firm's records - every answer cited to its sources. In this demo, try one of these:",
    ],
    suggest: h
      ? [`Where does ${h.name.split(" ")[0]} stand?`, "What documents are missing?", "What do they owe?"]
      : SUGGESTED_QUESTIONS,
  };
}

export function matchQuestion(text: string, scopeHouseholdId?: string): ChatAnswer {
  const input = norm(text);
  if (scopeHouseholdId) {
    const h = householdById(scopeHouseholdId);
    if (h) {
      for (const t of CLIENT_TEMPLATES) {
        if (t.match.some(g => groupMatches(input, g))) return t.build(h);
      }
    }
  }
  for (const entry of QA_BANK) {
    if (entry.match.some(g => groupMatches(input, g))) return entry.build();
  }
  return fallbackAnswer(scopeHouseholdId);
}
