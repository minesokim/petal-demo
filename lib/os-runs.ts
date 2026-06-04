// Petal OS — agent runs (the Tasks review queue substrate).
// Every agent run lands here as a reviewable draft awaiting a human.
// Mock data for the agentic-os prototype.

export type RunStatus = "to_review" | "scheduled" | "running" | "escalated" | "done";

export interface RunStep {
  label: string;
  detail?: string;
  /** progress for a running step */
  active?: boolean;
}

export interface DiffRow {
  label: string;
  prior?: string;
  current: string;
  /** -0.40 = down 40%, 0.12 = up 12%, undefined = new/neutral */
  delta?: number;
  /** "new" creates a row, "changed" edits, "flag" needs attention */
  kind?: "new" | "changed" | "flag";
  /** citation source doc + page */
  cite?: string;
}

export interface AgentRun {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  businessName?: string;
  /** the skill/agent that produced this run */
  agent: string;
  status: RunStatus;
  /** 0–1 */
  confidence: number;
  /** relative time label */
  when: string;
  /** short type tag */
  type: string;
  /** the agent's plain-language summary of the run */
  summary: string;
  steps: RunStep[];
  diff: DiffRow[];
  /** the agent's reasoning shown in the provenance rail */
  reasoning: string;
  sources: string[];
  /** for escalated runs: why it stopped */
  escalation?: string;
  /** for scheduled runs: when it will run */
  scheduledFor?: string;
}

export const agentRuns: AgentRun[] = [
  {
    id: "r1",
    title: "Drafted 2025 Form 1040 + Schedule C",
    clientId: "c1",
    clientName: "Marcus Chen",
    businessName: "Golden Dragon LLC",
    agent: "1040 Drafter",
    status: "to_review",
    confidence: 0.82,
    when: "2h ago",
    type: "Return draft",
    summary:
      "Drafted the 2025 return from 10 source documents. Wages dropped 40% versus 2024 — flagged for verbal confirmation before filing. Created Schedule C for the restaurant.",
    steps: [
      { label: "Pulled 10 documents from portal", detail: "W-2, 3× 1099-NEC, 1098, K-1, receipts" },
      { label: "Extracted figures via OCR", detail: "38 fields, 2 low-confidence" },
      { label: "Matched against 2024 return", detail: "Prior-year comparison" },
      { label: "Drafted Form 1040 + Schedule C", detail: "Restaurant — Golden Dragon LLC" },
      { label: "Flagged 1 item for review", detail: "Wages −40% YoY" },
    ],
    diff: [
      { label: "Wages (W-2 box 1)", prior: "$96,400", current: "$58,000", delta: -0.4, kind: "flag", cite: "W-2 2025 · box 1" },
      { label: "Business income (Sch C)", prior: "$142,000", current: "$168,500", delta: 0.187, cite: "1099-NEC + POS export" },
      { label: "Schedule C — Golden Dragon LLC", current: "Created", kind: "new", cite: "Business return setup" },
      { label: "Estimated tax owed", prior: "$21,300", current: "$24,880", delta: 0.168, cite: "Calculated" },
      { label: "QBI deduction", current: "$33,700", kind: "new", cite: "§199A worksheet" },
    ],
    reasoning:
      "Wages fell 40% because the second location closed in Q2 (per Apr 8 meeting note). This is consistent with the POS export showing 8 months of operation. I could not verify the W-2 reduction against a termination letter, so I flagged it rather than filing. Everything else reconciles to source documents within $5.",
    sources: ["W-2 2025.pdf", "1099-NEC (3).pdf", "POS_export_2025.csv", "2024 Return.pdf"],
  },
  {
    id: "r2",
    title: "Reconciled Q4 books before close",
    clientId: "c11",
    clientName: "David Park",
    businessName: "Park Family Dental",
    agent: "Reconciler",
    status: "to_review",
    confidence: 0.91,
    when: "4h ago",
    type: "Reconciliation",
    summary:
      "Reconciled the Q4 general ledger against bank + payroll. 142 transactions matched automatically; 3 uncategorized expenses need a category before the books close.",
    steps: [
      { label: "Synced bank feed", detail: "Chase Business · Oct–Dec" },
      { label: "Matched 142 transactions", detail: "98% auto-matched" },
      { label: "Flagged 3 uncategorized", detail: "$4,210 total" },
      { label: "Drafted closing entries", detail: "Depreciation + payroll accrual" },
    ],
    diff: [
      { label: "Uncategorized expense", current: "$2,800 — equipment?", kind: "flag", cite: "Txn #1184 · Dec 3" },
      { label: "Uncategorized expense", current: "$910 — meals?", kind: "flag", cite: "Txn #1190 · Dec 9" },
      { label: "Uncategorized expense", current: "$500 — software?", kind: "flag", cite: "Txn #1203 · Dec 18" },
      { label: "Depreciation (closing entry)", current: "$12,400", kind: "new", cite: "Fixed-asset schedule" },
    ],
    reasoning:
      "98% of Q4 transactions matched cleanly to prior categorization patterns. The 3 flagged items have no historical match and exceed the $250 auto-categorize threshold set in the Firm Constitution, so I held them for your call rather than guessing.",
    sources: ["Chase_Q4.csv", "Gusto_payroll.pdf", "Fixed_assets_2024.xlsx"],
  },
  {
    id: "r3",
    title: "Chased 4 missing documents",
    clientId: "c2",
    clientName: "Priya Sharma",
    agent: "Doc Chase",
    status: "to_review",
    confidence: 0.95,
    when: "Yesterday",
    type: "Document chase",
    summary:
      "Drafted a friendly reminder for the 4 outstanding documents. Tone matched your past messages to creators. Ready to send from your address.",
    steps: [
      { label: "Checked document checklist", detail: "3 of 7 received" },
      { label: "Identified 4 missing", detail: "2× 1099-NEC, mileage log, home-office sq ft" },
      { label: "Drafted reminder email", detail: "Matched firm voice" },
    ],
    diff: [
      { label: "Missing — 1099-NEC (TikTok)", current: "Requested", kind: "new" },
      { label: "Missing — 1099-NEC (brand deal)", current: "Requested", kind: "new" },
      { label: "Missing — mileage log", current: "Requested", kind: "new" },
      { label: "Missing — home-office sq ft", current: "Requested", kind: "new" },
    ],
    reasoning:
      "Priya is a first-year creator client (per memory) and responds best to plain, warm language — I avoided jargon and listed exactly what each form looks like. Draft only; nothing sends until you approve.",
    sources: ["Document checklist · Priya Sharma", "Firm voice profile"],
  },
  {
    id: "r4",
    title: "Calculated capital gains on stock sales",
    clientId: "c19",
    clientName: "Anthony Russo",
    agent: "1040 Drafter",
    status: "escalated",
    confidence: 0.58,
    when: "Yesterday",
    type: "Return draft",
    summary:
      "Began the capital-gains calc but the brokerage 1099-B is missing cost basis on 7 of 23 lots. Escalated — needs the original purchase records to compute gain.",
    steps: [
      { label: "Parsed 1099-B", detail: "23 lots" },
      { label: "Matched 16 lots to basis", detail: "Wash-sale check clean" },
      { label: "Stopped — 7 lots missing basis", detail: "Cannot compute gain", active: true },
    ],
    diff: [
      { label: "Short-term gain (16 lots)", current: "$8,420", cite: "1099-B · matched lots" },
      { label: "Long-term gain", current: "Incomplete — 7 lots", kind: "flag", cite: "1099-B · missing basis" },
    ],
    reasoning:
      "7 lots show 'basis not reported to IRS.' Filing without basis would overstate the gain and the tax. I need the original purchase confirmations (or a basis figure from Anthony) before I can finish — so I escalated rather than guess.",
    sources: ["1099-B Schwab.pdf"],
    escalation: "Missing cost basis on 7 of 23 lots — needs client's purchase records.",
  },
  {
    id: "r5",
    title: "Prep brief for tomorrow's 1120S review call",
    clientId: "c6",
    clientName: "Roberto Fuentes",
    businessName: "Fuentes Transport Inc",
    agent: "Meeting Prep",
    status: "running",
    confidence: 0.88,
    when: "Running now",
    type: "Meeting prep",
    summary:
      "Assembling a one-page brief for the 9:00am call: open items, last meeting's commitments, and the 3 depreciation questions Roberto raised.",
    steps: [
      { label: "Pulled relationship memory", detail: "3-year history" },
      { label: "Summarized last meeting", detail: "Mar 12 · depreciation" },
      { label: "Drafting agenda + talking points", active: true },
    ],
    diff: [],
    reasoning:
      "Building from client memory + the 1120S draft. Will land in your queue ~15 min before the call.",
    sources: ["Client memory · Roberto Fuentes", "1120S draft 2025"],
  },
  {
    id: "r6",
    title: "Estimated-payment vouchers (2026 Q1)",
    clientId: "c9",
    clientName: "Miguel Sandoval",
    businessName: "Sandoval Plumbing",
    agent: "Estimated Payments",
    status: "scheduled",
    confidence: 0.9,
    when: "Scheduled",
    type: "Estimated payments",
    summary:
      "Will compute 2026 Q1 estimated vouchers from the filed 2025 return using the safe-harbor method, then draft a payment reminder.",
    steps: [{ label: "Waiting on 2025 filing", detail: "Runs after return is filed" }],
    diff: [],
    reasoning: "Scheduled to run automatically once the 2025 return is filed and accepted.",
    sources: ["Firm Constitution · safe-harbor rule"],
    scheduledFor: "After 2025 filing",
  },
  {
    id: "r7",
    title: "Drafted return + e-file package",
    clientId: "c3",
    clientName: "James & Sofia Rodriguez",
    agent: "1040 Drafter",
    status: "done",
    confidence: 0.96,
    when: "2 days ago",
    type: "Return draft",
    summary:
      "Drafted the 2025 MFJ return with rental income. Approved by you and sent for signature.",
    steps: [
      { label: "Drafted Form 1040 + Schedule E", detail: "Rental property" },
      { label: "Approved by Antonio", detail: "2 days ago" },
      { label: "Sent for e-signature", detail: "8879" },
    ],
    diff: [
      { label: "Rental income (Sch E)", prior: "$24,000", current: "$26,400", delta: 0.1, cite: "1099 + lease" },
      { label: "Refund", prior: "$1,200", current: "$2,840", delta: 1.36, cite: "Calculated" },
    ],
    reasoning: "Clean match to source docs. Approved without edits.",
    sources: ["W-2 (2).pdf", "1099-MISC rental.pdf", "2024 Return.pdf"],
  },
];

export const runStatusMeta: Record<RunStatus, { label: string; dot: string; pill: string }> = {
  to_review: { label: "To review", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700" },
  scheduled: { label: "Scheduled", dot: "bg-slate-400", pill: "bg-slate-100 text-slate-600" },
  running: { label: "Running", dot: "bg-blue-500", pill: "bg-blue-50 text-blue-700" },
  escalated: { label: "Escalated", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700" },
  done: { label: "Done", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
};
