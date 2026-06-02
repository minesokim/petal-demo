/**
 * Triage mock data.
 *
 * Each issue follows the same narrative structure: Why this surfaced →
 * Client signal → Evidence → Context → Recommendation → Sources.
 * That structure is what makes the triage page feel like Antonio is
 * reviewing Petal's homework, not browsing a task list.
 *
 * Tiers (urgency buckets) are hardcoded per issue - in production we'd
 * derive these from deadline proximity + business impact.
 */

export type TriageTier = "right_now" | "today" | "waiting" | "needs_review";

/** Autonomy tier - which "Petal autonomy" level applies to this issue's primary action. */
export type TrustTier = "auto" | "drafts" | "asks" | "manual";

export type TriageIssueType =
  | "document_gap"
  | "signature"
  | "extension_risk"
  | "meeting_prep"
  | "payment"
  | "prep_decision"
  | "intake_gap"
  | "calculation"
  | "return_review"
  // ── New types - surface the full Petal capability range ─────────────
  | "compliance_alert"     // §6695(g) due-diligence, 8867 gaps, missing forms
  | "anomaly"              // YoY revenue/expense swings, hobby-loss flags
  | "discovery"            // missed deductions/credits surfaced by the discovery agent
  | "irs_notice"           // CP2000 / CP504 / LT11 classified + response drafted
  | "position_refusal"     // Petal refused to take a position (insufficient authority)
  | "disclosure_required"  // Form 8275 / §6662 disclosure recommended
  | "nudge_escalation"     // silent client · nudge-agent escalated to call
  // ── Cross-system surfaces ──────────────────────────────────────────
  | "flag"                 // Manual or AI-added bookmark from a client page
  | "message"              // Inbound client message that wants a response
  // ── Connected-system surfaces ──────────────────────────────────────
  | "prep_ready"           // Return is ready to prep — opens Drake/Lacerte/etc.
  | "books_discrepancy"   // Xero/QBO mismatch with intake or bank
  | "txn_uncategorized"   // Uncategorized transactions in books/bank/cards
  | "payroll_verify"      // Gusto/ADP W-2 or 1099 verification
  | "esign_stalled"       // DocuSign envelope viewed but not signed
  | "boi_filing"          // FinCEN beneficial-ownership report due
  | "calendar_event"      // Upcoming meeting from Google/Outlook calendar
  | "tax_planning"        // Holistiplan/Corvee opportunity surfaced
  | "research_update"     // Checkpoint/BNA new guidance affecting a client
  | "transcript_finding"  // IRS e-Services transcript pulled something new
  | "state_notice"        // State DOR (CA FTB, NY DTF) correspondence
  | "team_handoff"        // Internal: teammate finished work, needs review
  | "industry_signal"     // Shopify/Toast/Mindbody data signal
  // ── Pass B + C surfaces ────────────────────────────────────────────
  | "regulatory_deadline" // PTIN/EFIN/WISP/ERO renewals, 1099 batch deadlines
  | "prep_blocker"        // Chained dependency ("can't prep X until Y resolves")
  | "business_ops"        // Practice ops: deposits, payouts, AP/AR, billing
  | "proactive_opportunity" // Revenue jumps, lifecycle events, tax planning windows
  // ── Gap-closing pass (end-to-end CPA workflow) ─────────────────────
  | "e_file_status"       // Transmission lifecycle: pending acceptance, rejected, accepted
  | "engagement_letter"   // Annual renewal cycle for client engagement letters
  | "cpe_tracking"        // Preparer continuing education hours/deadline
  | "k1_inflow"           // Waiting on K-1 from upstream entity/preparer
  | "multi_state"         // Additional state return triggered (move, work, second home)
  | "amended_return"      // Form 1040-X workflow
  | "audit_representation"; // Client under IRS audit — distinct engagement

export interface TriageSignal {
  /** "Docket portal", "email", "SMS", "phone" */
  via: string;
  /** Human-readable timestamp - "Today · 9:41 AM" */
  timestamp: string;
  /** The actual client message that surfaced this issue */
  quote: string;
}

export interface TriageEvidence {
  type: "file" | "calculation" | "transaction";
  label: string;
  detail: string;
}

export interface TriageIssue {
  id: string;
  tier: TriageTier;
  type: TriageIssueType;
  typeLabel: string;

  // Client
  clientId: string;
  clientName: string;
  clientAvatar?: string;

  // Narrative
  title: string;
  /** One-line urgency framing - "Needs response within 24 hours…" */
  needsResponseBy?: string;
  whyNow: string;

  // Optional supporting evidence
  signal?: TriageSignal;
  evidence?: TriageEvidence[];

  // Context
  context: string[];
  confidence: "High" | "Medium" | "Low";

  // Recommendation
  recommendation: string;
  /** Petal-drafted reply, shown when the recommended action is a message */
  recommendedReply?: string;

  // Sources cited as small text pills
  sources: string[];

  // Time
  estimatedMin: number;

  /** Autonomy tier - Petal can handle (auto), Petal drafts but you approve (drafts),
      Petal flags but can't decide (asks), or Petal doesn't touch (manual).
      Optional - `defaultTrustTierFor(issue)` derives a sensible default by issue type. */
  trustTier?: TrustTier;

  /** Chronological timeline of what's happened on this issue, what's current,
   *  and what's pending. Falls back to `deriveTimeline()` if omitted. */
  timeline?: TimelineEvent[];

  /** Optional source integration this issue came from. Drives the source
   *  chip on the queue + detail header, and the "Group by: Source" option.
   *  When omitted, the issue is treated as native Petal AI output. */
  sourceIntegrationId?: string;

  /** Optional deep-link CTA to open the relevant external tool. Used by
   *  prep-ready items ("Open in Drake/Lacerte/ProConnect"), uncategorized
   *  txn items ("Open in QuickBooks"), etc. The label drives the button text. */
  deepLink?: {
    label: string;
    href: string;
    integrationId: string;
  };
}

/**
 * Per-issue-type contribution to audit risk. Exposed so the UI can show
 * "↑6 from this issue" next to the total - explains *why* the risk
 * landed where it did instead of presenting an unsourced number.
 */
export const AUDIT_RISK_TYPE_BUMP: Record<TriageIssueType, number> = {
  document_gap:        6,
  signature:           0,
  extension_risk:     14,
  meeting_prep:        0,
  payment:             0,
  prep_decision:      10,
  intake_gap:          4,
  calculation:        16,
  return_review:       2,
  compliance_alert:   12,
  anomaly:             8,
  discovery:           0,
  irs_notice:         20,
  position_refusal:    0,
  disclosure_required: 4,
  nudge_escalation:    0,
  // Flags and messages don't carry inherent audit risk — risk is whatever
  // the underlying issue is. Triage just surfaces them as work units.
  flag:                0,
  message:             0,
  // Connected-system items — risk only when the underlying data is wrong.
  prep_ready:          0,
  books_discrepancy:   8,
  txn_uncategorized:   4,
  payroll_verify:      0,
  esign_stalled:       0,
  boi_filing:         18,
  calendar_event:      0,
  tax_planning:        0,
  research_update:    10,
  transcript_finding: 12,
  state_notice:       16,
  team_handoff:        0,
  industry_signal:     4,
  // Practice-ops / planning items — modest risk unless they're regulatory
  regulatory_deadline: 14,
  prep_blocker:        12,
  business_ops:        0,
  proactive_opportunity: 0,
  // Gap-closing pass
  e_file_status:       18, // Rejected returns carry real risk (deadline pressure)
  engagement_letter:    6, // No engagement letter = compliance exposure
  cpe_tracking:         0, // Preparer-side, not audit risk
  k1_inflow:            8, // Delays can push to extension territory
  multi_state:         10, // Missed state nexus = penalties
  amended_return:      14, // Amendments need careful execution
  audit_representation: 20, // Client under audit = high risk on every move
};

/** Plain-language reason each issue type contributes audit-risk points.
 *  This is the "why" behind the bump — surfaced in the risk breakdown so the
 *  score shows its work instead of being a naked number. Empty string for
 *  types that carry no inherent risk (they never show the badge anyway). */
export const AUDIT_RISK_TYPE_REASON: Record<TriageIssueType, string> = {
  document_gap:        "Missing source documents",
  signature:           "",
  extension_risk:      "Extension / deadline pressure",
  meeting_prep:        "",
  payment:             "",
  prep_decision:       "Open preparation judgment call",
  intake_gap:          "Incomplete intake data",
  calculation:         "Calculation or position complexity",
  return_review:       "Routine return review",
  compliance_alert:    "Compliance flag raised",
  anomaly:             "Data anomaly detected",
  discovery:           "",
  irs_notice:          "Active IRS correspondence",
  position_refusal:    "",
  disclosure_required: "Disclosure may be required",
  nudge_escalation:    "",
  flag:                "",
  message:             "",
  prep_ready:          "",
  books_discrepancy:   "Bookkeeping discrepancy",
  txn_uncategorized:   "Uncategorized transactions",
  payroll_verify:      "",
  esign_stalled:       "",
  boi_filing:          "Overdue BOI regulatory filing",
  calendar_event:      "",
  tax_planning:        "",
  research_update:     "Unsettled tax-law position",
  transcript_finding:  "IRS transcript discrepancy",
  state_notice:        "State tax authority notice",
  team_handoff:        "",
  industry_signal:     "Industry risk signal",
  regulatory_deadline: "Regulatory deadline",
  prep_blocker:        "Blocking upstream issue",
  business_ops:        "",
  proactive_opportunity: "",
  e_file_status:       "E-file rejected by IRS",
  engagement_letter:   "Missing engagement letter",
  cpe_tracking:        "",
  k1_inflow:           "Pending K-1 inflow",
  multi_state:         "Multi-state nexus exposure",
  amended_return:      "Amended return execution",
  audit_representation: "Client under active audit",
};

/** A single named contributor to the audit-risk score. Points sum exactly to
 *  the displayed % so the breakdown is honest, not decorative. */
export type AuditRiskFactor = { label: string; points: number; recent: boolean };

/** Qualitative band for the risk %. Bands de-escalate: "Elevated" is calmer
 *  and more actionable than a bare precise number. */
export function auditRiskBand(risk: number): "Low" | "Moderate" | "Elevated" {
  return risk >= 25 ? "Elevated" : risk >= 12 ? "Moderate" : "Low";
}

const CONFIDENCE_FACTOR_LABEL: Record<TriageIssue["confidence"], string> = {
  High: "Baseline filing exposure",
  Medium: "Medium data confidence",
  Low: "Low data confidence",
};

/** Decompose the audit-risk score into the named drivers behind it. The
 *  type-driven factor is flagged `recent: true` — it's the event that raised
 *  the score (answers "why did it go up"); the confidence factor is the
 *  standing baseline. Sorted by contribution, largest first. */
export function deriveAuditRiskFactors(issue: TriageIssue): AuditRiskFactor[] {
  const factors: AuditRiskFactor[] = [];
  const bump = AUDIT_RISK_TYPE_BUMP[issue.type] ?? 0;
  if (bump > 0) {
    factors.push({
      label: AUDIT_RISK_TYPE_REASON[issue.type] || "Issue-specific exposure",
      points: bump,
      recent: true,
    });
  }
  const base = issue.confidence === "Low" ? 32 : issue.confidence === "Medium" ? 18 : 8;
  factors.push({ label: CONFIDENCE_FACTOR_LABEL[issue.confidence], points: base, recent: false });
  return factors.sort((a, b) => b.points - a.points);
}

/** How much this specific issue contributes to the total audit risk
 *  score. Used as the "delta" indicator next to the % on the right rail. */
export function deriveAuditRiskDelta(issue: TriageIssue): number {
  return AUDIT_RISK_TYPE_BUMP[issue.type] ?? 0;
}

/**
 * Derive an audit risk percentage for the underlying return/position.
 * Heuristic: severity + issue type drive a 0-100 score that reads like
 * a Blue-J style outcome prediction.
 */
export function deriveAuditRisk(issue: TriageIssue): number {
  const base = issue.confidence === "Low" ? 32 : issue.confidence === "Medium" ? 18 : 8;
  return Math.min(95, base + (AUDIT_RISK_TYPE_BUMP[issue.type] ?? 0));
}

/** Whether the audit-risk % is a *meaningful* signal for this issue. Only
 *  issue types that carry inherent return/compliance risk (bump > 0) qualify.
 *  The badge is hidden on messages, signatures, payments, scheduling, and
 *  practice-ops items, where an "audit risk" number is noise, not information. */
export function hasAuditRisk(issue: TriageIssue): boolean {
  return (AUDIT_RISK_TYPE_BUMP[issue.type] ?? 0) > 0;
}

/**
 * Derive the autonomy tier from issue type when not explicitly set.
 * - Reply-shaped items (Petal drafted a message) → drafts
 * - Decision-shaped items (S-Corp election, position choice) → asks
 * - Sign-shaped items (Antonio must sign) → asks
 * - Verify/calculation items → asks
 * - Anything else falls back to drafts as a safe default.
 */
export function defaultTrustTierFor(issue: TriageIssue): TrustTier {
  if (issue.trustTier) return issue.trustTier;
  switch (issue.type) {
    case "prep_decision":
    case "calculation":
    case "return_review":
    case "anomaly":
    case "discovery":
    case "position_refusal":
    case "disclosure_required":
      return "asks";
    case "signature":
      return "asks";
    case "compliance_alert":
      return "manual"; // preparer-only - §6695(g) signatures, etc.
    case "meeting_prep":
      return "auto"; // brief generation is autonomous
    case "flag":
      return "asks"; // The human bookmarked this — Petal can't auto-resolve.
    case "message":
      return "drafts"; // Petal drafts a reply; you approve before sending.
    case "prep_ready":
    case "books_discrepancy":
    case "boi_filing":
    case "state_notice":
    case "transcript_finding":
    case "team_handoff":
      return "asks"; // High-stakes — human decides
    case "txn_uncategorized":
    case "industry_signal":
      return "drafts"; // Petal categorizes, you approve in bulk
    case "payroll_verify":
      return "auto"; // 12 of 12 W-2s match — just a receipt
    case "esign_stalled":
    case "research_update":
    case "tax_planning":
      return "drafts"; // Petal drafts the nudge/response/proposal
    case "calendar_event":
      return "auto"; // Briefings generated automatically
    case "regulatory_deadline":
      return "asks"; // Compliance — human signs off
    case "prep_blocker":
      return "asks"; // Unblock decision is the user's
    case "business_ops":
      return "drafts"; // Petal pre-stages the action (send reminders, etc.)
    case "proactive_opportunity":
      return "drafts"; // Petal pre-drafts the outreach
    // Gap-closing pass
    case "e_file_status":
      // Pending acceptance = auto receipt; rejected = asks (human decides fix)
      return "auto";
    case "engagement_letter":
      return "drafts"; // Petal drafts; you e-sign
    case "cpe_tracking":
      return "asks"; // You decide which courses to take
    case "k1_inflow":
      return "drafts"; // Petal can chase the upstream preparer
    case "multi_state":
      return "asks"; // You confirm whether nexus applies
    case "amended_return":
      return "asks"; // Decision-heavy
    case "audit_representation":
      return "manual"; // Preparer-only — never delegate
    default:
      return "drafts"; // reply/nudge/document-gap items
  }
}

export interface ResolvedItem {
  id: string;
  clientName: string;
  title: string;
  typeLabel: string;
  resolvedAt: string;
}

export const TRIAGE_TIERS: {
  key: TriageTier;
  label: string;
  dot: string;
}[] = [
  // Labels reframed around what's needed to unblock each issue, not raw
  // urgency tier - matches the new "Group: Status" mental model in the UI.
  { key: "right_now",    label: "Blocks filing", dot: "bg-red-500" },
  { key: "waiting",      label: "Needs client",  dot: "bg-blue-500" },
  { key: "today",        label: "Later today",   dot: "bg-amber-500" },
  { key: "needs_review", label: "Needs review",  dot: "bg-foreground/55" },
];

/** A single event on an issue's timeline - what's happened so far, what's
 *  current, and what's pending. Used in the right-rail context panel. */
export interface TimelineEvent {
  date: string;       // "Mar 26"
  event: string;      // "Return prepared"
  status: "done" | "current" | "pending";
}

/** Derive a minimal 4-step timeline when an issue doesn't supply its own.
 *  Generic enough to read naturally across issue types. */
export function deriveTimeline(issue: TriageIssue): TimelineEvent[] {
  if (issue.timeline && issue.timeline.length > 0) return issue.timeline;
  return [
    { date: "Earlier", event: "Petal detected the issue",          status: "done" },
    { date: "Earlier", event: "Petal drafted the recommendation",  status: "done" },
    { date: "Now",     event: "Awaiting your review",              status: "current" },
    { date: "Next",    event: "Petal executes after your approval", status: "pending" },
  ];
}

// ─── Active issues (14) ─────────────────────────────────────────────────

export const TRIAGE_ISSUES: TriageIssue[] = [
  {
    id: "i1",
    tier: "right_now",
    type: "document_gap",
    typeLabel: "Document gap",
    clientId: "c2",
    clientName: "Priya Sharma",
    clientAvatar: "/images/avatars/02.png",
    title: "Priya's 1099-NEC doesn't match her intake",
    needsResponseBy: "Needs response within 24 hours to keep the return on track.",
    whyNow:
      "Priya reported $4,320 in TikTok income on a 1099-NEC, but her intake shows $2,300. This mismatch affects self-employment income and tax liability.",
    signal: {
      via: "Petal portal",
      timestamp: "Today · 9:41 AM",
      quote:
        "Hi Antonio, I uploaded my 1099 from TikTok. Please let me know if you need anything else.",
    },
    evidence: [
      { type: "file", label: "TikTok_1099-NEC_2024.pdf", detail: "Uploaded today · 9:40 AM" },
    ],
    context: [
      "Intake report shows $2,300 in TikTok income",
      "1099-NEC shows $4,320",
      "Prior year TikTok income: $1,870",
      "Schedule C income will change by ~$2,020",
      "No other 1099s reported for social media income",
    ],
    confidence: "High",
    recommendation:
      "Confirm the correct amount with Priya and update her intake. This unblocks return prep and prevents an IRS mismatch notice.",
    recommendedReply:
      "Hi Priya - thanks for uploading the 1099. Quick check: your intake form noted $2,300 in TikTok income, but the 1099-NEC shows $4,320. Can you confirm which is correct? Once we have the right number, I'll update your Schedule C and we'll be set to move forward.\n\nThanks,\nAntonio",
    sources: ["Intake response (Jan 18)", "1099-NEC (Jan 18)", "Prior return (2023)"],
    estimatedMin: 5,
    timeline: [
      { date: "Jan 18", event: "Priya submitted intake ($2,300 TikTok income)",   status: "done" },
      { date: "9:40 AM", event: "Priya uploaded 1099-NEC ($4,320)",               status: "done" },
      { date: "9:41 AM", event: "Petal flagged the mismatch + drafted reply",     status: "done" },
      { date: "Now",     event: "Awaiting your approval to send the clarifying note", status: "current" },
      { date: "Next",    event: "Once confirmed, Petal updates Schedule C",       status: "pending" },
    ],
  },
  {
    id: "i2",
    tier: "right_now",
    type: "signature",
    typeLabel: "Signature",
    clientId: "c3",
    clientName: "James & Sofia Rodriguez",
    clientAvatar: "/images/avatars/03.png",
    title: "Your ERO countersignature is blocking the Rodriguez return from filing",
    needsResponseBy: "Return is fully prepared and paid - your signature is the only thing left.",
    whyNow:
      "Form 8879 was generated 2 days ago and both spouses e-signed yesterday. Your countersignature is the last step before transmission to the IRS.",
    context: [
      "Joint return - James and Sofia both signed on Mar 27",
      "Refund of $2,142 will route to direct deposit",
      "All due-diligence checks passed (Form 8867)",
      "Engagement letter on file · payment in full",
    ],
    confidence: "High",
    recommendation:
      "Sign Form 8879 in the workspace. Petal will transmit to the IRS immediately after your countersignature.",
    sources: ["Form 8879 (Mar 28)", "Form 8867 (Mar 28)", "Engagement letter"],
    estimatedMin: 3,
    timeline: [
      { date: "Mar 26", event: "Return prepared",                       status: "done" },
      { date: "Mar 27", event: "Both spouses e-signed",                 status: "done" },
      { date: "Mar 28", event: "Awaiting your ERO countersignature",    status: "current" },
      { date: "Mar 28", event: "Petal transmits immediately after sign", status: "pending" },
    ],
  },
  {
    id: "i3",
    tier: "right_now",
    type: "extension_risk",
    typeLabel: "Extension risk",
    clientId: "c4",
    clientName: "DeShawn Williams",
    clientAvatar: "/images/avatars/04.png",
    title: "DeShawn hasn't uploaded a W-2 in 14 days - extension is likely needed",
    needsResponseBy: "Filing deadline is 18 days away - past the safe-completion window.",
    whyNow:
      "DeShawn started intake 14 days ago and hasn't logged into the portal since. The W-2 is the only document blocking prep. At current pace this return won't make the deadline without an extension filed by April 15.",
    context: [
      "1 of 6 documents received (intake form only)",
      "No portal logins in the last 14 days",
      "Deposit unpaid (placeholder: $50 hold)",
      "Last contact: SMS reminder 11 days ago, no reply",
    ],
    confidence: "Medium",
    recommendation:
      "Send a friendly nudge with a soft extension warning. If no response in 48 hours, file Form 4868 to lock in the extension and avoid a late-filing penalty.",
    recommendedReply:
      "Hi DeShawn - checking in on your return. I still need a W-2 from your employer to finish things up. We're 18 days from the deadline - if I don't hear back by Wednesday I'll file a 6-month extension on your behalf so we don't risk a late penalty. Reply with the W-2 anytime, or call me at (951) 555-XXXX.\n\n- Antonio",
    sources: ["Portal activity log", "SMS thread", "Intake response (Mar 14)"],
    estimatedMin: 6,
    timeline: [
      { date: "Mar 14", event: "DeShawn submitted intake form",                  status: "done" },
      { date: "Mar 17", event: "Petal sent SMS nudge for missing W-2",           status: "done" },
      { date: "Mar 22", event: "Second SMS nudge · no response",                 status: "done" },
      { date: "Now",    event: "Awaiting your approval on extension safety net", status: "current" },
      { date: "Apr 1",  event: "Petal will file Form 4868 if no W-2 by then",    status: "pending" },
    ],
  },
  {
    id: "i17",
    tier: "today",
    type: "anomaly",
    typeLabel: "Anomaly",
    clientId: "c6",
    clientName: "Roberto Fuentes",
    clientAvatar: "/images/avatars/06.png",
    title: "Roberto's transport revenue jumped 47% YoY - verify before filing",
    needsResponseBy: "Return is in client review - explain or amend before sign-off.",
    whyNow:
      "Triage-classifier compared 2024 vs 2025 1120S revenue. Fuentes Transport reported $612K (2024) → $902K (2025), a 47% jump. Threshold for auto-flag is 25% YoY.",
    evidence: [
      { type: "calculation", label: "2024 gross revenue: $612,000", detail: "From 2024 1120S, Line 1c" },
      { type: "calculation", label: "2025 gross revenue: $902,400", detail: "From 2025 P&L / bank deposits" },
    ],
    context: [
      "Driver count grew from 4 to 7 mid-year (payroll records confirm)",
      "Fuel + maintenance up proportionally · consistent with fleet expansion",
      "No outlier customers - top 10 unchanged",
      "Likely a clean explanation - but document it for the audit trail",
    ],
    confidence: "Medium",
    recommendation:
      "Add a one-line explanation to the workpaper: 'Fleet expanded from 4 to 7 drivers mid-2025.' This satisfies anomaly-flag protocol and shields against future IRS questions.",
    sources: ["2024 1120S", "2025 P&L", "Payroll records", "Triage-classifier rule R-12"],
    estimatedMin: 4,
  },
  {
    id: "i18",
    tier: "right_now",
    type: "irs_notice",
    typeLabel: "IRS notice",
    clientId: "c8",
    clientName: "Thomas & Marie DuBois",
    clientAvatar: "/images/avatars/08.png",
    title: "Thomas & Marie received a CP2000 - Petal classified it and drafted a response",
    needsResponseBy: "IRS deadline is 30 days from notice date (Mar 25) - 27 days remain.",
    whyNow:
      "CP2000 notice arrived Mar 25 proposing $1,840 additional tax on $4,200 unreported 2024 crypto-sale income from Coinbase. Triage-classifier classified the notice; inbox-drafter prepared a response.",
    signal: {
      via: "USPS · scanned by client",
      timestamp: "Mar 25 · uploaded Mar 26 11:42 AM",
      quote:
        "We have information indicating you received income from a 1099-B that was not reported on your tax return.",
    },
    evidence: [
      { type: "file", label: "CP2000_Notice_2024.pdf", detail: "12 pages · uploaded Mar 26" },
      { type: "file", label: "Coinbase_1099-B_2024.pdf", detail: "Pulled from client portal (had been uploaded but not flagged)" },
    ],
    context: [
      "Underlying issue: 2024 return excluded a $4,200 Coinbase 1099-B (basis was $4,180 → $20 net gain)",
      "IRS only sees gross proceeds, not basis - proposed $1,840 tax overstated",
      "Correct response: acknowledge unreported transaction + supply basis documentation",
      "Expected outcome: notice closes with $0 owed (gain was only $20)",
    ],
    confidence: "High",
    timeline: [
      { date: "Mar 25", event: "IRS issued CP2000 ($1,840 proposed tax)",      status: "done" },
      { date: "Mar 26", event: "Client scanned + uploaded the notice",         status: "done" },
      { date: "Mar 26", event: "Petal classified the notice + matched it to 2024 Coinbase 1099-B", status: "done" },
      { date: "Mar 26", event: "Petal drafted the response with basis math",   status: "done" },
      { date: "Now",    event: "Awaiting your review before mailing",          status: "current" },
      { date: "Apr 24", event: "30-day IRS response deadline",                 status: "pending" },
    ],
    recommendation:
      "Review Petal's drafted response (cites Coinbase basis report and asks for closure), sign, mail certified. No amended return needed - basis math resolves it.",
    recommendedReply:
      "Internal Revenue Service\nAUR Department\n[address from notice]\n\nRE: CP2000 dated Mar 25, 2026 · Tax year 2024 · TIN xxx-xx-xxxx\n\nDear Sir or Madam,\n\nThe taxpayer received your CP2000 dated March 25, 2026, proposing additional tax of $1,840 on $4,200 of cryptocurrency proceeds reported by Coinbase on Form 1099-B.\n\nThe 1099-B reports gross proceeds only and does not reflect the taxpayer's adjusted basis. Per the attached Coinbase basis report, the taxpayer's basis in the disposed assets was $4,180, resulting in a net capital gain of $20 - not the $4,200 of income proposed in the notice.\n\nWe respectfully request that this notice be closed with no additional tax due. Supporting documentation is enclosed.\n\nSincerely,\nThomas DuBois (taxpayer)\nAntonio Vazquez, EA · PTIN P0123456",
    sources: ["CP2000 notice (Mar 25)", "Coinbase 1099-B + basis report", "2024 return", "IRM 4.19.3 (AUR procedures)"],
    estimatedMin: 12,
  },
  {
    id: "msg-1",
    tier: "today",
    type: "message",
    typeLabel: "Message",
    clientId: "c2",
    clientName: "Priya Sharma",
    clientAvatar: "/images/avatars/02.png",
    title: "Priya asked: how do I upload my TikTok 1099?",
    needsResponseBy: "Sent 14 hours ago · no reply yet.",
    whyNow:
      "Priya messaged through the portal yesterday afternoon and hasn't received a reply. She's in collecting_docs and this is blocking her from completing intake.",
    signal: {
      via: "Petal portal",
      timestamp: "Yesterday · 2:30 PM",
      quote: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it. Can you help?",
    },
    context: [
      "Priya is in collecting_docs stage (3 of 7 docs in)",
      "She's a first-year client — unfamiliar with the portal",
      "Her 1099-NEC is one of the 4 missing docs blocking prep",
      "Last portal login was 16 hours ago",
    ],
    confidence: "High",
    recommendation:
      "Reply with the 2-step upload instructions + a screenshot. Petal drafted a friendly, beginner-friendly version with the portal screenshot inline.",
    recommendedReply:
      "Hi Priya! Totally doable — here's the quickest way:\n\n1. Open the portal and click \"Upload documents\" (the green button up top)\n2. Drag the 1099 PDF in, or pick it from your files\n\nThat's it — I'll get a notification the moment it lands. If you hit any snag, just text me and we'll sort it out.\n\n— Antonio",
    sources: ["Portal thread (yesterday)", "Doc checklist", "Portal help center"],
    estimatedMin: 3,
    trustTier: "drafts",
  },
  {
    id: "msg-2",
    tier: "right_now",
    type: "message",
    typeLabel: "Message",
    clientId: "c3",
    clientName: "James & Sofia Rodriguez",
    clientAvatar: "/images/avatars/03.png",
    title: "James said: we're ready to sign whenever you are!",
    needsResponseBy: "Their 8879 is sitting in your queue — they're waiting on you.",
    whyNow:
      "James and Sofia signed Form 8879 yesterday and just messaged to confirm they're ready. The return is fully prepared, paid, and only blocked on your ERO countersignature.",
    signal: {
      via: "Petal portal",
      timestamp: "Today · 7:45 AM",
      quote: "We're ready to sign whenever you are!",
    },
    context: [
      "Form 8879 generated 2 days ago",
      "Both spouses e-signed yesterday",
      "Refund of $2,142 routes to direct deposit",
      "Your countersignature is the only remaining step",
      "Strong client relationship — 3rd year with you",
    ],
    confidence: "High",
    recommendation:
      "Sign + transmit now. Takes 90 seconds. Petal already drafted the \"return filed\" follow-up so they know it's gone the moment IRS accepts.",
    recommendedReply:
      "Great news James + Sofia — your return is on its way to the IRS. I'll send a confirmation the moment it's accepted (usually within a few hours). Refund of $2,142 will land in your account in 21 days or less.\n\nThanks for trusting us again this year.\n\n— Antonio",
    sources: ["Form 8879", "Portal thread (today)", "Calendar (acceptance ETA)"],
    estimatedMin: 2,
    trustTier: "drafts",
  },
  {
    id: "prep-1",
    tier: "today",
    type: "prep_ready",
    typeLabel: "Ready to prep",
    clientId: "c9",
    clientName: "Miguel Sandoval",
    clientAvatar: "/images/avatars/09.png",
    title: "Miguel's return is ready to prep — all 9 docs in",
    needsResponseBy: "No blockers · Petal pre-imported everything to Lacerte.",
    whyNow:
      "Miguel uploaded the last document this morning. Petal classified all 9 documents, imported them into Lacerte, and pre-filled Schedule C lines from his QuickBooks P&L. Ready for your review pass.",
    context: [
      "9 of 9 documents received and classified",
      "QuickBooks P&L synced — $186K revenue, $124K expenses",
      "Prior year return imported as starting basis",
      "Estimated time: 35 minutes (typical for his complexity)",
      "Petal staged 3 deduction opportunities for your review",
    ],
    confidence: "High",
    recommendation:
      "Open in Lacerte. Petal handled the import; you focus on review + the 3 deduction calls.",
    sources: ["QuickBooks P&L (today)", "Prior year 1040", "Doc checklist"],
    estimatedMin: 35,
    trustTier: "asks",
    sourceIntegrationId: "lacerte",
    deepLink: {
      label: "Open in Lacerte",
      href: "https://lacerte.intuit.com/return/c9",
      integrationId: "lacerte",
    },
  },
  {
    id: "prep-2",
    tier: "today",
    type: "prep_ready",
    typeLabel: "Ready to prep",
    clientId: "c19",
    clientName: "Anthony Russo",
    clientAvatar: "/images/avatars/07.png",
    title: "Anthony's return is ready — large cap-gains calc needed",
    needsResponseBy: "9 docs in, Petal flagged 2 stock-sale lots needing your judgment.",
    whyNow:
      "Anthony reported $84K in stock sales across 14 lots. Petal matched all 14 to his Schwab 1099-B and pre-calculated cost basis using FIFO. Two lots have wash-sale flags that need your call.",
    context: [
      "Schwab 1099-B imported, 14 of 14 lots matched",
      "FIFO cost basis pre-calculated: $58.4K basis · $25.6K gain",
      "2 lots flagged for wash sale (30-day window crossed)",
      "Holding-period split: $19.2K long-term · $6.4K short-term",
      "Prefer Drake for this client (mid-complex individual)",
    ],
    confidence: "Medium",
    recommendation:
      "Open in Drake. Resolve the 2 wash-sale flags first (Petal staged the disallowance), then review the long-term/short-term split.",
    sources: ["Schwab 1099-B", "Prior year Schedule D", "IRC §1091 (wash sale)"],
    estimatedMin: 28,
    trustTier: "asks",
    sourceIntegrationId: "drake",
    deepLink: {
      label: "Open in Drake",
      href: "https://app.drake.tax/returns/c19",
      integrationId: "drake",
    },
  },
  {
    id: "prep-3",
    tier: "needs_review",
    type: "prep_ready",
    typeLabel: "Ready to prep",
    clientId: "c10",
    clientName: "Karen O'Brien",
    clientAvatar: "/images/avatars/10.png",
    title: "Karen's simple W-2 return is ready — should take 8 minutes",
    needsResponseBy: "All docs in, single W-2, no schedules.",
    whyNow:
      "Karen's return is the kind that ProConnect Online handles in one pass. Petal pre-imported her W-2 and prior-year refund routing. Just needs your eyes + signature.",
    context: [
      "4 of 4 documents received",
      "Single W-2 from a stable employer (5 years)",
      "Standard deduction (no Schedule A)",
      "No 1099s, no business income, no dependents",
      "Refund routing matches prior year",
    ],
    confidence: "High",
    recommendation:
      "Open in ProConnect Online. Knock it out — this is a 5-minute review.",
    sources: ["W-2 (uploaded Mar 10)", "Prior year 1040"],
    estimatedMin: 8,
    trustTier: "asks",
    sourceIntegrationId: "proconnect",
    deepLink: {
      label: "Open in ProConnect",
      href: "https://proconnect.intuit.com/return/c10",
      integrationId: "proconnect",
    },
  },
  {
    id: "bkd-1",
    tier: "right_now",
    type: "books_discrepancy",
    typeLabel: "Books mismatch",
    clientId: "c1",
    clientName: "Marcus Chen",
    clientAvatar: "/images/avatars/01.png",
    title: "Marcus's Xero shows $312K revenue — intake reported $280K",
    needsResponseBy: "$32K delta affects Schedule C income and SE tax materially.",
    whyNow:
      "Petal cross-checked Marcus's Xero P&L against his intake submission. The $32K gap matches a third location he opened in October. Bank deposits confirm Xero is correct.",
    signal: {
      via: "Xero",
      timestamp: "Today · 9:42 PM",
      quote: "Auto-sync detected $312,480 in 2025 gross sales (vs $280,000 reported).",
    },
    evidence: [
      { type: "calculation", label: "Xero P&L 2025", detail: "Gross revenue: $312,480 · Net: $112,340" },
      { type: "calculation", label: "Plaid bank deposits", detail: "Confirmed: $311,902 (within rounding)" },
    ],
    context: [
      "Intake reported $280K (matches prior 2 locations)",
      "Xero shows $312K (includes 3rd location from Oct onward)",
      "Bank feed via Plaid confirms $311,902 in deposits",
      "Schedule C income would change by ~$32K",
      "SE tax impact: ~$4,500 additional",
    ],
    confidence: "High",
    recommendation:
      "Update Marcus's intake to $312,480 and re-confirm with him before finalizing the return. Petal drafted a 2-line confirmation message.",
    recommendedReply:
      "Hey Marcus — quick confirmation: your Xero books show $312,480 in 2025 revenue (third location included), and bank deposits match. We'll roll that into your Schedule C. Just want to make sure that's the full picture before we finalize. All good?\n\n— Antonio",
    sources: ["Xero P&L 2025", "Plaid bank feed", "Intake response (Jan 18)"],
    estimatedMin: 6,
    trustTier: "drafts",
    sourceIntegrationId: "xero",
    deepLink: {
      label: "Open in Xero",
      href: "https://go.xero.com/p&l/c1",
      integrationId: "xero",
    },
  },
  {
    id: "bkd-2",
    tier: "today",
    type: "txn_uncategorized",
    typeLabel: "Books cleanup",
    clientId: "c6",
    clientName: "Roberto Fuentes",
    clientAvatar: "/images/avatars/06.png",
    title: "Roberto's QuickBooks has 47 uncategorized transactions blocking books reconciliation",
    needsResponseBy: "Can't finalize 1120-S until books reconcile.",
    whyNow:
      "Petal pulled Roberto's QuickBooks file. 47 transactions ($28,140 total) need categorization. Most look like fuel + maintenance for the trucking fleet — Petal can auto-categorize with 92% confidence if you approve.",
    context: [
      "47 transactions totaling $28,140 sitting in 'Uncategorized'",
      "Petal's classifier confidence: 92% (above auto threshold)",
      "Most are fuel (Pilot, Flying J), maintenance, and tolls",
      "3 transactions flagged for review (over $1K each, unusual vendor)",
      "Q4 reconciliation can complete the moment these clear",
    ],
    confidence: "High",
    recommendation:
      "Approve the bulk-categorize action — Petal will route 44 transactions to standard categories and queue the 3 outliers for your individual review.",
    sources: ["QuickBooks transaction register", "Prior year Schedule C", "Petal classifier"],
    estimatedMin: 4,
    trustTier: "drafts",
    sourceIntegrationId: "quickbooks",
    deepLink: {
      label: "Review in QuickBooks",
      href: "https://qbo.intuit.com/txns/c6",
      integrationId: "quickbooks",
    },
  },
  {
    id: "gusto-1",
    tier: "needs_review",
    type: "payroll_verify",
    typeLabel: "Payroll verified",
    clientId: "c11",
    clientName: "David Park",
    clientAvatar: "/images/avatars/11.png",
    title: "Gusto generated all 12 W-2s for Park Dental — Petal verified vs payroll register",
    needsResponseBy: "12/12 match · ready to deliver to employees.",
    whyNow:
      "Gusto auto-generated W-2s for David's 12-employee dental practice. Petal cross-checked every box (1, 2, 3, 4, 5, 6, 7, 12, 13, 14) against the underlying payroll register — all 12 forms match cleanly.",
    context: [
      "12 W-2s generated by Gusto",
      "Petal verified: gross wages, federal/state withholding, Medicare, SSI",
      "All 12 forms match payroll register to the penny",
      "Total payroll: $618,420 · Total withholding: $124,210",
      "Ready to release to employees via Gusto self-service portal",
    ],
    confidence: "High",
    recommendation:
      "Tap 'Release to employees' — Gusto will email each employee a copy + push to their employee dashboard.",
    sources: ["Gusto payroll register", "Gusto W-2 batch", "Petal cross-check"],
    estimatedMin: 2,
    trustTier: "auto",
    sourceIntegrationId: "gusto",
    deepLink: {
      label: "Open in Gusto",
      href: "https://app.gusto.com/payroll/c11",
      integrationId: "gusto",
    },
  },
  {
    id: "boi-1",
    tier: "right_now",
    type: "boi_filing",
    typeLabel: "BOI overdue",
    clientId: "c9",
    clientName: "Miguel Sandoval",
    clientAvatar: "/images/avatars/09.png",
    title: "Sandoval Plumbing's BOI report is 18 days overdue",
    needsResponseBy: "$591/day FinCEN penalty accruing.",
    whyNow:
      "Beneficial Ownership Information report was due Jan 1 for entities formed before 2024. Miguel's Sandoval Plumbing missed the deadline. Petal pre-filled the report from his entity formation docs — 90 seconds to file.",
    context: [
      "FinCEN BOI deadline: Jan 1, 2026 (passed)",
      "Penalty: $591/day of non-filing (currently $10,638 accrued)",
      "Entity: Sandoval Plumbing LLC (formed 2018, CA)",
      "Beneficial owner: Miguel Sandoval (100%)",
      "All required fields pre-filled from Articles of Org",
    ],
    confidence: "High",
    recommendation:
      "File now. Petal completed the report — you just review + e-sign. FinCEN typically waives penalties for late-but-voluntary filings under 30 days.",
    sources: ["Articles of Organization", "Miguel's driver's license (SmartVault)", "31 CFR §1010.380"],
    estimatedMin: 3,
    trustTier: "asks",
    sourceIntegrationId: "fincen_boi",
    deepLink: {
      label: "File on FinCEN",
      href: "https://boiefiling.fincen.gov/c9",
      integrationId: "fincen_boi",
    },
  },
  {
    id: "ds-1",
    tier: "today",
    type: "esign_stalled",
    typeLabel: "Signature stalled",
    clientId: "c3",
    clientName: "James & Sofia Rodriguez",
    clientAvatar: "/images/avatars/03.png",
    title: "DocuSign envelope viewed 4 hours ago but not signed",
    needsResponseBy: "James opened the 8879, didn't sign — might be confused on a question.",
    whyNow:
      "DocuSign telemetry shows James opened the envelope at 1:14 PM, scrolled through all pages, then closed without signing. This pattern usually means a question came up. A quick check-in helps.",
    signal: {
      via: "DocuSign",
      timestamp: "Today · 1:14 PM",
      quote: "Envelope opened (3min 42s session) · Closed without signing.",
    },
    context: [
      "Envelope: Form 8879 + 7216 consent + spousal joint election",
      "James spent 3min 42s reviewing (longer than average)",
      "Hovered on Schedule E rental income for 1min 12s",
      "Closed without signing or sending a message",
      "Sofia hasn't opened yet",
    ],
    confidence: "Medium",
    recommendation:
      "Send a 1-line text — 'saw you reviewed the 8879, anything I can clarify?' Petal pre-drafted both an SMS and an email option.",
    recommendedReply:
      "Hey James — saw you reviewed the 8879. If anything looked off (the Schedule E rental piece especially?), happy to walk through it. Just text/call whenever.\n\n— Antonio",
    sources: ["DocuSign envelope telemetry", "Form 8879", "Rodriguez chat history"],
    estimatedMin: 2,
    trustTier: "drafts",
    sourceIntegrationId: "docusign",
    deepLink: {
      label: "View envelope",
      href: "https://docusign.net/envelope/c3-8879",
      integrationId: "docusign",
    },
  },
  {
    id: "ck-1",
    tier: "needs_review",
    type: "research_update",
    typeLabel: "Tax guidance update",
    clientId: "c1",
    clientName: "Marcus Chen",
    clientAvatar: "/images/avatars/01.png",
    title: "New IRS guidance on SSTB QBI changes Marcus's calc by ~$2,100",
    needsResponseBy: "Q1 2026 Checkpoint update flagged this affects his return.",
    whyNow:
      "Checkpoint pushed the Q1 2026 guidance bulletin this morning. New IRS interpretation of 'specified service trade or business' (SSTB) under §199A clarifies that restaurant consulting income (which Marcus had $14,200 of) qualifies for QBI — his prior preparer treated it as SSTB and disallowed.",
    context: [
      "Checkpoint citation: Notice 2026-14 (released Mar 22, 2026)",
      "Applies to: restaurant consulting fees received by restaurant owners",
      "Marcus's 2024 return excluded $14,200 from QBI (treated as SSTB)",
      "Recalculated QBI deduction: +$2,100 federal tax savings",
      "Eligible to amend 2024 (Form 1040-X) — Petal pre-drafted",
    ],
    confidence: "Medium",
    recommendation:
      "Mention to Marcus next call — net benefit ~$2,100 federal refund via 1040-X. Costs him nothing (you've already done the analysis).",
    sources: ["Checkpoint Q1 2026 bulletin", "Notice 2026-14", "Marcus 2024 return", "IRC §199A"],
    estimatedMin: 6,
    trustTier: "asks",
    sourceIntegrationId: "checkpoint",
    deepLink: {
      label: "Open in Checkpoint",
      href: "https://checkpoint.tr.com/notice/2026-14",
      integrationId: "checkpoint",
    },
  },
  {
    id: "ftb-1",
    tier: "today",
    type: "state_notice",
    typeLabel: "State notice",
    clientId: "c6",
    clientName: "Roberto Fuentes",
    clientAvatar: "/images/avatars/06.png",
    title: "CA FTB: Roberto's 2024 1120-S understated by $1,420 — notice arriving in 3-5 business days",
    needsResponseBy: "Get ahead of it — Petal drafted the response.",
    whyNow:
      "California FTB e-services pushed the notice early via the practitioner channel (CPAs see notices 3-5 days before clients receive paper). $1,420 adjustment for a misclassified depreciation deduction. Petal drafted both the response and an explanation for Roberto.",
    context: [
      "Notice type: CA FTB Form 4734D (adjustment notice)",
      "Adjustment: $1,420 to Schedule K-1 income for Roberto",
      "Cause: Section 179 deduction on a vehicle over the CA limit",
      "Penalty + interest: $84",
      "Total owed: $1,504",
      "30-day response window starts when paper notice lands",
    ],
    confidence: "High",
    recommendation:
      "Send Roberto a heads-up (Petal drafted), then either pay the adjustment or file a protest. Petal pre-drafted both options.",
    recommendedReply:
      "Hey Roberto — heads up, you'll get a CA FTB notice in the mail this week. It's a $1,504 adjustment on your S-Corp depreciation (state limit on the truck deduction was tighter than federal). Two options: pay it or protest. I'd recommend just paying — the protest math doesn't justify the time. I can handle it on your behalf. Quick call to confirm?\n\n— Antonio",
    sources: ["CA FTB Form 4734D", "Roberto 2024 1120-S", "CA R&TC §17201"],
    estimatedMin: 8,
    trustTier: "drafts",
    sourceIntegrationId: "ca_ftb",
    deepLink: {
      label: "View in CA FTB portal",
      href: "https://mytax.ftb.ca.gov/notice/c6",
      integrationId: "ca_ftb",
    },
  },
  {
    id: "shop-1",
    tier: "today",
    type: "industry_signal",
    typeLabel: "E-commerce signal",
    clientId: "c10",
    clientName: "Karen O'Brien",
    clientAvatar: "/images/avatars/10.png",
    title: "Karen's Shopify shows $24K 2025 sales — never disclosed on intake",
    needsResponseBy: "Likely needs Schedule C added to her return.",
    whyNow:
      "Petal connected to Karen's Shopify account (she granted access during onboarding 18 months ago). Her store generated $24,180 in 2025 sales — never mentioned on her W-2-only intake. Likely a forgotten side hustle.",
    context: [
      "Shopify store: 'Karen's Crochet Co.' (active since 2022)",
      "2025 gross sales: $24,180",
      "Shopify fees: $1,210 (auto-deductible)",
      "Estimated COGS: ~$8,400 (yarn, supplies)",
      "Net SE income: ~$14,570",
      "Karen filed as simple W-2 last 2 years (you didn't ask about side income)",
    ],
    confidence: "High",
    recommendation:
      "Call Karen — friendly check-in, not a 'gotcha.' She probably forgot. Add Schedule C + SE tax (estimated $2,060 additional liability, $410 QBI deduction).",
    recommendedReply:
      "Hey Karen — small thing: I see your Shopify store had a solid year (~$24K in sales). Want to make sure we capture that on this year's return so the IRS doesn't surprise you later. It'll add a Schedule C and a bit of SE tax — happy to walk through. Quick 10-min call?\n\n— Karen, this is super common and totally fixable.\n\n— Antonio",
    sources: ["Shopify 2025 sales report", "Karen prior years (W-2 only)", "Schedule C draft"],
    estimatedMin: 12,
    trustTier: "asks",
    sourceIntegrationId: "shopify",
    deepLink: {
      label: "Open in Shopify",
      href: "https://admin.shopify.com/karens-crochet/reports/c10",
      integrationId: "shopify",
    },
  },
  {
    id: "team-1",
    tier: "today",
    type: "team_handoff",
    typeLabel: "Team handoff",
    clientId: "c2",
    clientName: "Priya Sharma",
    clientAvatar: "/images/avatars/02.png",
    title: "Elena finished prepping Priya's return — needs your review + sign-off",
    needsResponseBy: "Elena flagged this in #priya-sharma at 4:18 PM.",
    whyNow:
      "Elena (CPA, preparer) completed Priya's Schedule C and is ready to hand off. She flagged 2 judgment calls she wants your eyes on before signing.",
    signal: {
      via: "Slack #priya-sharma",
      timestamp: "Today · 4:18 PM",
      quote: "Antonio, return is ready. Two things I want your call on before we sign: (1) Should we take the home-office deduction for her bedroom corner setup? (2) She has $890 in 'wardrobe' she wants deducted — I said no, want to confirm.",
    },
    context: [
      "Elena finished prep at 4:15 PM",
      "Return ready for review in Drake",
      "Judgment call #1: home office (~$420 deduction)",
      "Judgment call #2: wardrobe ($890 — Elena advised no)",
      "All else clean: $4,840 TikTok income confirmed, standard deduction",
    ],
    confidence: "High",
    recommendation:
      "Open Priya's return in Drake, resolve the 2 judgment calls, sign + transmit. Elena's set everything up — review is ~10 min.",
    sources: ["Slack thread", "Drake return draft", "Priya intake"],
    estimatedMin: 12,
    trustTier: "asks",
    sourceIntegrationId: "slack",
    deepLink: {
      label: "Open in Drake",
      href: "https://app.drake.tax/returns/c2",
      integrationId: "drake",
    },
  },
  {
    id: "cal-1",
    tier: "today",
    type: "calendar_event",
    typeLabel: "Upcoming meeting",
    clientId: "c11",
    clientName: "David Park",
    clientAvatar: "/images/avatars/11.png",
    title: "Your call with David Park starts in 28 minutes — brief is ready",
    needsResponseBy: "3 PM today · Zoom link in your calendar.",
    whyNow:
      "Google Calendar shows David's S-Corp review call at 3 PM. Petal generated the pre-call brief: 3 deduction calls to make, missing equipment list still outstanding (you flagged this yesterday), refund preview if all goes well.",
    context: [
      "Meeting: 3:00 PM · Zoom (link in calendar)",
      "Topic: 2025 S-Corp return review (1120-S + personal)",
      "Outstanding: equipment + depreciation schedule",
      "Petal's 3-page brief covers: 2 deduction calls, payroll verification (12/12 ✓), Q1 estimate recommendation",
      "Estimated refund (preliminary): $4,180 federal + $620 CA",
    ],
    confidence: "High",
    recommendation:
      "Skim the brief now (90 seconds). Petal will surface it in the workspace when you join the call too.",
    sources: ["Google Calendar event", "Drake return draft", "Gusto payroll register", "Your flag (yesterday)"],
    estimatedMin: 2,
    trustTier: "auto",
    sourceIntegrationId: "google_calendar",
  },
  {
    id: "team-2",
    tier: "today",
    type: "team_handoff",
    typeLabel: "Question from James",
    clientId: "c17",
    clientName: "Tyrone Mitchell",
    clientAvatar: "/images/avatars/05.png",
    title: "James (junior preparer) asked: home office for Tyrone?",
    needsResponseBy: "James is mid-prep on Tyrone — blocked until you weigh in.",
    whyNow:
      "James pinged in Slack about Tyrone's home-office deduction. Tyrone drives Uber/Lyft (not really WFH), but uses a spare bedroom corner for trip planning + bookkeeping. James wants your call before claiming.",
    signal: {
      via: "Slack #tyrone-mitchell",
      timestamp: "Today · 1:42 PM",
      quote: "Antonio — Tyrone wants home office for ~40 sq ft. He's a rideshare driver, not really WFH, but uses the corner for admin. Legit or stretch? Don't want to flag for audit on a $150 client.",
    },
    context: [
      "Tyrone's filing tier: Basic ($150)",
      "Square footage claim: 40 sq ft (corner of bedroom)",
      "Actual home-office use: bookkeeping + trip planning for rideshare",
      "IRS rule: 'regular and exclusive use' for trade or business — rideshare admin qualifies but standards are tight",
      "Simplified method: $5/sq ft × 40 = $200 deduction · audit risk: low if substantiated",
    ],
    confidence: "Medium",
    recommendation:
      "Tell James to use the simplified method ($200) with a note in the file documenting the bookkeeping use case. Safe and easy to defend.",
    recommendedReply:
      "James — go with simplified method ($5 × 40 sq ft = $200). Note in the file: 'used for rideshare bookkeeping + trip planning; regular and exclusive use confirmed verbally with client'. Low risk, easy to defend in the unlikely event of audit.\n\n— Antonio",
    sources: ["Slack thread", "IRC §280A", "Pub. 587", "Tyrone intake"],
    estimatedMin: 3,
    trustTier: "asks",
    sourceIntegrationId: "slack",
  },
  {
    id: "reg-1",
    tier: "today",
    type: "regulatory_deadline",
    typeLabel: "Vendor 1099 deadline",
    clientId: "c11",
    clientName: "David Park",
    clientAvatar: "/images/avatars/11.png",
    title: "Park Dental owes 4 vendor 1099-NECs by Jan 31 (7 days)",
    needsResponseBy: "Hard IRS deadline · $310 penalty per late form.",
    whyNow:
      "Gusto + Bill.com flagged 4 vendors who received > $600 from Park Dental in 2025. 1099-NEC forms due to vendors AND IRS by Jan 31. Petal pre-filled all 4 from W-9s on file.",
    context: [
      "Vendor 1 — Dr. Patel substitute coverage: $2,400",
      "Vendor 2 — Office cleaning service: $4,200",
      "Vendor 3 — Equipment maintenance: $1,820",
      "Vendor 4 — Marketing consultant: $3,600",
      "All 4 W-9s pulled from SmartVault",
      "Per-form late penalty: $310 (current 2026 rate)",
    ],
    confidence: "High",
    recommendation:
      "Review the 4 pre-filled forms (~5 min), then e-file the batch to IRS + mail copies to vendors. Petal handles the mailing if you say go.",
    sources: ["Gusto contractor report", "Bill.com vendor register", "SmartVault W-9s", "IRC §6041 + Reg §1.6041-1"],
    estimatedMin: 8,
    trustTier: "drafts",
    sourceIntegrationId: "gusto",
  },
  {
    id: "reg-4",
    tier: "right_now",
    type: "regulatory_deadline",
    typeLabel: "ERO suitability",
    clientId: "u-antonio",
    clientName: "Vazant Consulting (firm)",
    clientAvatar: "/images/avatars/04.png",
    title: "IRS sent ERO suitability questionnaire — response due in 21 days",
    needsResponseBy: "Failure to respond suspends e-filing privileges.",
    whyNow:
      "IRS e-Services delivered an ERO suitability check. Standard practice every 3 years. Petal pre-filled the 8 questions from your firm profile + 2025 activity logs. Just needs your review + e-sign.",
    context: [
      "Notice received: 2026-05-23 (2 days ago)",
      "Response window: 21 days",
      "Last suitability check: 2023-04-12",
      "Petal pre-filled: 6/8 questions from firm data, 2 need your input (any disciplinary actions? any changes to PTIN/EFIN holders?)",
      "Stakes: missing the deadline suspends EFIN; you'd lose e-file ability mid-season",
    ],
    confidence: "High",
    recommendation:
      "Answer the 2 outstanding questions (~3 min). Petal submits via IRS e-Services and tracks confirmation.",
    sources: ["IRS e-Services suitability notice", "Last check (2023)", "Firm profile"],
    estimatedMin: 5,
    trustTier: "asks",
    sourceIntegrationId: "irs_eservices",
  },
  {
    id: "blk-1",
    tier: "right_now",
    type: "prep_blocker",
    typeLabel: "Prep blocked",
    clientId: "c6",
    clientName: "Roberto Fuentes",
    clientAvatar: "/images/avatars/06.png",
    title: "Roberto's 1120-S prep is blocked by 3 upstream issues",
    needsResponseBy: "Books → 1120-S → personal return · 3 cards must clear in order.",
    whyNow:
      "Petal traced the dependency chain on Roberto. His 1120-S can't finalize until QB Q4 reconciles. His personal return can't finalize until the 1120-S K-1 generates. And the CA FTB notice resolution depends on the same 1120-S being final. Resolving the QB blocker unlocks all 3.",
    context: [
      "Upstream blocker: QuickBooks Q4 unreconciled (47 uncategorized txns — see bkd-2)",
      "Downstream 1: 1120-S finalization waiting on books",
      "Downstream 2: Personal 1040 waiting on K-1 from 1120-S",
      "Downstream 3: CA FTB notice response references the corrected 1120-S",
      "Resolving the books unblocks ~$1,200 of billable work currently stalled",
    ],
    confidence: "High",
    recommendation:
      "Clear the QB blocker first (4 min via bulk-categorize). Then the next 3 items move automatically to ready_to_prep status.",
    sources: ["bkd-2 (QB)", "1120-S draft", "1040 draft", "CA FTB notice"],
    estimatedMin: 4,
    trustTier: "asks",
    sourceIntegrationId: "quickbooks",
  },
  {
    id: "ops-1",
    tier: "today",
    type: "business_ops",
    typeLabel: "Unpaid deposits",
    clientId: "u-antonio",
    clientName: "Vazant Consulting (firm)",
    clientAvatar: "/images/avatars/04.png",
    title: "5 client deposits unpaid totaling $1,250 — sending today recovers $1,050",
    needsResponseBy: "Aged 7-14 days · still recoverable.",
    whyNow:
      "Stripe shows 5 clients with deposit invoices outstanding. Average age: 9 days. Petal pre-drafted friendly nudges; historical data shows 84% of deposits land within 48 hours after a single nudge.",
    context: [
      "DeShawn Williams (c4) — $50 (14 days)",
      "Ashley Kim (c7) — $50 (11 days)",
      "Vladimir Petrov (c13) — $50 (8 days)",
      "Fatima Al-Hassan (c20) — $50 (7 days)",
      "Carlos Martinez (new lead, not in mock) — $50 (6 days)",
      "Petal drafted personalized nudges for each",
    ],
    confidence: "High",
    recommendation:
      "Approve the batch send (one click). Petal queues all 5 messages via the client's preferred channel.",
    recommendedReply:
      "Hi [Client] — just a friendly reminder that your $50 deposit is still outstanding. It's how we lock in your spot on our schedule. Quick pay link: [Stripe link]. Any questions, just text/email.\n\n— Antonio",
    sources: ["Stripe AR aging report", "Petal nudge templates", "Historical payment data"],
    estimatedMin: 3,
    trustTier: "drafts",
    sourceIntegrationId: "stripe",
  },
  {
    id: "opp-1",
    tier: "today",
    type: "proactive_opportunity",
    typeLabel: "Revenue jump",
    clientId: "c6",
    clientName: "Roberto Fuentes",
    clientAvatar: "/images/avatars/06.png",
    title: "Roberto's revenue jumped 42% YoY — strong tax planning opportunity",
    needsResponseBy: "Reach out this week · planning calls have higher acceptance when fresh data is on the table.",
    whyNow:
      "Holistiplan + Xero cross-check: Roberto's 2025 trucking revenue is $148K vs $104K in 2024 (+42%). The S-Corp election I already flagged (hp-1) becomes much more valuable at this revenue level. Plus: catch-up Solo 401(k), §179 election on truck additions.",
    context: [
      "Revenue: $104K (2024) → $148K (2025) · +42%",
      "S-Corp election alone: ~$4,200/yr savings",
      "Solo 401(k) opportunity (he doesn't have one): up to $69K deferral",
      "§179 election on 2 new trucks: $87K immediate write-off available",
      "Net advisory value over 5 years: ~$67K",
      "Advisory engagement fee opportunity: $1,800 quarterly retainer",
    ],
    confidence: "Medium",
    recommendation:
      "Book a 30-min planning call. Petal drafted the outreach + the 4-page proposal. Lead with the S-Corp number — easiest to grasp.",
    recommendedReply:
      "Hey Roberto — your numbers this year are great. Big enough that we should talk about a few things that'll save you real money going forward (S-Corp election + retirement structuring). I blocked 30 min Thursday or Friday — which works better?\n\n— Antonio",
    sources: ["Xero P&L 2025 vs 2024", "Holistiplan projection", "Form 2553 draft", "Solo 401(k) eligibility"],
    estimatedMin: 6,
    trustTier: "drafts",
    sourceIntegrationId: "holistiplan",
  },
  {
    id: "efile-1",
    tier: "right_now",
    type: "e_file_status",
    typeLabel: "E-file rejected",
    clientId: "c5",
    clientName: "Linda Nakamura",
    clientAvatar: "/images/avatars/05.png",
    title: "Linda's return was REJECTED by IRS — code IND-031-04 (AGI mismatch)",
    needsResponseBy: "5-day window to fix + resubmit before deadline.",
    whyNow:
      "Linda's e-file came back rejected this morning. Code IND-031-04: prior-year AGI used for identity verification doesn't match IRS records. Easy fix — pull her 2024 AGI from the transcript Petal already has.",
    signal: {
      via: "IRS MeF acknowledgment",
      timestamp: "Today · 8:14 AM",
      quote: "Reject code IND-031-04: The taxpayer's prior-year AGI provided does not match IRS records.",
    },
    context: [
      "Reject code: IND-031-04 (AGI mismatch)",
      "Submitted AGI value: $42,180",
      "IRS record (per transcript Petal pulled): $42,108",
      "Fix: update the e-file with the correct $42,108 + resubmit",
      "Window to resubmit without late filing: 5 days",
      "Linda doesn't know yet — Petal drafted a heads-up message",
    ],
    confidence: "High",
    recommendation:
      "Update the AGI value in Drake and retransmit. Petal pre-staged the resubmission package. Then send Linda the auto-drafted note so she's not surprised.",
    recommendedReply:
      "Hi Linda — quick update: the IRS bounced your return back because of a tiny AGI mismatch from last year (a $72 typo, basically). I've already corrected and re-transmitted. Should clear within a few hours. No action needed on your end.\n\n— Antonio",
    sources: ["IRS MeF ack file", "Linda's 2024 transcript", "Drake return draft"],
    estimatedMin: 6,
    trustTier: "asks",
    sourceIntegrationId: "irs_eservices",
    deepLink: {
      label: "Reopen in ProConnect",
      href: "https://proconnect.intuit.com/return/c5",
      integrationId: "proconnect",
    },
  },
  {
    id: "el-1",
    tier: "today",
    type: "engagement_letter",
    typeLabel: "Engagement renewal",
    clientId: "u-antonio",
    clientName: "Vazant Consulting (firm)",
    clientAvatar: "/images/avatars/04.png",
    title: "11 engagement letters expire in next 30 days — auto-renewal staged",
    needsResponseBy: "Without an active engagement letter, prep starts uninsured.",
    whyNow:
      "Annual engagement letters for 11 returning clients expire before next season starts. Petal pre-staged renewals using last year's terms (+ any tier upgrades since). Just review + batch e-sign.",
    context: [
      "Clients with engagement letters expiring within 30 days: 11",
      "Auto-renewal staged for: 9 (terms unchanged from last year)",
      "Tier-change clients (need your judgment): 2 (Marcus Chen, Roberto Fuentes)",
      "All 11 will get DocuSign envelopes via Ignition",
      "Petal blocks return prep until engagement is signed (compliance gate)",
    ],
    confidence: "High",
    recommendation:
      "Review the 2 tier-change cases, then batch-send all 11 envelopes via Ignition. Clients sign at their leisure.",
    sources: ["Ignition engagement letter store", "Last year's engagement archive", "Tier change log"],
    estimatedMin: 8,
    trustTier: "drafts",
    sourceIntegrationId: "ignition",
  },
  {
    id: "cpe-1",
    tier: "needs_review",
    type: "cpe_tracking",
    typeLabel: "CPE deadline",
    clientId: "u-antonio",
    clientName: "Vazant Consulting (firm)",
    clientAvatar: "/images/avatars/04.png",
    title: "You're 14 CPE hours short of your EA cycle deadline (Dec 31)",
    needsResponseBy: "Without 72 hours over the 3-year cycle, EA renewal will be blocked.",
    whyNow:
      "Current cycle: 2024-2026. You've logged 58 of 72 required hours. 14 hours remain with 7 months to go. Petal found 3 upcoming live + 8 on-demand courses that fit your specialty areas (S-Corps, IRS rep).",
    context: [
      "EA cycle: Jan 1 2024 → Dec 31 2026",
      "Required: 72 hours total (16 ethics, 56 federal tax)",
      "Logged so far: 58 hours (14 ethics done, 44 federal)",
      "Shortfall: 14 hours (all federal tax)",
      "3 live courses + 8 on-demand options surfaced by Petal",
      "Cost range: $0 (IRS Nationwide Tax Forum) to $895 (NAEA Schuldiner)",
    ],
    confidence: "High",
    recommendation:
      "Block 2-3 evenings before October to hit 72 hours. Petal pre-vetted the IRS Forum (free, July) as a 14-hour weekend bundle that closes the gap in one shot.",
    sources: ["IRS PTIN CPE log", "Treasury Circular 230 §10.6", "Petal CPE matcher"],
    estimatedMin: 8,
    trustTier: "asks",
    sourceIntegrationId: "irs_eservices",
  },
  {
    id: "k1-1",
    tier: "today",
    type: "k1_inflow",
    typeLabel: "K-1 expected",
    clientId: "c8",
    clientName: "Thomas & Marie DuBois",
    clientAvatar: "/images/avatars/08.png",
    title: "Thomas's K-1 from Lakeshore Partners LLC not received yet — prep stalled",
    needsResponseBy: "Lakeshore Partners' preparer is on extension; K-1 won't arrive before April 15.",
    whyNow:
      "Thomas is a 22% limited partner in Lakeshore Partners LLC (rental real estate). Their 1065 went on extension. Without his K-1, you can't finalize his 1040. Petal contacted the upstream preparer; ETA is June 18.",
    context: [
      "Entity: Lakeshore Partners LLC (rental real estate, 6 partners)",
      "Thomas's ownership: 22% limited",
      "Upstream preparer: Stevens & Co. (Sacramento)",
      "1065 status: extended (Form 7004 filed Mar 12)",
      "K-1 ETA per Stevens: June 18, 2026",
      "Recommended path: file Thomas's extension now, finalize when K-1 lands",
    ],
    confidence: "High",
    recommendation:
      "File Thomas's Form 4868 extension today. Petal pre-staged. Set a triage reminder for June 18 to chase the K-1 if Stevens doesn't deliver.",
    sources: ["Lakeshore Partners 1065 status (Stevens)", "Form 4868 draft", "Thomas's 2024 K-1 (prior year)"],
    estimatedMin: 4,
    trustTier: "drafts",
  },
  {
    id: "ms-1",
    tier: "today",
    type: "multi_state",
    typeLabel: "Multi-state nexus",
    clientId: "c14",
    clientName: "Aisha Johnson",
    clientAvatar: "/images/avatars/02.png",
    title: "Aisha moved to Texas mid-year — needs CA part-year + TX nexus check",
    needsResponseBy: "Intake confirmed move date · prep needs to split the year.",
    whyNow:
      "Aisha's intake noted she moved from California to Texas on July 14. That means two state returns: CA (540NR part-year resident) for Jan-Jul, then TX for the side-hustle income earned there. Petal pre-calculated the day-count split.",
    context: [
      "Move date confirmed: July 14, 2025",
      "CA wages (Jan-Jul): $48,200 (W-2 from CA employer)",
      "TX wages (Jul-Dec): $46,500 (transferred to TX office of same employer)",
      "TX has no state income tax (simplifies)",
      "Side-hustle (online scrub sales): $8,400, sourced where earned",
      "CA 540NR part-year + TX (no return needed, just basis tracking)",
    ],
    confidence: "High",
    recommendation:
      "Add CA 540NR to the return prep in ProConnect. Petal pre-filled the residency dates + income split. No TX return needed since TX has no income tax.",
    sources: ["Aisha intake (move date)", "W-2 (CA + TX)", "Bank statements", "Multi-state nexus checker"],
    estimatedMin: 9,
    trustTier: "asks",
    sourceIntegrationId: "proconnect",
  },
  {
    id: "amend-1",
    tier: "needs_review",
    type: "amended_return",
    typeLabel: "1040-X opportunity",
    clientId: "c12",
    clientName: "Jasmine Torres",
    clientAvatar: "/images/avatars/12.png",
    title: "Jasmine's 2024 return left $485 on the table — 1040-X drafted",
    needsResponseBy: "3-year amendment window: open until April 15, 2028 · no urgency.",
    whyNow:
      "While prepping Jasmine's 2025 return, Petal cross-checked 2024 and found she missed the §162(l) self-employed health insurance deduction ($3,200 in premiums she paid out-of-pocket). Refund: ~$485.",
    context: [
      "Missed deduction: §162(l) SE health insurance ($3,200)",
      "Federal refund: $485",
      "California refund: $0 (already accounted for)",
      "Form 1040-X pre-drafted by Petal",
      "Cost to Jasmine: $0 (you've already done the analysis)",
      "Time investment: 4 min to review + sign",
      "Amendment window: open until April 15, 2028",
    ],
    confidence: "High",
    recommendation:
      "Mention to Jasmine. Free money for her. Bills as a $0 advisory win since you caught it.",
    recommendedReply:
      "Hey Jasmine — while reviewing your file, I noticed last year missed a deduction worth about $485 back to you. I've already drafted the amendment, just need your sign-off. Want me to file it?\n\n— Antonio",
    sources: ["2024 return", "2024 health-insurance premium records", "IRC §162(l)", "Form 1040-X draft"],
    estimatedMin: 4,
    trustTier: "drafts",
  },
  {
    id: "aud-1",
    tier: "right_now",
    type: "audit_representation",
    typeLabel: "Audit opened",
    clientId: "c1",
    clientName: "Marcus Chen",
    clientAvatar: "/images/avatars/01.png",
    title: "IRS opened a correspondence audit on Marcus's 2023 Schedule C",
    needsResponseBy: "30-day initial response window from notice date.",
    whyNow:
      "IRS sent Marcus a Letter 566 (correspondence audit) requesting substantiation for 4 line items on his 2023 Schedule C ($28,200 in vehicle expenses, $14,800 in meals, $9,400 in 'other'). Petal pulled his 2023 records + drafted a response package.",
    context: [
      "Notice type: Letter 566 (Correspondence audit)",
      "Tax year under exam: 2023",
      "Items requested: Schedule C lines 9 (vehicle), 24b (meals), 27a (other)",
      "Total dollars at risk: $52,400",
      "Marcus's documentation: complete (you maintained good files)",
      "Petal's draft response: 14-page package with receipts + mileage log + meal substantiation",
      "Recommended approach: full response within 14 days (well before deadline)",
    ],
    confidence: "Medium",
    recommendation:
      "Call Marcus today to walk through the letter (don't email — calls reduce panic). Then send the response package + your engagement letter for audit-rep scope.",
    recommendedReply:
      "Marcus — got a moment to talk? IRS sent a routine audit letter on your 2023 return. Totally manageable, but I want to walk you through it personally. Free time this afternoon or tomorrow morning?\n\n— Antonio",
    sources: ["IRS Letter 566", "Marcus 2023 return + records", "2023 vehicle/meal logs", "Audit response template"],
    estimatedMin: 35,
    trustTier: "manual",
    sourceIntegrationId: "irs_eservices",
  },
];

// ─── Resolved today (7) - collapsed by default in the queue ────────────

export const RESOLVED_TODAY: ResolvedItem[] = [
  { id: "r1", clientName: "Linda Nakamura", title: "Filed Linda's return - accepted by IRS",          typeLabel: "Filed",        resolvedAt: "8:42 AM" },
  { id: "r2", clientName: "Karen O'Brien",  title: "Sent Karen's signed 8879 to ERO queue",            typeLabel: "Signature",    resolvedAt: "9:15 AM" },
  { id: "r3", clientName: "Rachel Goldstein", title: "Approved Rachel's draft return - refund $1,240", typeLabel: "Return review", resolvedAt: "9:48 AM" },
  { id: "r4", clientName: "Tyrone Mitchell", title: "Logged Tyrone's mileage docs - ready to prep",    typeLabel: "Document",     resolvedAt: "10:02 AM" },
  { id: "r5", clientName: "Jasmine Torres",  title: "Cleared Jasmine's 1099 mismatch - confirmed $0",  typeLabel: "Document gap", resolvedAt: "10:31 AM" },
  { id: "r6", clientName: "Ashley Kim",      title: "Sent Ashley's intake checklist + welcome kit",     typeLabel: "Intake",       resolvedAt: "11:14 AM" },
  { id: "r7", clientName: "Thomas DuBois",   title: "Resolved DuBois crypto basis question",            typeLabel: "Calculation",  resolvedAt: "11:52 AM" },
];

/** Convert an open ClientIssue (the "Flags" model) into a TriageIssue so it
 *  shows up in the triage queue. Tier + trust tier derive from source:
 *    - manual flag → tier "today" (you bookmarked it for action)
 *    - AI flag → tier "needs_review" (Petal surfaced it, lower urgency)
 *  Always trust tier "asks" — a flag is a human-marked bookmark, never
 *  something Petal can auto-resolve. */
export function flagAsTriageIssue(
  flag: import("./issues-mock-data").ClientIssue,
  client: { fullName: string; avatar?: string }
): TriageIssue {
  const isAI = flag.source === "ai";
  return {
    id: `triage-flag-${flag.id}`,
    tier: isAI ? "needs_review" : "today",
    type: "flag",
    typeLabel: isAI ? "AI flag" : "Manual flag",
    clientId: flag.clientId,
    clientName: client.fullName,
    clientAvatar: client.avatar,
    title: flag.title,
    needsResponseBy: isAI
      ? "Petal surfaced this — review when you have time."
      : "You bookmarked this — resolve or push it forward.",
    whyNow: flag.description || (isAI
      ? "Petal flagged this during the most recent client review."
      : "You added this flag manually. It stays in your queue until you resolve it."),
    context: [
      flag.description || "No additional context",
      flag.aiReason ? `Petal's reasoning: ${flag.aiReason}` : "Source: manual bookmark",
    ].filter(Boolean) as string[],
    confidence: "Medium",
    recommendation: isAI
      ? "Decide: keep investigating, resolve as a non-issue, or convert to a real action item."
      : "Resolve when handled, or push forward into a draft message / next-step.",
    sources: [flag.sourceDocumentId ? `Document: ${flag.sourceDocumentId}` : "Flag (client page)"],
    estimatedMin: isAI ? 6 : 4,
    trustTier: "asks",
  };
}

/** Group active issues by tier for queue rendering. */
export function issuesByTier(): Record<TriageTier, TriageIssue[]> {
  return TRIAGE_TIERS.reduce(
    (acc, tier) => {
      acc[tier.key] = TRIAGE_ISSUES.filter((i) => i.tier === tier.key);
      return acc;
    },
    { right_now: [], today: [], waiting: [], needs_review: [] } as Record<TriageTier, TriageIssue[]>
  );
}

/** Total estimated minutes of remaining work. */
export function totalEstimatedMinutes(): number {
  return TRIAGE_ISSUES.reduce((sum, i) => sum + i.estimatedMin, 0);
}
