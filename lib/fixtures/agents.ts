// Petal's AI team. Agents are the user-facing workers; skills are the bounded
// sub-capabilities each one runs (never a shared pool, never user-facing as a
// thing you assign). A solo firm recognizes these five as jobs in their office.
//
// Autonomy is one scale every agent uses; any single task can override the
// agent's default. Internal work / monitoring / math can run on its own;
// anything client-facing or that becomes a filing drafts and waits.

import {
  FileSearch, ClipboardCheck, Landmark, CalendarClock, MessagesSquare,
  type LucideIcon,
} from "lucide-react";

export type Autonomy = "off" | "draft" | "review" | "auto";

export const autonomyMeta: Record<Autonomy, { label: string; blurb: string; dot: string }> = {
  off:    { label: "Off",         blurb: "Dormant.",                                                  dot: "bg-[var(--os-ink-subtle)]" },
  draft:  { label: "Draft",       blurb: "Prepares everything. Nothing sends without you.",           dot: "bg-amber-500" },
  review: { label: "Review-gate", blurb: "Acts, but client-facing or external steps wait for a tap.", dot: "bg-blue-500" },
  auto:   { label: "Auto",        blurb: "Runs and logs on its own. Internal and monitoring only.",   dot: "bg-emerald-500" },
};
export const AUTONOMY_ORDER: Autonomy[] = ["off", "draft", "review", "auto"];

export interface Agent {
  id: string;
  /** functional name, never a human first name (Doc Chase, not Marcus) */
  name: string;
  /** short job-title for the role */
  role: string;
  /** what it does, in the firm's words */
  blurb: string;
  /** bounded sub-capabilities of this agent's domain */
  skills: string[];
  /** the task type this agent is eligible for (gates the assignee dropdown) */
  taskType: string;
  /** default autonomy tier */
  autonomy: Autonomy;
  /** roles whose autonomy genuinely splits across actions */
  splitNote?: string;
  on: boolean;
  icon: LucideIcon;
  /** this season, so the page shows it earning trust */
  drafted: number;
  approved: number;
}

export const agents: Agent[] = [
  {
    id: "doc-chase",
    name: "Doc Chase",
    role: "The collector",
    blurb: "Watches email, the portal, and texts. Recognizes which client and return a document belongs to, files it, works out what's still missing against last year, and chases on the client's cadence.",
    skills: ["Recognize & file", "Find what's missing", "Draft the chase", "Escalate cadence"],
    taskType: "Doc chase",
    autonomy: "review",
    on: true,
    icon: FileSearch,
    drafted: 23, approved: 21,
  },
  {
    id: "prep-review",
    name: "Prep & Review",
    role: "First-pass preparer",
    blurb: "The moment docs land, it extracts the fields, builds a workpaper with every number tied to its source, runs variance and anomaly checks, and hands you a review-ready package. You key or import into your software and file there.",
    skills: ["Extract fields", "Sourced workpaper", "Variance review", "Anomaly flags", "Organizer pre-fill"],
    taskType: "Prep / review",
    autonomy: "draft",
    splitNote: "It touches numbers, so it never auto-acts. It proposes and waits, every time.",
    on: true,
    icon: ClipboardCheck,
    drafted: 14, approved: 12,
  },
  {
    id: "irs-desk",
    name: "IRS Desk",
    role: "Representation desk",
    blurb: "Reads an inbound IRS notice, matches it to the client and return, pulls the figures, and drafts the response. Separately, it sweeps transcripts on a schedule and turns any change into a drafted next step.",
    skills: ["Read & match notice", "Pull the figures", "Draft response", "Transcript sweep"],
    taskType: "Notice / IRS",
    autonomy: "draft",
    splitNote: "The transcript sweep runs on Auto (internal monitoring). Every notice response is Draft.",
    on: true,
    icon: Landmark,
    drafted: 6, approved: 6,
  },
  {
    id: "deadlines",
    name: "Deadlines & Estimates",
    role: "The timing keeper",
    blurb: "Computes the quarterly estimate vouchers, nudges the clients who owe, tracks every deadline, and drafts extensions.",
    skills: ["Compute vouchers", "Estimate reminders", "Track deadlines", "Draft extensions"],
    taskType: "Deadline / estimate",
    autonomy: "review",
    splitNote: "Voucher math and deadline tracking run Auto. Reminders are Review-gate, extension drafts wait for you.",
    on: true,
    icon: CalendarClock,
    drafted: 9, approved: 8,
  },
  {
    id: "client-comms",
    name: "Client Comms",
    role: "The front desk",
    blurb: "Chases the 8879 when it's viewed but unsigned, drafts refund-status replies, assembles the pre-call brief before a meeting, and drafts general client messages.",
    skills: ["8879 follow-up", "Refund-status reply", "Pre-call brief", "Draft message"],
    taskType: "Client message",
    autonomy: "draft",
    on: true,
    icon: MessagesSquare,
    drafted: 11, approved: 10,
  },
];

export const agentById = (id: string) => agents.find(a => a.id === id);

// A task's skill resolves to exactly one eligible agent (or none). This is what
// keeps the assignee dropdown small: the work decides which specialist is on the
// menu, so you never pick from a pile. "Books" maps to no agent on purpose
// (out of scope — you read reconciled data, you don't staff against it).
const SKILL_AGENT: Record<string, string> = {
  "sk-doc-chase": "doc-chase",
  "sk-variance": "prep-review",
  "sk-1099": "prep-review",
  "sk-olt-pull": "prep-review",
  "sk-notice": "irs-desk",
  "sk-transcript": "irs-desk",
  "sk-estimates": "deadlines",
  "sk-deadline": "deadlines",
  "sk-signature": "client-comms",
  "sk-precall": "client-comms",
  "sk-invoice": "client-comms",
};

export const agentForSkill = (skillId: string): Agent | undefined => {
  const id = SKILL_AGENT[skillId];
  return id ? agentById(id) : undefined;
};
