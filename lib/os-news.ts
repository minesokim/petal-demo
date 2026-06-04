// Petal OS — Today's Brief: the morning-newspaper context. Facts to KNOW, not tasks to DO.
// Tax/regulatory news, season pace, and wins — Petal ties each to the firm's book where it can.

export type BriefTone = "urgent" | "alert" | "win" | "info";

export interface BriefItem {
  tone: BriefTone;
  /** where it came from — IRS / FinCEN / CA FTB, etc. (omit for internal facts) */
  source?: string;
  headline: string;
  detail: string;
  href?: string;
}

export const briefToneDot: Record<BriefTone, string> = {
  urgent: "bg-red-500",
  alert: "bg-amber-500",
  win: "bg-emerald-500",
  info: "bg-[var(--os-ink-subtle)]",
};

export const brief: BriefItem[] = [
  {
    tone: "urgent", source: "FinCEN",
    headline: "BOI reporting reinstated — new deadlines",
    detail: "3 of your business entities must file. Petal drafted the reports; review before submitting.",
    href: "/os/tasks",
  },
  {
    tone: "alert", source: "IRS",
    headline: "1099-K threshold drops to $2,500 for 2025",
    detail: "Affects 4 clients with payment-app income. Petal flagged the returns that need a second look.",
    href: "/os/clients",
  },
  {
    tone: "info", source: "CA FTB",
    headline: "2025 estimated-payment safe harbor unchanged",
    detail: "Your safe-harbor math holds — no client action needed this quarter.",
  },
  {
    tone: "alert",
    headline: "Q1 estimates due in 14 days",
    detail: "9 clients haven't been reminded yet. Petal has the drafts ready when you are.",
    href: "/os/tasks",
  },
  {
    tone: "win",
    headline: "Petal filed 3 returns clean yesterday",
    detail: "Pre-approved drafts, transmitted, IRS accepted — no exceptions, no amendments.",
    href: "/os/tasks",
  },
];
