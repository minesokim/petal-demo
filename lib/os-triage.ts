// Petal OS — Tasks = the AI workforce's task queue (the firm's single review surface).
// Every actionable signal an agent produces surfaces here: drafted returns, reconciled books,
// missing docs, signatures, extensions, notices, amendments, discoveries, e-file receipts —
// each OWNED by a named agent, governed by a trust tier, and addressable as an API/MCP resource.
// Agent-produced items link to their run (lib/os-runs) for the cited diff.

export type Tier = "right_now" | "today" | "waiting" | "needs_review";
export type Trust = "auto" | "drafts" | "asks" | "manual";

export const tierMeta: Record<Tier, { label: string; blurb: string; dot: string }> = {
  right_now: { label: "Right now", blurb: "Time-sensitive — needs you today", dot: "bg-red-500" },
  today: { label: "Today", blurb: "Drafts ready for your review", dot: "bg-amber-500" },
  waiting: { label: "Waiting", blurb: "In progress or scheduled", dot: "bg-slate-400" },
  needs_review: { label: "Reviewed & done", blurb: "Petal handled it — here's the receipt", dot: "bg-emerald-500" },
};
export const TIER_ORDER: Tier[] = ["right_now", "today", "waiting", "needs_review"];

export const trustMeta: Record<Trust, { label: string; pill: string; dot: string }> = {
  auto: { label: "Petal handled", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  drafts: { label: "Draft ready", pill: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  asks: { label: "Your call", pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  manual: { label: "Manual", pill: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};

export interface TriageItem {
  id: string;
  tier: Tier;
  type: string;
  typeLabel: string;
  clientName: string;
  householdId: string;
  title: string;
  whyNow: string;
  trust: Trust;
  confidence?: number;
  estimatedMin: number;
  when: string;
  sources: string[];
  recommendation?: string;
  recommendedReply?: string;
  evidence?: { label: string; detail: string }[];
  /** links to lib/os-runs agentRuns for the cited diff */
  runId?: string;
  agent?: string;
  /** the surface this task opens into (record / inbox / return) */
  deepLink?: string;
  /** "Once resolved →" — what the workforce does next, the chaining loop */
  nextStep?: string;
}

export const triage: TriageItem[] = [
  // ── Right now ──────────────────────────────────────────────
  {
    id: "tr-deshawn", tier: "right_now", type: "document_gap", typeLabel: "Missing documents",
    clientName: "DeShawn Williams", householdId: "h-deshawn",
    title: "W-2 still missing — filing deadline at risk", whyNow: "DeShawn hasn't uploaded his W-2 and the deadline is close. Petal drafted a reminder; nothing sends until you approve.",
    trust: "drafts", estimatedMin: 1, when: "Due Apr 15", agent: "Doc Chase",
    sources: ["Document checklist · DeShawn Williams"],
    recommendedReply: "Hi DeShawn — quick reminder that we still need your W-2 to start your return, and the deadline is coming up. You can text a photo right here or upload it to the portal. Happy to help if anything's unclear!",
    deepLink: "/os/clients/h-deshawn",
    nextStep: "Once the W-2 lands → 1040 Drafter starts the return automatically.",
  },
  {
    id: "tr-russo", tier: "right_now", type: "calculation", typeLabel: "Calculation — escalated",
    clientName: "Anthony Russo", householdId: "h-fuentes",
    title: "Capital gains: 7 of 23 lots missing cost basis", whyNow: "Filing without basis would overstate the gain and the tax. Petal stopped and escalated rather than guess.",
    trust: "asks", confidence: 0.58, estimatedMin: 6, when: "Yesterday", runId: "r4", agent: "1040 Drafter",
    sources: ["1099-B Schwab.pdf"],
    deepLink: "/os/returns",
    nextStep: "Once basis is provided → Drafter finishes Schedule D and reruns the wash-sale check.",
  },
  {
    id: "tr-esign", tier: "right_now", type: "esign_stalled", typeLabel: "E-sign stalled",
    clientName: "Roberto Fuentes", householdId: "h-fuentes",
    title: "8879 viewed but not signed — 2 days", whyNow: "Roberto opened the e-sign envelope but hasn't signed. The return can't transmit until he does.",
    trust: "drafts", estimatedMin: 1, when: "2d ago", agent: "Doc Chase",
    sources: ["DocuSign · envelope #4471"],
    recommendedReply: "Hi Roberto — just a nudge that your 8879 is ready for signature. Once you sign, we can e-file right away. Let me know if you'd like me to walk you through it.",
    deepLink: "/os/clients/h-fuentes",
    nextStep: "Once signed → the 1120S transmits to the IRS automatically.",
  },
  {
    id: "tr-extension", tier: "right_now", type: "extension_needed", typeLabel: "Extension",
    clientName: "Carlos & Elena Mendez", householdId: "h-mendez",
    title: "Form 4868 extension drafted — K-1 won't arrive in time", whyNow: "The Mendez Auto K-1 won't be issued before Apr 15, so their 1040 can't be finalized. Petal drafted an extension to avoid a late-file penalty.",
    trust: "asks", confidence: 0.92, estimatedMin: 2, when: "Due Apr 15", agent: "1040 Drafter",
    sources: ["Mendez Auto · 1065 draft", "2024 Return.pdf"],
    recommendation: "File Form 4868 to extend to Oct 15. Pay the estimated $1,400 balance now to stop interest from accruing; the rest trues up when the partnership K-1 lands.",
    evidence: [
      { label: "Blocking item", detail: "Mendez Auto K-1 (pending)" },
      { label: "Estimated balance due", detail: "$1,400" },
      { label: "New deadline", detail: "Oct 15, 2026" },
    ],
    deepLink: "/os/returns",
    nextStep: "Once the K-1 arrives → 1040 Drafter finalizes and clears the extension hold.",
  },
  {
    id: "tr-notice", tier: "right_now", type: "notice_received", typeLabel: "IRS notice",
    clientName: "Rodriguez Family", householdId: "h-rodriguez",
    title: "IRS CP2000 received — response drafted", whyNow: "The IRS proposed $1,210 more tax from a 1099-INT it says wasn't reported. Petal matched it to the return and drafted a response disputing the notice.",
    trust: "asks", confidence: 0.81, estimatedMin: 8, when: "Yesterday", agent: "1040 Drafter",
    sources: ["IRS CP2000.pdf", "2024 Return.pdf", "1099-INT Chase.pdf"],
    recommendation: "The interest was reported on Schedule B — the IRS matched it to the wrong tax year. The drafted response includes the corrected year and a copy of Schedule B. Review the wording before it mails.",
    evidence: [
      { label: "Notice type", detail: "CP2000 · tax year 2024" },
      { label: "Proposed change", detail: "+$1,210 tax" },
      { label: "Our position", detail: "Already reported — IRS matched wrong year" },
    ],
    deepLink: "/os/clients/h-rodriguez",
    nextStep: "Once approved → response is queued to mail and a reminder is set for the IRS 30-day deadline.",
  },

  // ── Today (drafts to review) ───────────────────────────────
  {
    id: "tr-marcus", tier: "today", type: "return_review", typeLabel: "Return drafted",
    clientName: "Marcus Chen", householdId: "h-chen",
    title: "2025 Form 1040 + Schedule C drafted — 1 item flagged", whyNow: "Wages dropped 40% YoY (Riverside location closed). Petal flagged it for verbal confirmation rather than filing.",
    trust: "drafts", confidence: 0.82, estimatedMin: 4, when: "2h ago", runId: "r1", agent: "1040 Drafter",
    sources: ["W-2 2025.pdf", "Apr 8 meeting notes", "2024 Return.pdf"],
    deepLink: "/os/returns",
    nextStep: "Once confirmed → the return moves to client review and out for signature.",
  },
  {
    id: "tr-park", tier: "today", type: "books_discrepancy", typeLabel: "Books reconciled",
    clientName: "David Park", householdId: "h-park",
    title: "Q4 books reconciled — 3 uncategorized expenses", whyNow: "142 of 145 transactions auto-matched. 3 items above the $250 threshold need a category before the books close.",
    trust: "drafts", confidence: 0.91, estimatedMin: 3, when: "4h ago", runId: "r2", agent: "Reconciler",
    sources: ["Chase_Q4.csv", "Gusto_payroll.pdf"],
    deepLink: "/os/clients/h-park",
    nextStep: "Once categorized → Reconciler posts the closing entries and the period closes.",
  },
  {
    id: "tr-priya", tier: "today", type: "document_gap", typeLabel: "Reminder drafted",
    clientName: "Priya Sharma", householdId: "h-priya",
    title: "4 documents outstanding — reminder drafted", whyNow: "Priya is missing 2 1099-NECs, her mileage log, and home-office square footage. Petal drafted a warm reminder.",
    trust: "drafts", confidence: 0.95, estimatedMin: 1, when: "Yesterday", runId: "r3", agent: "Doc Chase",
    sources: ["Document checklist · Priya Sharma"],
    recommendedReply: "Hi Priya! Quick check-in before we can start your return — we're still missing a few things: your two 1099-NECs (TikTok + the brand deal), your mileage log, and the square footage of your home office. You can upload them straight to the portal or just text me photos. Let me know if anything's unclear!",
    deepLink: "/os/clients/h-priya",
    nextStep: "Once all 4 arrive → 1040 Drafter builds her Schedule C.",
  },
  {
    id: "tr-anomaly", tier: "today", type: "anomaly", typeLabel: "Anomaly flagged",
    clientName: "David Park", householdId: "h-park",
    title: "Mortgage interest up 3x YoY — verify before filing", whyNow: "Form 1098 shows mortgage interest more than tripled versus 2024. Likely a refinance, but Petal flagged it rather than assume.",
    trust: "asks", confidence: 0.7, estimatedMin: 3, when: "3h ago", agent: "1040 Drafter",
    sources: ["1098 2025.pdf", "2024 Return.pdf"],
    recommendation: "Confirm whether David refinanced in 2025. If so, the deduction may be limited by the $750k acquisition-debt cap — check the loan balance before claiming the full amount.",
    evidence: [
      { label: "2024 mortgage interest", detail: "$9,800" },
      { label: "2025 mortgage interest", detail: "$31,400" },
      { label: "Likely cause", detail: "Refinance (unverified)" },
    ],
    deepLink: "/os/clients/h-park",
    nextStep: "Once confirmed → Drafter applies the correct cap and updates Schedule A.",
  },
  {
    id: "tr-amend", tier: "today", type: "amendment_needed", typeLabel: "Amendment",
    clientName: "Linda Nakamura", householdId: "h-linda",
    title: "Late 1099-DIV arrived after filing — 1040-X drafted", whyNow: "A corrected 1099-DIV ($420 in dividends) arrived after Linda's return was accepted. Petal drafted a Form 1040-X amendment.",
    trust: "asks", confidence: 0.84, estimatedMin: 5, when: "Yesterday", agent: "1040 Drafter",
    sources: ["1099-DIV corrected.pdf", "Linda 2025 Return.pdf"],
    recommendation: "The added dividends raise tax by $63. Filing the 1040-X now is cleaner than waiting for an IRS notice. Review the explanation statement before transmitting.",
    evidence: [
      { label: "Added income", detail: "$420 dividends (1099-DIV)" },
      { label: "Additional tax", detail: "$63" },
      { label: "Original return", detail: "Filed & accepted" },
    ],
    deepLink: "/os/returns",
    nextStep: "Once approved → the 1040-X transmits and Linda gets a plain-language summary.",
  },
  {
    id: "tr-w9", tier: "today", type: "w9_missing", typeLabel: "W-9 collection",
    clientName: "David Park", householdId: "h-park",
    title: "3 contractors paid $600+ without a W-9 on file", whyNow: "1099-NEC filing season is coming and 3 of Park Dental's contractors have no W-9. Petal drafted requests to collect them.",
    trust: "drafts", confidence: 0.93, estimatedMin: 2, when: "6h ago", agent: "Doc Chase",
    sources: ["Vendor ledger · Park Family Dental", "Gusto contractors"],
    recommendedReply: "Hi — quick housekeeping note before 1099 season: we need a signed W-9 on file for you so we can issue your 1099-NEC correctly. It takes about a minute — here's the secure link. Thanks so much!",
    evidence: [
      { label: "Contractors missing W-9", detail: "3" },
      { label: "Total paid in 2025", detail: "$11,400" },
    ],
    deepLink: "/os/clients/h-park",
    nextStep: "Once W-9s are returned → Petal queues the 1099-NEC drafts for January.",
  },
  {
    id: "tr-linda", tier: "today", type: "discovery", typeLabel: "Missed deduction",
    clientName: "Linda Nakamura", householdId: "h-linda",
    title: "Possible home-office deduction on her Etsy Schedule C", whyNow: "Petal noticed Linda runs her Etsy shop from home but isn't claiming the home-office deduction. Worth a quick ask.",
    trust: "drafts", confidence: 0.74, estimatedMin: 2, when: "1d ago", agent: "1040 Drafter",
    sources: ["Sch C · Linda's Etsy Shop", "IRS Pub 587"],
    recommendation: "Confirm the square footage of Linda's dedicated workspace and whether it's used regularly and exclusively for the business. If so, the simplified method (~$5/sq ft, up to 300 sq ft) is the cleanest.",
    deepLink: "/os/clients/h-linda",
    nextStep: "Once she confirms the square footage → it folds into the amendment above.",
  },

  // ── Waiting (running + scheduled) ──────────────────────────
  {
    id: "tr-prep", tier: "waiting", type: "meeting_prep", typeLabel: "Meeting prep",
    clientName: "Roberto Fuentes", householdId: "h-fuentes",
    title: "Pre-call brief generating for the 9:00am 1120S review", whyNow: "Petal is assembling the brief from client memory + the 1120S draft. It'll land ~15 min before the call.",
    trust: "auto", estimatedMin: 0, when: "Running", runId: "r5", agent: "Meeting Prep",
    sources: ["Client memory · Roberto Fuentes", "1120S draft 2025"],
  },
  {
    id: "tr-notes-running", tier: "waiting", type: "meeting_notes", typeLabel: "Meeting notes",
    clientName: "David Park", householdId: "h-park",
    title: "Transcribing the Park books review call", whyNow: "Petal is sitting in on David's 11:00 books review, transcribing live and pulling out decisions. Notes write to Client Memory when the call ends.",
    trust: "auto", estimatedMin: 0, when: "Running", agent: "Notetaker",
    sources: ["Zoom · live", "Client Memory · Park Family Dental"],
    evidence: [
      { label: "Call", detail: "Park books review · 11:00am" },
      { label: "Captured so far", detail: "2 decisions · 1 follow-up" },
    ],
  },
  {
    id: "tr-mendez-running", tier: "waiting", type: "return_review", typeLabel: "Return drafting",
    clientName: "Mendez Auto", householdId: "h-mendez",
    title: "Drafting the Mendez Auto 1065 partnership return", whyNow: "Petal is assembling the partnership return from the books and prior year. Depreciation is done; it's allocating the partner K-1s now.",
    trust: "drafts", estimatedMin: 0, when: "Running", agent: "1040 Drafter",
    sources: ["Mendez Auto books 2025", "2024 Return.pdf"],
    evidence: [
      { label: "Entity", detail: "Mendez Auto Repair · 1065" },
      { label: "Progress", detail: "Depreciation done · K-1 allocation running" },
    ],
    nextStep: "Once drafted → the two partner K-1s flow to Carlos & Elena's 1040.",
  },
  {
    id: "tr-sandoval", tier: "waiting", type: "payment", typeLabel: "Estimated payments",
    clientName: "Sandoval Plumbing", householdId: "h-sandoval",
    title: "2026 Q1 estimated vouchers — runs after filing", whyNow: "Scheduled to compute safe-harbor vouchers automatically once the 2025 return is filed and accepted.",
    trust: "auto", estimatedMin: 0, when: "Scheduled", runId: "r6", agent: "Estimated Payments",
    sources: ["Firm Constitution · safe-harbor rule"],
    nextStep: "After filing → vouchers and a payment reminder land in your queue.",
  },
  {
    id: "tr-park-est", tier: "waiting", type: "payment", typeLabel: "Estimated payments",
    clientName: "Park Family Dental", householdId: "h-park",
    title: "2026 Q1 estimates — runs after the S-Corp files", whyNow: "Queued to compute the practice's 2026 estimated payments from the filed 1120S using the safe-harbor method.",
    trust: "auto", estimatedMin: 0, when: "Scheduled", agent: "Estimated Payments",
    sources: ["Firm Constitution · safe-harbor rule", "Park Dental 1120S draft"],
    nextStep: "After the 1120S is accepted → vouchers compute and draft for review.",
  },
  {
    id: "tr-fuentes-efile", tier: "waiting", type: "e_file_status", typeLabel: "E-file queued",
    clientName: "Fuentes Transport", householdId: "h-fuentes",
    title: "1120S queued to transmit on signature", whyNow: "The Fuentes Transport 1120S is reviewed and queued. Petal transmits it the moment Roberto's 8879 signature lands.",
    trust: "auto", estimatedMin: 0, when: "Scheduled", agent: "1040 Drafter",
    sources: ["Fuentes 1120S 2025", "DocuSign · envelope #4471"],
    evidence: [
      { label: "Blocking", detail: "8879 signature (pending)" },
      { label: "On signature", detail: "Auto-transmit to IRS" },
    ],
    nextStep: "After IRS accepts → Estimated Payments computes the 2026 vouchers.",
  },
  {
    id: "tr-k1", tier: "waiting", type: "k1_inflow", typeLabel: "Waiting on K-1",
    clientName: "Mendez Auto", householdId: "h-mendez",
    title: "Waiting on K-1 from the partnership", whyNow: "Carlos & Elena's 1040 can't be finalized until the Mendez Auto 1065 K-1s are issued. Petal is watching for them.",
    trust: "drafts", estimatedMin: 0, when: "3d ago", agent: "1040 Drafter",
    sources: ["Mendez Auto · 1065 draft"],
    nextStep: "Once the 1065 is filed → the K-1s auto-attach to the 1040 draft.",
  },

  // ── Reviewed & done (autonomous receipts) ──────────────────
  {
    id: "tr-rodriguez", tier: "needs_review", type: "e_file_status", typeLabel: "E-file accepted",
    clientName: "Rodriguez Family", householdId: "h-rodriguez",
    title: "2025 MFJ return e-filed — IRS accepted", whyNow: "You approved the draft; Petal transmitted it and the IRS accepted. Refund of $2,840 expected.",
    trust: "auto", estimatedMin: 0, when: "2d ago", runId: "r7", agent: "1040 Drafter",
    sources: ["IRS e-file ack", "8879 signed"],
  },
  {
    id: "tr-karen", tier: "needs_review", type: "e_file_status", typeLabel: "E-file accepted",
    clientName: "Karen O'Brien", householdId: "h-karen",
    title: "2025 1040 e-filed — IRS accepted", whyNow: "Simple W-2 return. You approved; Petal transmitted and the IRS accepted within the hour. Refund of $610 expected.",
    trust: "auto", estimatedMin: 0, when: "3d ago", agent: "1040 Drafter",
    sources: ["IRS e-file ack", "W-2 2025.pdf"],
  },
  {
    id: "tr-linda-filed", tier: "needs_review", type: "e_file_status", typeLabel: "E-file accepted",
    clientName: "Linda Nakamura", householdId: "h-linda",
    title: "1040 + Etsy Schedule C e-filed — IRS accepted", whyNow: "Both Linda's personal return and her Etsy Schedule C transmitted together after your approval. Accepted with a $1,180 refund.",
    trust: "auto", estimatedMin: 0, when: "5d ago", agent: "1040 Drafter",
    sources: ["IRS e-file ack", "Sch C · Linda's Etsy Shop"],
  },
  {
    id: "tr-notes-done", tier: "needs_review", type: "meeting_notes", typeLabel: "Meeting notes",
    clientName: "Marcus Chen", householdId: "h-chen",
    title: "Apr 8 call captured — 2 follow-ups created", whyNow: "Petal transcribed Marcus's call, wrote a summary to Client Memory, and created 2 follow-up tasks (verify the wage drop, request closing docs).",
    trust: "auto", estimatedMin: 0, when: "Yesterday", agent: "Notetaker",
    sources: ["Meeting transcript · Apr 8", "Client Memory · Chen Household"],
    evidence: [
      { label: "Decision", detail: "Confirmed 2nd location closed Q2" },
      { label: "Follow-ups", detail: "2 tasks created" },
    ],
  },
  {
    id: "tr-brief-done", tier: "needs_review", type: "meeting_prep", typeLabel: "Brief delivered",
    clientName: "Sandoval Plumbing", householdId: "h-sandoval",
    title: "Pre-call brief delivered for the Sandoval call", whyNow: "Petal delivered the one-page brief 15 minutes before Miguel's call: open items, last commitments, and the incorporation question he raised.",
    trust: "auto", estimatedMin: 0, when: "Yesterday", agent: "Meeting Prep",
    sources: ["Client memory · Sandoval Plumbing"],
    evidence: [
      { label: "Delivered", detail: "8:45am · 15 min before call" },
      { label: "Included", detail: "S-Corp incorporation analysis" },
    ],
  },
];
