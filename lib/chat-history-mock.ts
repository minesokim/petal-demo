/**
 * Mock chat history for the ClientAskPetal panel — past Ask-Petal conversations
 * Antonio has had about a specific client. Each entry is a complete session
 * that can be loaded back into the chat view.
 *
 * Production: replace with persisted sessions keyed by (preparerId, clientId).
 */

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  summary?: string;
}

export interface ChatHistorySession {
  id: string;
  /** ISO timestamp of the session's last activity */
  lastMessageAt: string;
  /** Auto-derived title (first user question, truncated) */
  title: string;
  messages: ChatHistoryMessage[];
}

// Helper to build timestamps relative to "now" so the mock stays fresh-looking
function relativeISO(daysAgo: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Default mock history shared across clients. Realistic preparer-style
 * questions Antonio might have asked about a tax client over the past weeks.
 */
const DEFAULT_HISTORY: ChatHistorySession[] = [
  {
    id: "h_yoy",
    lastMessageAt: relativeISO(0, 14, 22),
    title: "Compare this year's return to last year",
    messages: [
      { id: "m1", role: "user", content: "Compare this year's return to last year — what changed?" },
      {
        id: "m2",
        role: "assistant",
        content: "",
        summary:
          "Three notable changes: (1) Schedule C revenue up 32% YoY, mostly from new brand-deal income. (2) Home-office deduction dropped 40% — square footage looks consistent, worth verifying. (3) Q4 estimated payments are short ~$2,800 against safe harbor. Recommend a check-in before filing.",
      },
    ],
  },
  {
    id: "h_docs",
    lastMessageAt: relativeISO(1, 11, 5),
    title: "What documents are still missing?",
    messages: [
      { id: "m1", role: "user", content: "What documents are still missing for this client?" },
      {
        id: "m2",
        role: "assistant",
        content: "",
        summary:
          "3 of 7 received. Still outstanding: W-2 (employer pending), 1099-NEC from Revolve, and the home-office floor plan. The W-2 should arrive by Jan 31 — I can draft a reminder for the other two.",
      },
    ],
  },
  {
    id: "h_qbi",
    lastMessageAt: relativeISO(4, 16, 41),
    title: "QBI eligibility check",
    messages: [
      { id: "m1", role: "user", content: "Does this client qualify for the QBI deduction?" },
      {
        id: "m2",
        role: "assistant",
        content: "",
        summary:
          "Eligible. Schedule C income is below the 2025 threshold for single filers ($241,950), so no SSTB phaseout applies. Standard 20% deduction on QBI of $54k = $10,800. Worth confirming the business is not classified as a specified service trade.",
      },
    ],
  },
  {
    id: "h_payment",
    lastMessageAt: relativeISO(8, 10, 14),
    title: "Draft a payment reminder",
    messages: [
      { id: "m1", role: "user", content: "Draft a friendly payment reminder for the outstanding balance." },
      {
        id: "m2",
        role: "assistant",
        content: "",
        summary:
          "Drafted a portal message: warm tone, references the engagement letter, includes the payment link and a soft deadline of Friday. Ready to send when you are.",
      },
    ],
  },
  {
    id: "h_intake",
    lastMessageAt: relativeISO(14, 9, 30),
    title: "Summarize the intake",
    messages: [
      { id: "m1", role: "user", content: "Summarize this client's intake — what should I know?" },
      {
        id: "m2",
        role: "assistant",
        content: "",
        summary:
          "Single filer, content creator with W-2 + 1099 income. Started a brand-deal LLC mid-year — needs Schedule C set up. No dependents. California resident. Referred by Priya, so likely a smooth onboarding. Has a Mar 24 prep appointment booked.",
      },
    ],
  },
];

/**
 * Returns the chat history for a given client. For mock purposes returns the
 * same shared list — production would key by (preparerId, clientId).
 */
export function getClientChatHistory(_clientId: string): ChatHistorySession[] {
  return DEFAULT_HISTORY;
}

/** Human-readable "Today / Yesterday / X days ago" formatter. */
export function formatHistoryTime(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const time = then.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 0) return `Today at ${time}`;
  if (diffDays === 1) return `Yesterday at ${time}`;
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
