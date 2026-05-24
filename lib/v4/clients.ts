/**
 * Client workspace mock data — v4.
 *
 * Reference: design-references/petal-synthesis.html (Priya Sharma
 * is the exemplar; Marcus and DeShawn are fleshed out to match the
 * mentor-demo script in PETAL-V4-PRD.md §11).
 *
 * Other clients from lib/v4/triage-items.ts render a graceful
 * placeholder workspace until Phase 5 authors them.
 */

export type StatChip = {
  label: string;
  /** Primary value; `$` + digits renders in mono tabular-nums. */
  value: string;
  /** Optional secondary text (e.g. "· 18 d" in mono rust). */
  sub?: string;
  tone?: "default" | "rust" | "positive";
};

export type ClientAction = {
  label: string;
  kbd?: string;
  primary?: boolean;
};

export type InsightStat = { label: string; value: string; rust?: boolean };

export type ClientInsight = {
  /** Short editorial tag: "Needs attention". */
  sectionLabel: string;
  grounding: string[];
  /** Body copy. *asterisk* fragments render italic rust, `$N` renders mono. */
  body: string;
  stats: InsightStat[];
  actions: ClientAction[];
};

export type ProgressCell = {
  label: string;
  /** Primary metric, e.g. "6 of 9" or "40%" or "$350". */
  mainVal: string;
  mainTone?: "default" | "rust" | "positive";
  fillPct: number;
  fillTone?: "default" | "rust" | "positive";
  subVal?: string;
  subUrgent?: boolean;
};

export type NextStep = {
  title: string;
  meta: string;
  state: "current" | "pending" | "done";
};

export type DocRow = {
  type: string;
  name: string;
  size: string;
  when: string;
  status?: "extracted" | "pending" | "flagged";
};

export type MessagePreview = {
  channel: "SMS" | "Portal" | "Email";
  who: string;
  when: string;
  body: string;
  unread?: boolean;
};

export type ActivityEvent = {
  when: string;
  /** Body copy. **double-asterisk** fragments render weight-550 ink. */
  what: string;
  tone?: "default" | "rust" | "positive";
};

export type ComplianceRow = {
  label: string;
  /** "ok" = green check, "miss" = pending N/A dash, "pending" = amber ref */
  state: "ok" | "miss" | "pending";
  /** Authority or date reference, e.g. "Jan 14", "n/a", "pending". */
  ref: string;
};

export type SimilarClient = {
  label: string;
  /** e.g. "Your book · 2023". */
  when: string;
};

export type ClientWorkspace = {
  id: string;
  name: string;
  initials: string;
  serviceTier: string;
  fee: number;
  yearClient: string; // "2nd year client"
  intakeDate: string; // "intake Jan 14"
  referral?: string; // "referred by Ashley Kim"
  /** Triage position context for ← Triage N/M chip. */
  triagePosition?: { index: number; total: number; queueRemaining: number } | null;
  stats: StatChip[];
  tabCounts?: { documents?: number; messages?: number; messagesUnread?: boolean };
  insight: ClientInsight;
  progress: ProgressCell[];
  nextSteps: NextStep[];
  recentDocs: DocRow[];
  recentMessages: MessagePreview[];
  activity: ActivityEvent[];
  compliance: ComplianceRow[];
  similar: SimilarClient[];
};

/* ═══════════════════════════════════════════════════════════════════
   PRIYA SHARMA — workspace source of truth, matches synthesis.html
   ═══════════════════════════════════════════════════════════════════ */

const priya: ClientWorkspace = {
  id: "client-priya-sharma",
  name: "Priya Sharma",
  initials: "PS",
  serviceTier: "Standard",
  fee: 350,
  yearClient: "2nd year client",
  intakeDate: "intake Jan 14",
  referral: "referred by Ashley Kim",
  stats: [
    { label: "Status", value: "Attention", tone: "rust" },
    { label: "Deadline", value: "Apr 15", sub: "· 18 d" },
    { label: "Docs", value: "6 of 9" },
    { label: "Paid", value: "$350", tone: "positive" },
    { label: "Est. refund", value: "~$1,850" },
    { label: "Last contact", value: "12 min ago" }
  ],
  tabCounts: { documents: 9, messages: 14, messagesUnread: true },
  insight: {
    sectionLabel: "Needs attention",
    grounding: [
      "intake form",
      "1099-NEC uploaded 12m ago",
      "prior year Sch C",
      "Q1 to Q3 estimated payments"
    ],
    body: "Priya's TikTok 1099 shows *$34,200* in NEC income, but her January intake estimated around *$20,000*. A *$14,200* gap usually means either a much bigger year than she realized, or a second platform she hasn't mentioned. Her Q1 to Q3 estimated payments were sized to the $20K number, so she's likely short on safe-harbor.",
    stats: [
      { label: "Stated", value: "$20,000" },
      { label: "Actual", value: "$34,200", rust: true },
      { label: "Gap", value: "+$14,200", rust: true },
      { label: "Penalty risk", value: "~$420" }
    ],
    actions: [
      { label: "Draft response", kbd: "R", primary: true },
      { label: "Schedule call", kbd: "C" },
      { label: "Run safe-harbor calc", kbd: "H" },
      { label: "Dismiss", kbd: "X" }
    ]
  },
  progress: [
    {
      label: "Documents",
      mainVal: "6 of 9",
      fillPct: 66,
      subVal: "3 remaining · Q4 estimates requested",
      subUrgent: true
    },
    {
      label: "Return preparation",
      mainVal: "40%",
      fillPct: 40,
      fillTone: "rust",
      subVal: "1040 + Sch C · drafted, gap blocking"
    },
    {
      label: "Client engagement",
      mainVal: "High",
      fillPct: 85,
      fillTone: "positive",
      subVal: "7-day response avg · portal active"
    },
    {
      label: "Billing",
      mainVal: "$350",
      mainTone: "positive",
      fillPct: 100,
      fillTone: "positive",
      subVal: "Paid in full · Mar 14"
    }
  ],
  nextSteps: [
    {
      title: "Resolve the 1099 gap with Priya",
      meta: "3 min · reply to SMS + schedule 10 min call",
      state: "current"
    },
    {
      title: "Collect Q4 estimated payment proof",
      meta: "2 min · portal upload request, auto-reminder set",
      state: "pending"
    },
    {
      title: "Run safe-harbor recalculation with $34,200 income",
      meta: "10 sec · auto-computes penalty exposure and Q4 payment",
      state: "pending"
    },
    {
      title: "Complete 1040 + Sch C preparation",
      meta: "25 min · blocked by #1 · OLT Pro ready",
      state: "pending"
    },
    {
      title: "Engagement letter countersigned",
      meta: "Jan 14 · signed · 7216 consent captured",
      state: "done"
    },
    {
      title: "Deposit collected",
      meta: "Mar 14 · paid in full via Square",
      state: "done"
    }
  ],
  recentDocs: [
    { type: "1099", name: "1099-NEC TikTok.pdf", size: "89 KB", when: "12 min ago", status: "flagged" },
    { type: "W-2", name: "W-2 Whole Foods 2024.pdf", size: "64 KB", when: "3 days ago", status: "extracted" },
    { type: "1099", name: "1099-INT Chase Savings.pdf", size: "41 KB", when: "5 days ago", status: "extracted" },
    { type: "DEP", name: "Q1 – Q3 estimates screenshots.zip", size: "1.2 MB", when: "Mar 10", status: "extracted" },
    { type: "MISS", name: "Q4 estimated payment proof", size: "requested", when: "—", status: "pending" }
  ],
  recentMessages: [
    {
      channel: "SMS",
      who: "Priya",
      when: "12m",
      body: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it.",
      unread: true
    },
    {
      channel: "Portal",
      who: "Antonio",
      when: "Mar 27",
      body: "Thanks Priya — go ahead and upload your TikTok 1099 whenever it arrives."
    },
    {
      channel: "Email",
      who: "Priya",
      when: "Mar 24",
      body: "My brand partnership 1099 should arrive this week. Will upload as soon as…"
    }
  ],
  activity: [
    { when: "12 min ago", what: "**Petal flagged** 1099 gap of $14,200 vs intake", tone: "rust" },
    { when: "12 min ago", what: "Priya uploaded **1099-NEC TikTok.pdf**" },
    { when: "3 days ago", what: "Priya uploaded **W-2 Whole Foods**" },
    { when: "Mar 27", what: "Antonio sent portal message re: 1099" },
    { when: "Mar 14", what: "**$350 deposit** collected via Square", tone: "positive" },
    { when: "Jan 14", what: "Intake completed · 7216 consent captured", tone: "positive" }
  ],
  compliance: [
    { label: "Engagement letter signed", state: "ok", ref: "Jan 14" },
    { label: "§7216 consent captured", state: "ok", ref: "Jan 14" },
    { label: "Digital assets question answered", state: "ok", ref: "Jan 14" },
    { label: "Filing status verified (HoH)", state: "ok", ref: "Jan 14" },
    { label: "8867 due diligence (EIC)", state: "miss", ref: "n/a" },
    { label: "ERO signature", state: "miss", ref: "pending" }
  ],
  similar: [
    {
      label: "**Ashley R.** — 1099 gap $8K, safe-harbor adjustment Q4",
      when: "Your book · 2023"
    },
    {
      label: "**Marcus C.** — creator income undercount, no penalty",
      when: "Your book · 2022"
    },
    {
      label: "**Jen L.** — OnlyFans 1099 vs intake gap, Sch C adj",
      when: "Your book · 2022"
    }
  ]
};

/* ═══════════════════════════════════════════════════════════════════
   MARCUS CHEN — S-corp complexity (EIN mismatch demo)
   ═══════════════════════════════════════════════════════════════════ */

const marcus: ClientWorkspace = {
  id: "client-marcus-chen",
  name: "Marcus Chen",
  initials: "MC",
  serviceTier: "Premium",
  fee: 500,
  yearClient: "3rd year client",
  intakeDate: "intake Jan 20",
  referral: "referred by David Park",
  stats: [
    { label: "Status", value: "Attention", tone: "rust" },
    { label: "Deadline", value: "Apr 15", sub: "· 18 d" },
    { label: "Docs", value: "11 of 14" },
    { label: "Paid", value: "$500", tone: "positive" },
    { label: "Est. refund", value: "$0" },
    { label: "Last contact", value: "2 days ago" }
  ],
  tabCounts: { documents: 14, messages: 6 },
  insight: {
    sectionLabel: "Needs attention",
    grounding: [
      "consulting 1099",
      "LLC EIN on file",
      "prior year S-corp 1120S",
      "compliance engine"
    ],
    body: "One of Marcus's consulting 1099s was issued to his *personal SSN* instead of his LLC's *EIN*. The 2024 1120S already reflects the business income, so filing the personal 1040 without nominee treatment will *double-count* $42,000. Penalty exposure on §6662 substantial-understatement is real.",
    stats: [
      { label: "1099 to SSN", value: "$42,000", rust: true },
      { label: "1120S claimed", value: "$42,000" },
      { label: "Overlap risk", value: "2x", rust: true },
      { label: "§6662 exposure", value: "~$2,100" }
    ],
    actions: [
      { label: "Draft nominee memo", kbd: "R", primary: true },
      { label: "Request corrected 1099", kbd: "C" },
      { label: "Show §6662 math", kbd: "H" },
      { label: "Dismiss", kbd: "X" }
    ]
  },
  progress: [
    {
      label: "Documents",
      mainVal: "11 of 14",
      fillPct: 78,
      subVal: "K-1, vehicle log, §179 schedule pending"
    },
    {
      label: "Return preparation",
      mainVal: "55%",
      fillPct: 55,
      fillTone: "rust",
      subVal: "1040 + 1120S · nominee question blocking"
    },
    {
      label: "Compliance risk",
      mainVal: "Elevated",
      mainTone: "rust",
      fillPct: 40,
      fillTone: "rust",
      subVal: "§6662, reasonable comp, §199A"
    },
    {
      label: "Billing",
      mainVal: "$500",
      mainTone: "positive",
      fillPct: 100,
      fillTone: "positive",
      subVal: "Paid in full · Feb 1"
    }
  ],
  nextSteps: [
    {
      title: "Confirm nominee vs corrected-1099 strategy with Marcus",
      meta: "10 min · call or portal message with both options",
      state: "current"
    },
    {
      title: "Run reasonable-comp analysis on 2024 W-2 vs K-1 split",
      meta: "20 min · IRS guideline calculator auto-populated",
      state: "pending"
    },
    {
      title: "Complete §199A QBI calculation for consulting income",
      meta: "15 min · SSTB threshold review",
      state: "pending"
    },
    {
      title: "Collect remaining K-1, vehicle log, §179 schedule",
      meta: "portal reminders already sent",
      state: "pending"
    },
    { title: "Deposit collected", meta: "Feb 1 · paid in full via Square", state: "done" },
    { title: "Engagement letter countersigned", meta: "Jan 20 · signed", state: "done" }
  ],
  recentDocs: [
    { type: "1099", name: "1099-NEC Strategic Consulting.pdf", size: "112 KB", when: "2 days ago", status: "flagged" },
    { type: "K-1", name: "K-1 Chen Holdings LLC (draft).pdf", size: "256 KB", when: "4 days ago", status: "pending" },
    { type: "1120S", name: "2024 1120S as filed.pdf", size: "1.8 MB", when: "Mar 11", status: "extracted" },
    { type: "W-2", name: "W-2 Chen Holdings (self).pdf", size: "58 KB", when: "Feb 18", status: "extracted" },
    { type: "MISS", name: "§179 equipment disposal schedule", size: "requested", when: "—", status: "pending" }
  ],
  recentMessages: [
    {
      channel: "Email",
      who: "Marcus",
      when: "2d",
      body: "Attaching the consulting 1099 — I think it came in wrong again this year.",
      unread: true
    },
    {
      channel: "Portal",
      who: "Antonio",
      when: "Mar 24",
      body: "Let's get the §179 schedule and K-1 draft over before the nominee question."
    },
    {
      channel: "SMS",
      who: "Marcus",
      when: "Mar 18",
      body: "Quarterly estimates hit — do you need confirmations?"
    }
  ],
  activity: [
    { when: "2 days ago", what: "**Petal flagged** 1099 issued to SSN vs EIN on file", tone: "rust" },
    { when: "2 days ago", what: "Marcus uploaded **1099-NEC Strategic Consulting.pdf**" },
    { when: "4 days ago", what: "Marcus uploaded draft **K-1 Chen Holdings**" },
    { when: "Mar 11", what: "2024 **1120S** filed with IRS" },
    { when: "Feb 1", what: "**$500 deposit** collected via Square", tone: "positive" },
    { when: "Jan 20", what: "Intake completed · 7216 consent captured", tone: "positive" }
  ],
  compliance: [
    { label: "Engagement letter signed", state: "ok", ref: "Jan 20" },
    { label: "§7216 consent captured", state: "ok", ref: "Jan 20" },
    { label: "Reasonable compensation analysis", state: "pending", ref: "in progress" },
    { label: "§199A QBI determination", state: "pending", ref: "pending" },
    { label: "§6662 substantial-understatement review", state: "pending", ref: "pending" },
    { label: "Form 8879 authorization", state: "miss", ref: "pending" }
  ],
  similar: [
    {
      label: "**Kevin P.** — 1099/EIN mismatch, nominee approach",
      when: "Your book · 2023"
    },
    {
      label: "**Rachel G.** — S-corp reasonable comp adjustment",
      when: "Your book · 2023"
    },
    {
      label: "**David P.** — §199A threshold edge case",
      when: "Your book · 2024"
    }
  ]
};

/* ═══════════════════════════════════════════════════════════════════
   DESHAWN WILLIAMS — HoH 8867 compliance risk
   ═══════════════════════════════════════════════════════════════════ */

const deshawn: ClientWorkspace = {
  id: "client-deshawn-williams",
  name: "DeShawn Williams",
  initials: "DW",
  serviceTier: "Basic",
  fee: 150,
  yearClient: "new client",
  intakeDate: "intake Feb 12",
  referral: "walk-in · Riverside referral",
  stats: [
    { label: "Status", value: "8867 risk", tone: "rust" },
    { label: "Deadline", value: "Apr 15", sub: "· 18 d" },
    { label: "Docs", value: "1 of 6" },
    { label: "Paid", value: "$0" },
    { label: "Est. refund", value: "TBD" },
    { label: "Last contact", value: "1 hour ago" }
  ],
  tabCounts: { documents: 1, messages: 2 },
  insight: {
    sectionLabel: "Compliance risk",
    grounding: [
      "HoH filing status claimed",
      "intake: one qualifying child",
      "Form 8867 requirements",
      "prior-year office audit"
    ],
    body: "DeShawn filed as *Head of Household* with a qualifying child but his Form 8867 due diligence is *incomplete*. IRS §6695(g) exposes you to *$600 per failure*. A La Puente office got hit for $18,000 last year on exactly this pattern — worth closing before prep starts.",
    stats: [
      { label: "Penalty", value: "$600", rust: true },
      { label: "Questions open", value: "12 of 14", rust: true },
      { label: "Prior similar", value: "30 returns" },
      { label: "Board exposure", value: "High" }
    ],
    actions: [
      { label: "Open 8867 checklist", kbd: "R", primary: true },
      { label: "Send evidence request", kbd: "C" },
      { label: "Show audit history", kbd: "H" },
      { label: "Dismiss", kbd: "X" }
    ]
  },
  progress: [
    {
      label: "Documents",
      mainVal: "1 of 6",
      fillPct: 16,
      fillTone: "rust",
      subVal: "W-2 only · 5 docs outstanding",
      subUrgent: true
    },
    {
      label: "Return preparation",
      mainVal: "0%",
      fillPct: 0,
      subVal: "Blocked by compliance + deposit"
    },
    {
      label: "Compliance risk",
      mainVal: "High",
      mainTone: "rust",
      fillPct: 25,
      fillTone: "rust",
      subVal: "Form 8867, EIC due-diligence"
    },
    {
      label: "Billing",
      mainVal: "$0",
      fillPct: 0,
      subVal: "Deposit not collected",
      subUrgent: true
    }
  ],
  nextSteps: [
    {
      title: "Complete Form 8867 due-diligence interview",
      meta: "15 min · portal questionnaire auto-generated",
      state: "current"
    },
    {
      title: "Collect $50 deposit",
      meta: "Square link drafted · awaiting send",
      state: "pending"
    },
    {
      title: "Gather qualifying child evidence (school, medical, residency)",
      meta: "portal upload request scheduled",
      state: "pending"
    },
    {
      title: "Confirm HoH status with lease or utility bill",
      meta: "required by 8867 §D",
      state: "pending"
    },
    {
      title: "Engagement letter countersigned",
      meta: "Feb 12 · signed",
      state: "done"
    },
    {
      title: "§7216 consent captured",
      meta: "Feb 12",
      state: "done"
    }
  ],
  recentDocs: [
    { type: "W-2", name: "W-2 SoCal Logistics 2024.pdf", size: "52 KB", when: "1 hour ago", status: "extracted" },
    { type: "MISS", name: "Form 8867 EIC interview", size: "requested", when: "—", status: "pending" },
    { type: "MISS", name: "Qualifying child proof of residency", size: "requested", when: "—", status: "pending" },
    { type: "MISS", name: "Lease agreement (HoH support)", size: "requested", when: "—", status: "pending" },
    { type: "MISS", name: "Childcare receipts if Form 2441", size: "requested", when: "—", status: "pending" }
  ],
  recentMessages: [
    {
      channel: "Portal",
      who: "DeShawn",
      when: "1h",
      body: "Just uploaded my W-2. What else do you need?",
      unread: true
    },
    {
      channel: "SMS",
      who: "Antonio",
      when: "Feb 12",
      body: "Welcome to the firm, DeShawn. I'll send over the intake questionnaire now."
    }
  ],
  activity: [
    { when: "1 hour ago", what: "DeShawn uploaded **W-2 SoCal Logistics.pdf**" },
    { when: "1 hour ago", what: "**Petal flagged** HoH 8867 due-diligence gap", tone: "rust" },
    { when: "Feb 14", what: "Antonio sent intake follow-up reminder" },
    { when: "Feb 12", what: "Intake started · 7216 consent captured", tone: "positive" }
  ],
  compliance: [
    { label: "Engagement letter signed", state: "ok", ref: "Feb 12" },
    { label: "§7216 consent captured", state: "ok", ref: "Feb 12" },
    { label: "Form 8867 due diligence (EIC/HoH)", state: "pending", ref: "in progress" },
    { label: "Qualifying child documentation", state: "pending", ref: "pending" },
    { label: "HoH residency verification", state: "pending", ref: "pending" },
    { label: "Form 8879 authorization", state: "miss", ref: "pending" }
  ],
  similar: [
    {
      label: "**Jasmine T.** — new HoH, 8867 cleared pre-filing",
      when: "Your book · 2023"
    },
    {
      label: "**La Puente office** — $18K §6695(g) penalty pattern",
      when: "IRS examination · 2023"
    },
    {
      label: "**Karen O.** — HoH with audit-defensible evidence",
      when: "Your book · 2022"
    }
  ]
};

export const CLIENT_WORKSPACES: Record<string, ClientWorkspace> = {
  [priya.id]: priya,
  [marcus.id]: marcus,
  [deshawn.id]: deshawn
};

export function getClientWorkspace(id: string): ClientWorkspace | null {
  return CLIENT_WORKSPACES[id] ?? null;
}
