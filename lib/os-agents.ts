// Petal OS — the firm's AI staff (Workforce) and the repeatable jobs they run (Skills).
// Mock data for the agentic-os prototype. Modeled on Relevance/Writer (roster) +
// Cal.com/Airtable (skill definition) + Sana (agent builder tabs).

import type { IconSvgElement } from "@hugeicons/react";
import {
  TaxesIcon, Exchange01Icon, Mail01Icon, Calendar03Icon, ClipboardIcon, Mic01Icon,
} from "@hugeicons/core-free-icons";

export type Autonomy = "drafts" | "asks" | "auto";

export const autonomyMeta: Record<Autonomy, { label: string; blurb: string; dot: string; pill: string }> = {
  drafts: { label: "Drafts only", blurb: "Everything lands in Tasks for review.", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  asks: { label: "Asks first", blurb: "Acts after a one-tap confirm.", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700" },
  auto: { label: "Autonomous", blurb: "Runs within Constitution limits.", dot: "bg-violet-500", pill: "bg-violet-50 text-violet-700" },
};

export interface Agent {
  id: string;
  name: string;
  /** lucide icon name resolved in the page */
  icon: string;
  /** tailwind gradient classes for the premium avatar (color = identity) */
  gradient: string;
  /** white glyph rendered on top of the gradient avatar */
  glyph: IconSvgElement;
  purpose: string;
  autonomy: Autonomy;
  runsThisWeek: number;
  pctAuto: number; // 0–100 — % that went through without edits
  pctReview: number; // 0–100 — % that needed a human edit/send-back
  lastActive: string;
  /** Persona tab — instructions, inherits the Firm Constitution */
  persona: string;
  /** Knowledge tab — what context it sees */
  knowledge: string[];
  /** Skills tab — skill ids it can run */
  skills: string[];
  /** Visibility tab — who can use / approve */
  visibility: string;
  /** when the agent was added to the firm */
  created: string;
  /** per-connector guardrails (Base44 pattern) */
  connectorRules?: { service: string; rule: string }[];
}

export const agents: Agent[] = [
  {
    id: "a-1040",
    name: "1040 Drafter",
    icon: "FileText",
    gradient: "from-indigo-500 to-violet-500",
    glyph: TaxesIcon,
    purpose: "Drafts individual & business returns from source documents, with a reviewable diff.",
    autonomy: "drafts",
    runsThisWeek: 34,
    pctAuto: 78,
    pctReview: 22,
    lastActive: "2h ago",
    persona:
      "You draft U.S. individual and business returns. Reconcile every figure to a source document and cite it. When a number moves >25% year-over-year, flag it for verbal confirmation rather than filing. Never file — produce a draft for review.",
    knowledge: ["Firm Constitution", "Client Memory (scoped)", "Prior-year returns", "Document checklist"],
    skills: ["s-1040", "s-schc", "s-capgains"],
    visibility: "All preparers · approvals by Antonio + reviewers",
    created: "Jan 2026",
  },
  {
    id: "a-rec",
    name: "Reconciler",
    icon: "Scale",
    gradient: "from-emerald-500 to-teal-500",
    glyph: Exchange01Icon,
    purpose: "Reconciles books against bank + payroll and drafts closing entries before a close.",
    autonomy: "asks",
    runsThisWeek: 18,
    pctAuto: 91,
    pctReview: 9,
    lastActive: "4h ago",
    persona:
      "You reconcile general ledgers against bank and payroll feeds. Auto-match transactions to prior categorization patterns. Hold any uncategorized item above the firm threshold ($250) for a human. Draft closing entries; never post them.",
    knowledge: ["Firm Constitution", "Chart of accounts", "Bank/payroll connectors", "Prior periods"],
    skills: ["s-bankrec", "s-close"],
    visibility: "Antonio + bookkeepers · approvals by Antonio",
    created: "Nov 2025",
    connectorRules: [
      { service: "Chase Business", rule: "Read transactions only — never initiate transfers." },
      { service: "Gusto", rule: "Read payroll runs; no employee edits." },
    ],
  },
  {
    id: "a-chase",
    name: "Doc Chase",
    icon: "MailQuestion",
    gradient: "from-amber-500 to-orange-500",
    glyph: Mail01Icon,
    purpose: "Tracks the document checklist and drafts friendly, on-brand reminders for what's missing.",
    autonomy: "asks",
    runsThisWeek: 47,
    pctAuto: 95,
    pctReview: 5,
    lastActive: "Yesterday",
    persona:
      "You watch each client's document checklist and draft reminders for missing items. Match the firm's warm, plain-language voice. Describe what each form looks like. Draft only — nothing sends without approval.",
    knowledge: ["Firm voice profile", "Document checklists", "Client Memory (scoped)"],
    skills: ["s-chase"],
    visibility: "All preparers · send approved by assigned preparer",
    created: "Sep 2025",
    connectorRules: [
      { service: "Gmail", rule: "Draft only — never send without approval." },
      { service: "Client portal", rule: "Read checklist status; post reminders to drafts." },
    ],
  },
  {
    id: "a-est",
    name: "Estimated Payments",
    icon: "CalendarClock",
    gradient: "from-sky-500 to-blue-600",
    glyph: Calendar03Icon,
    purpose: "Computes quarterly estimated vouchers via safe-harbor and drafts the reminder.",
    autonomy: "drafts",
    runsThisWeek: 9,
    pctAuto: 88,
    pctReview: 12,
    lastActive: "3d ago",
    persona:
      "After a return is filed, compute next-year quarterly estimated payments using the safe-harbor method defined in the Firm Constitution. Draft the voucher set and a plain-language reminder.",
    knowledge: ["Firm Constitution · safe-harbor rule", "Filed returns", "Client Memory (scoped)"],
    skills: ["s-est"],
    visibility: "All preparers · approvals by Antonio",
    created: "Feb 2026",
  },
  {
    id: "a-prep",
    name: "Meeting Prep",
    icon: "ClipboardList",
    gradient: "from-rose-500 to-pink-500",
    glyph: ClipboardIcon,
    purpose: "Assembles a one-page brief before every client call from memory + open work.",
    autonomy: "auto",
    runsThisWeek: 12,
    pctAuto: 100,
    pctReview: 0,
    lastActive: "Running",
    persona:
      "Before each scheduled client call, assemble a one-page brief: relationship summary, last meeting's commitments, open items, and any flags from current drafts. Deliver ~15 minutes before the call.",
    knowledge: ["Client Memory (full)", "Calendar", "Open runs", "Comms history"],
    skills: ["s-prep"],
    visibility: "Assigned preparer only · informational (no approval needed)",
    created: "Mar 2026",
    connectorRules: [
      { service: "Google Calendar", rule: "Read events only." },
    ],
  },
  {
    id: "a-note",
    name: "Notetaker",
    icon: "Mic",
    gradient: "from-violet-500 to-fuchsia-500",
    glyph: Mic01Icon,
    purpose: "Joins meetings, captures notes, and writes commitments back into Client Memory.",
    autonomy: "auto",
    runsThisWeek: 7,
    pctAuto: 100,
    pctReview: 0,
    lastActive: "Apr 8",
    persona:
      "Join scheduled client meetings, transcribe, and extract decisions, commitments, and key facts. Write a structured summary into Client Memory and tag follow-ups. Never share recordings externally.",
    knowledge: ["Calendar", "Client Memory (write)", "Meeting transcripts"],
    skills: ["s-notes"],
    visibility: "Firm-wide memory · recordings retained 90 days",
    created: "Oct 2025",
    connectorRules: [
      { service: "Zoom / Meet", rule: "Join scheduled calls; no external sharing." },
    ],
  },
];

export interface Skill {
  id: string;
  name: string;
  purpose: string;
  /** plain-text, non-dev authorable definition */
  definition: string;
  trigger: string;
  steps: { title: string; detail: string }[];
  /** the defined output schema, plain language */
  output: string;
  version: string;
  /** "improved from N review notes" — the compounding loop */
  improvedFrom: number;
  runsTotal: number;
  /** which agent owns this skill */
  ownerAgentId: string;
  firmDistributed: boolean;
}

export const skills: Skill[] = [
  {
    id: "s-1040",
    name: "Draft Form 1040",
    purpose: "Turn source documents into a reviewable individual return draft.",
    definition:
      "Pull the client's documents, extract every figure via OCR, match against the prior-year return, and draft Form 1040. Cite each number to its source. Flag any line that moves more than 25% year-over-year.",
    trigger: "When a client's documents reach 100% complete, or on demand from a record.",
    steps: [{ title: "Pull documents from portal", detail: "Gather every form the client uploaded." }, { title: "Extract figures (OCR)", detail: "Read each document and pull the numbers." }, { title: "Match to prior year", detail: "Compare line-by-line against last year's return." }, { title: "Draft Form 1040", detail: "Assemble the return with a citation on every figure." }, { title: "Flag large YoY changes", detail: "Surface anything that moved more than 25%." }],
    output: "Form 1040 draft + per-line citations + flagged items → Tasks queue.",
    version: "v4",
    improvedFrom: 11,
    runsTotal: 312,
    ownerAgentId: "a-1040",
    firmDistributed: true,
  },
  {
    id: "s-schc",
    name: "Build Schedule C",
    purpose: "Construct a Schedule C for a sole-prop or single-member LLC.",
    definition:
      "From the client's business records and POS/bank exports, classify income and expenses into Schedule C categories, compute SE tax, and apply the QBI deduction worksheet. Cite the source for each total.",
    trigger: "When a return has business income, or on demand.",
    steps: [{ title: "Classify income & expenses", detail: "Map POS and bank activity to Schedule C lines." }, { title: "Compute SE tax", detail: "Calculate self-employment tax owed." }, { title: "Apply QBI worksheet", detail: "Run the §199A qualified-business-income deduction." }, { title: "Attach to return draft", detail: "Fold the Schedule C into the 1040." }],
    output: "Schedule C draft + QBI worksheet + citations → attached to the return.",
    version: "v3",
    improvedFrom: 6,
    runsTotal: 128,
    ownerAgentId: "a-1040",
    firmDistributed: true,
  },
  {
    id: "s-capgains",
    name: "Capital gains calc",
    purpose: "Compute gains/losses from a brokerage 1099-B with wash-sale checks.",
    definition:
      "Parse the 1099-B, match every lot to its cost basis, run wash-sale detection, and total short- vs long-term gains. If any lot is missing basis, stop and escalate rather than overstating the gain.",
    trigger: "When a 1099-B is uploaded, or on demand.",
    steps: [{ title: "Parse 1099-B lots", detail: "Read every reported lot from the brokerage." }, { title: "Match cost basis", detail: "Pair each sale with its purchase basis." }, { title: "Wash-sale check", detail: "Detect and adjust disallowed losses." }, { title: "Total ST/LT gains", detail: "Sum short- and long-term gains." }, { title: "Escalate if basis missing", detail: "Stop rather than overstate the gain." }],
    output: "Schedule D / Form 8949 draft + citations, or an escalation → Tasks.",
    version: "v2",
    improvedFrom: 4,
    runsTotal: 61,
    ownerAgentId: "a-1040",
    firmDistributed: true,
  },
  {
    id: "s-bankrec",
    name: "Bank reconciliation",
    purpose: "Reconcile a period's ledger against the bank feed.",
    definition:
      "Sync the bank feed for the period, auto-match transactions to prior categorization patterns, and hold any uncategorized item above the firm threshold for a human. Surface duplicates and missing entries.",
    trigger: "Monthly close, or on demand.",
    steps: [{ title: "Sync bank feed", detail: "Pull the period's transactions from the bank." }, { title: "Auto-match transactions", detail: "Categorize against prior patterns." }, { title: "Flag uncategorized > $250", detail: "Hold ambiguous items above the firm threshold." }, { title: "Surface duplicates", detail: "Catch anything double-entered." }],
    output: "Reconciliation draft + flagged items → Tasks queue.",
    version: "v5",
    improvedFrom: 14,
    runsTotal: 204,
    ownerAgentId: "a-rec",
    firmDistributed: true,
  },
  {
    id: "s-close",
    name: "Month-end close",
    purpose: "Draft closing entries for a clean period close.",
    definition:
      "After reconciliation, draft depreciation, payroll-accrual, and adjusting entries from the fixed-asset and payroll schedules. Produce a close checklist. Never post entries — draft only.",
    trigger: "After bank reconciliation passes.",
    steps: [{ title: "Draft depreciation entry", detail: "Post from the fixed-asset schedule." }, { title: "Draft payroll accrual", detail: "Accrue wages through period end." }, { title: "Adjusting entries", detail: "Prepaids, deferrals, and corrections." }, { title: "Close checklist", detail: "Confirm the books are ready to close." }],
    output: "Closing-entry draft + close checklist → Tasks queue.",
    version: "v3",
    improvedFrom: 8,
    runsTotal: 96,
    ownerAgentId: "a-rec",
    firmDistributed: true,
  },
  {
    id: "s-chase",
    name: "Chase missing documents",
    purpose: "Draft a friendly reminder for outstanding documents.",
    definition:
      "Compare the document checklist to what's received, list what's missing in plain language (with a description of each form), and draft a reminder in the firm's voice. Draft only.",
    trigger: "When a checklist is incomplete after 5 days of inactivity.",
    steps: [{ title: "Diff checklist vs received", detail: "Find exactly what's still outstanding." }, { title: "Describe each missing item", detail: "Explain what each form looks like." }, { title: "Draft reminder in firm voice", detail: "Write a warm, on-brand nudge." }],
    output: "Reminder email draft → Tasks queue for one-tap send.",
    version: "v6",
    improvedFrom: 19,
    runsTotal: 488,
    ownerAgentId: "a-chase",
    firmDistributed: true,
  },
  {
    id: "s-est",
    name: "Estimated payments",
    purpose: "Compute next-year quarterly vouchers and a reminder.",
    definition:
      "From the filed return, compute quarterly estimated payments using the safe-harbor method in the Firm Constitution. Draft the voucher set and a plain-language reminder with due dates.",
    trigger: "After a return is filed and accepted.",
    steps: [{ title: "Read filed return", detail: "Start from this year's filed numbers." }, { title: "Apply safe-harbor method", detail: "Use the rule set in the Firm Constitution." }, { title: "Compute 4 vouchers", detail: "Calculate each quarterly payment." }, { title: "Draft reminder", detail: "Write the client a plain-language note." }],
    output: "Voucher set + reminder draft → Tasks queue.",
    version: "v2",
    improvedFrom: 3,
    runsTotal: 74,
    ownerAgentId: "a-est",
    firmDistributed: true,
  },
  {
    id: "s-prep",
    name: "Pre-call brief",
    purpose: "One-page brief before a client call.",
    definition:
      "Before each call, assemble: a relationship summary, last meeting's commitments, open items, and any flags from current drafts. Keep it to one page in plain language.",
    trigger: "~15 minutes before a scheduled client meeting.",
    steps: [{ title: "Pull relationship memory", detail: "Load the client's full history." }, { title: "Summarize last meeting", detail: "Recap commitments and open items." }, { title: "List open items + flags", detail: "Surface anything that needs attention." }, { title: "Draft agenda", detail: "Assemble a one-page brief." }],
    output: "One-page brief → Tasks (informational) + the client record.",
    version: "v2",
    improvedFrom: 5,
    runsTotal: 58,
    ownerAgentId: "a-prep",
    firmDistributed: false,
  },
  {
    id: "s-notes",
    name: "Meeting notes → Memory",
    purpose: "Capture a meeting into the client's living memory.",
    definition:
      "Transcribe the meeting, extract decisions, commitments, and key facts, and write a structured summary into Client Memory. Tag follow-ups and create draft tasks for each commitment.",
    trigger: "When a scheduled client meeting ends.",
    steps: [{ title: "Transcribe meeting", detail: "Capture the full conversation." }, { title: "Extract decisions & commitments", detail: "Pull out what was agreed." }, { title: "Write to Client Memory", detail: "Save a structured summary." }, { title: "Create follow-up tasks", detail: "Turn each commitment into a task." }],
    output: "Memory entry + tagged follow-ups → the client record.",
    version: "v4",
    improvedFrom: 9,
    runsTotal: 142,
    ownerAgentId: "a-note",
    firmDistributed: true,
  },
];
