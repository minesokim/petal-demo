/**
 * Activity stream - system-wide event log.
 *
 * Every agent action, every system event, every state change flows through
 * one chronological stream. Distinct from Triage (which is "needs your
 * action") - Activity is "what's happening in the system."
 *
 * Think Slack/Discord pattern: reverse-chrono, never-empty, filterable.
 */

export type ActivityKind =
  | "ai_action"       // an agent did something
  | "user_action"     // preparer acted
  | "client_action"   // client uploaded / replied / signed
  | "compliance"      // 8867 verified / position refused / audit risk computed
  | "system";         // routine maintenance / sweeps / sync

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  agent?: string;        // when kind === "ai_action" or "compliance"
  actor?: string;        // when kind === "user_action" - "you" or team member
  title: string;
  detail?: string;       // optional one-line context
  entity?: { kind: "client" | "return" | "document"; label: string; id?: string };
  /** ISO timestamp */
  at: string;
  /** Optional trust tier - surfaces autonomy of the action */
  tier?: "auto" | "drafts" | "asks" | "manual";
}

// ─── Mock event stream - ~35 events from the last ~3 days ───────────────

const now = new Date();
const minutesAgo = (n: number) => new Date(now.getTime() - n * 60 * 1000).toISOString();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

export const ACTIVITY_EVENTS: ActivityEvent[] = [
  // ── Just now (last 5 minutes) ──
  {
    id: "a1",
    kind: "ai_action",
    agent: "memory-curator",
    title: "Indexed 12 new emails in the Mendez thread",
    detail: "All conversations parsed and added to OmniContext",
    entity: { kind: "client", label: "Carlos & Elena Mendez", id: "c15" },
    at: minutesAgo(2),
    tier: "auto",
  },
  {
    id: "a2",
    kind: "compliance",
    agent: "triage-classifier",
    title: "Flagged 1099 mismatch on Priya Sharma's return",
    detail: "1099-NEC shows $4,320 · intake reported $2,300 · clarification drafted",
    entity: { kind: "client", label: "Priya Sharma", id: "c2" },
    at: minutesAgo(4),
    tier: "drafts",
  },

  // ── Last hour ──
  {
    id: "a3",
    kind: "ai_action",
    agent: "discovery-agent",
    title: "Surfaced §179 opportunity for Marcus Chen",
    detail: "Estimated benefit: $3,800 · Settled authority · Sch C restaurant equipment",
    entity: { kind: "client", label: "Marcus Chen", id: "c1" },
    at: minutesAgo(18),
    tier: "asks",
  },
  {
    id: "a4",
    kind: "client_action",
    title: "Priya Sharma uploaded TikTok_1099-NEC_2024.pdf",
    entity: { kind: "client", label: "Priya Sharma", id: "c2" },
    at: minutesAgo(23),
  },
  {
    id: "a5",
    kind: "ai_action",
    agent: "inbox-drafter",
    title: "Drafted reply to Sarah Mitchell about Q4 estimates",
    detail: "Pulled context from intake + prior return · ready for your review",
    entity: { kind: "client", label: "Sarah Mitchell", id: "c21" },
    at: minutesAgo(31),
    tier: "drafts",
  },
  {
    id: "a6",
    kind: "user_action",
    actor: "Antonio",
    title: "Approved + sent reply to David Park",
    detail: "Reply re: S-Corp depreciation decision",
    entity: { kind: "client", label: "David Park", id: "c11" },
    at: minutesAgo(42),
  },
  {
    id: "a7",
    kind: "compliance",
    agent: "triage-classifier",
    title: "Refused §469 real-estate-pro claim for Anthony Russo",
    detail: "Hours undocumented · doesn't clear Reasonable Basis · refusal memo generated",
    entity: { kind: "client", label: "Anthony Russo", id: "c19" },
    at: minutesAgo(54),
    tier: "asks",
  },

  // ── Today (earlier) ──
  {
    id: "a8",
    kind: "ai_action",
    agent: "nudge-agent",
    title: "Scheduled Q1 estimate reminders for 38 clients",
    detail: "Sending Mar 1 · cadence adapts based on response history",
    at: hoursAgo(2),
    tier: "drafts",
  },
  {
    id: "a9",
    kind: "system",
    title: "Daily 7-layer shield sweep completed",
    detail: "Practice-wide compliance: 96% · $0 penalty exposure · 2 amber flags",
    at: hoursAgo(2.5),
  },
  {
    id: "a10",
    kind: "client_action",
    title: "James & Sofia Rodriguez signed Form 8879",
    detail: "KBA identity verified · IP logged · ready for your countersignature",
    entity: { kind: "client", label: "James & Sofia Rodriguez", id: "c3" },
    at: hoursAgo(3),
  },
  {
    id: "a11",
    kind: "ai_action",
    agent: "memory-curator",
    title: "Extracted 'started TikTok partnership' fact for Priya",
    detail: "From Mar 11 email · added to OmniContext",
    entity: { kind: "client", label: "Priya Sharma", id: "c2" },
    at: hoursAgo(4),
    tier: "auto",
  },
  {
    id: "a12",
    kind: "user_action",
    actor: "Antonio",
    title: "Marked DeShawn Williams as needing phone follow-up",
    entity: { kind: "client", label: "DeShawn Williams", id: "c4" },
    at: hoursAgo(5),
  },
  {
    id: "a13",
    kind: "ai_action",
    agent: "inbox-drafter",
    title: "Drafted doc-collection nudge for Tyrone Mitchell",
    detail: "Friendly tone · references prior conversation about Uber mileage",
    entity: { kind: "client", label: "Tyrone Mitchell", id: "c17" },
    at: hoursAgo(6),
    tier: "drafts",
  },
  {
    id: "a14",
    kind: "compliance",
    agent: "triage-classifier",
    title: "Form 8867 auto-generated for Aisha Johnson",
    detail: "EITC + CTC due-diligence checklist · 4 lines need your sign-off",
    entity: { kind: "client", label: "Aisha Johnson", id: "c14" },
    at: hoursAgo(7),
    tier: "drafts",
  },
  {
    id: "a15",
    kind: "system",
    title: "OLT sync completed",
    detail: "12 returns synced · 0 conflicts · last update merged into practice ledger",
    at: hoursAgo(8),
  },
  {
    id: "a16",
    kind: "ai_action",
    agent: "discovery-agent",
    title: "Modeled S-Corp scenario for Miguel Sandoval",
    detail: "Net benefit ~$2,600/year · Form 2553 election for tax year 2027",
    entity: { kind: "client", label: "Miguel Sandoval", id: "c9" },
    at: hoursAgo(9),
    tier: "asks",
  },

  // ── Yesterday ──
  {
    id: "a17",
    kind: "user_action",
    actor: "Antonio",
    title: "E-filed Linda Nakamura's 2025 return",
    detail: "Refund $1,820 · IRS acknowledgment received in 19 min",
    entity: { kind: "client", label: "Linda Nakamura", id: "c5" },
    at: daysAgo(1),
  },
  {
    id: "a18",
    kind: "ai_action",
    agent: "memory-curator",
    title: "Linked Priya's referral source to Sarah Mitchell intake",
    detail: "Cross-reference detected in intake form",
    entity: { kind: "client", label: "Sarah Mitchell", id: "c21" },
    at: daysAgo(1.05),
    tier: "auto",
  },
  {
    id: "a19",
    kind: "ai_action",
    agent: "nudge-agent",
    title: "Paused all nudges to Karen O'Brien",
    detail: "Detected 'on vacation' signal · resumes Jun 12",
    entity: { kind: "client", label: "Karen O'Brien", id: "c10" },
    at: daysAgo(1.1),
    tier: "auto",
  },
  {
    id: "a20",
    kind: "client_action",
    title: "Carlos Fuentes uploaded 3 K-1 documents",
    entity: { kind: "client", label: "Roberto Fuentes", id: "c6" },
    at: daysAgo(1.2),
  },
  {
    id: "a21",
    kind: "compliance",
    agent: "triage-classifier",
    title: "Classified IRS CP2000 notice for Roberto Fuentes",
    detail: "Income discrepancy · response drafted · sources cited",
    entity: { kind: "client", label: "Roberto Fuentes", id: "c6" },
    at: daysAgo(1.3),
    tier: "drafts",
  },
  {
    id: "a22",
    kind: "ai_action",
    agent: "discovery-agent",
    title: "Identified self-employed health insurance deduction for Mei-Lin Wu",
    detail: "Estimated $7,800 deduction · Schedule 1 line 17",
    entity: { kind: "client", label: "Mei-Lin Wu", id: "c18" },
    at: daysAgo(1.4),
    tier: "asks",
  },
  {
    id: "a23",
    kind: "user_action",
    actor: "Antonio",
    title: "Approved 6 client replies in one batch",
    detail: "All Q1 estimate confirmations",
    at: daysAgo(1.5),
  },
  {
    id: "a24",
    kind: "system",
    title: "Xero sync completed",
    detail: "142 transactions categorized · 14 flagged for review",
    at: daysAgo(1.6),
  },

  // ── 2 days ago ──
  {
    id: "a25",
    kind: "ai_action",
    agent: "nudge-agent",
    title: "Escalated Vladimir Petrov to call recommendation",
    detail: "No portal logins in 14 days · 3 unanswered SMS",
    entity: { kind: "client", label: "Vladimir Petrov", id: "c13" },
    at: daysAgo(2),
    tier: "asks",
  },
  {
    id: "a26",
    kind: "user_action",
    actor: "Antonio",
    title: "Created custom automation: Auto-categorize bank txns over $1K",
    detail: "Pattern-matches against prior categorizations · 287 runs so far",
    at: daysAgo(2.1),
  },
  {
    id: "a27",
    kind: "ai_action",
    agent: "discovery-agent",
    title: "Flagged Roth conversion window for Sarah Mitchell",
    detail: "Bonus pushed her into next bracket · year-end opportunity",
    entity: { kind: "client", label: "Sarah Mitchell", id: "c21" },
    at: daysAgo(2.2),
    tier: "asks",
  },
  {
    id: "a28",
    kind: "compliance",
    title: "Compliance shield score updated: 96%",
    detail: "L4 anomaly check found 2 new flags · L7 WISP renewal in 47 days",
    at: daysAgo(2.3),
  },
  {
    id: "a29",
    kind: "client_action",
    title: "Fatima Al-Hassan completed intake form",
    entity: { kind: "client", label: "Fatima Al-Hassan", id: "c20" },
    at: daysAgo(2.4),
  },
  {
    id: "a30",
    kind: "ai_action",
    agent: "memory-curator",
    title: "Updated dependents fact for Mendez family",
    detail: "Detected from Mar 22 email · was 3, now 4",
    entity: { kind: "client", label: "Carlos & Elena Mendez", id: "c15" },
    at: daysAgo(2.5),
    tier: "auto",
  },

  // ── 3 days ago ──
  {
    id: "a31",
    kind: "system",
    title: "IRS Solutions sync · 1 new transcript pulled",
    detail: "Carlos Fuentes account · 2024 transcript with installment activity",
    at: daysAgo(3),
  },
  {
    id: "a32",
    kind: "ai_action",
    agent: "inbox-drafter",
    title: "Composed engagement letter for Fatima Al-Hassan",
    detail: "Cash-business adapted template · references Elena referral",
    entity: { kind: "client", label: "Fatima Al-Hassan", id: "c20" },
    at: daysAgo(3.1),
    tier: "drafts",
  },
  {
    id: "a33",
    kind: "user_action",
    actor: "Antonio",
    title: "Imported 12 1099-NEC files via portal upload",
    at: daysAgo(3.2),
  },
  {
    id: "a34",
    kind: "compliance",
    agent: "triage-classifier",
    title: "Caught W-2 + Schedule C from same employer for James Wilson",
    detail: "Potential worker-classification issue · flagged for prep review",
    entity: { kind: "client", label: "James Wilson", id: "c-james" },
    at: daysAgo(3.3),
    tier: "asks",
  },
];

/**
 * Group events into time buckets for rendering.
 */
export function groupActivityByBucket(events: ActivityEvent[]) {
  const buckets: Record<string, ActivityEvent[]> = {
    "Just now": [],
    "Last hour": [],
    "Today": [],
    "Yesterday": [],
    "This week": [],
  };

  const nowMs = Date.now();
  for (const e of events) {
    const ageMs = nowMs - new Date(e.at).getTime();
    const ageMin = ageMs / (1000 * 60);
    if (ageMin < 5) buckets["Just now"].push(e);
    else if (ageMin < 60) buckets["Last hour"].push(e);
    else if (ageMin < 60 * 24) buckets["Today"].push(e);
    else if (ageMin < 60 * 48) buckets["Yesterday"].push(e);
    else buckets["This week"].push(e);
  }

  return buckets;
}
