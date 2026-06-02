/**
 * Analytics mock data — derived from existing client roster where possible,
 * mock-generated for trend/historical metrics that don't exist in mock-data.ts.
 *
 * Design intent: every metric here would be a real query against the Convex
 * backend in production. Names + shapes are stable so the page can wire up
 * 1:1 when we connect.
 */

import { clients, type ReturnStage } from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────

const round = (n: number, d = 0) => {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
};

// ─── 1. Active clients trend (84 daily points, ~12 weeks) ─────────────
// Matches Overview's Filing-readiness chart density so the analogous chart
// looks like the same visual family.

const ACTIVE_CLIENTS_DAYS = 84;
export const ACTIVE_CLIENTS_TREND: number[] = Array.from({ length: ACTIVE_CLIENTS_DAYS }, (_, i) => {
  const t = i / (ACTIVE_CLIENTS_DAYS - 1);
  const base = 195 + 38 * (1 / (1 + Math.exp(-7 * (t - 0.45)))); // S-curve 195 → 233
  const weekly = Math.sin(i * 0.9) * 2.2;
  const jitter = ((i * 23) % 11) / 2 - 2.5;
  return Math.max(180, Math.round(base + weekly + jitter));
});
export const ACTIVE_CLIENTS_CURRENT = ACTIVE_CLIENTS_TREND[ACTIVE_CLIENTS_TREND.length - 1];
export const ACTIVE_CLIENTS_PREV = ACTIVE_CLIENTS_TREND[0];
export const ACTIVE_CLIENTS_DELTA_PCT = round(
  ((ACTIVE_CLIENTS_CURRENT - ACTIVE_CLIENTS_PREV) / ACTIVE_CLIENTS_PREV) * 100
);

/** 6 evenly spaced axis labels ending today (2026-05-24) — Mar 2 → May 24 */
export const ACTIVE_CLIENTS_TICK_LABELS: string[] = (() => {
  const end = new Date(2026, 4, 24);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (ACTIVE_CLIENTS_DAYS - 1) + Math.round((i / 5) * (ACTIVE_CLIENTS_DAYS - 1)));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
})();

// ─── 2. Filing readiness score ────────────────────────────────────────

export const FILING_READINESS_PCT = 68;
export const FILING_READINESS_DELTA = 3; // points

// ─── 3. AI-assisted return prep (% prepped with Petal, per category) ──

export const AI_ASSIST_BY_CATEGORY: { label: string; pct: number }[] = [
  { label: "Intake",      pct: 92 },
  { label: "Bookkeeping", pct: 78 },
  { label: "1040",        pct: 88 },
  { label: "1065",        pct: 65 },
  { label: "1120S",       pct: 71 },
  { label: "Notices",     pct: 95 },
  { label: "Review",      pct: 82 },
  { label: "Extensions",  pct: 100 },
];
export const AI_ASSIST_AVG_PCT = Math.round(
  AI_ASSIST_BY_CATEGORY.reduce((s, c) => s + c.pct, 0) / AI_ASSIST_BY_CATEGORY.length
);

// ─── 4. Average days to file (weekly trend) ───────────────────────────

export const AVG_DAYS_TO_FILE_TREND: number[] = [3.4, 3.2, 3.1, 2.9, 2.8, 2.7, 2.6];
export const AVG_DAYS_TO_FILE_CURRENT = AVG_DAYS_TO_FILE_TREND[AVG_DAYS_TO_FILE_TREND.length - 1];
export const AVG_DAYS_TO_FILE_DELTA = round(
  AVG_DAYS_TO_FILE_CURRENT - AVG_DAYS_TO_FILE_TREND[0],
  1
);

// ─── 5. Top service lines (% of roster) ───────────────────────────────

export const TOP_SERVICE_LINES = (() => {
  // Derive from real client data (using filing-type mapping from ClientCard)
  let simple = 0,
    complex = 0,
    business = 0;
  for (const c of clients) {
    if (c.type === "business") business++;
    else if (c.serviceTier === "Basic") simple++;
    else complex++;
  }
  // Augment with non-tax service lines (mock — these clients aren't in roster)
  const bookkeeping = 4;
  const payroll = 3;
  const advisory = 1;
  const total = simple + complex + business + bookkeeping + payroll + advisory;
  return [
    { label: "Individual Tax",  count: complex,     pct: Math.round((complex / total) * 100) },
    { label: "Business Tax",    count: business,    pct: Math.round((business / total) * 100) },
    { label: "Bookkeeping",     count: bookkeeping, pct: Math.round((bookkeeping / total) * 100) },
    { label: "Payroll",         count: payroll,     pct: Math.round((payroll / total) * 100) },
    { label: "Advisory",        count: advisory,    pct: Math.round((advisory / total) * 100) },
    { label: "Simple Tax",      count: simple,      pct: Math.round((simple / total) * 100) },
  ].sort((a, b) => b.pct - a.pct);
})();

// ─── 6. Why-it-matters narrative (the Petal callout) ──────────────────

export const WHY_IT_MATTERS = {
  headline: "Individual tax dominates your roster",
  body:
    "62% of your clients are individual tax returns. Bookkeeping and advisory together represent only 12% of revenue — adding 5 monthly bookkeeping clients could lift annual revenue by ~$24K with no extra prep work during tax season.",
  ctaLabel: "Explore advisory pipeline",
  ctaHref: "/dashboard/clients",
};

// ─── 7. Client response time (weekly trend, hours) ────────────────────

export const RESPONSE_TIME_TREND: number[] = [22, 19, 21, 17, 16, 15, 14];
export const RESPONSE_TIME_CURRENT_HRS = RESPONSE_TIME_TREND[RESPONSE_TIME_TREND.length - 1];
export const RESPONSE_TIME_DELTA_HRS = RESPONSE_TIME_CURRENT_HRS - RESPONSE_TIME_TREND[0];

// ─── 8. Work in progress (donut segments by stage bucket) ─────────────

export const WORK_IN_PROGRESS = (() => {
  let inProgress = 0,
    waiting = 0,
    pending = 0,
    ready = 0;
  for (const c of clients) {
    const s: ReturnStage = c.returnStage;
    if (s === "in_preparation" || s === "ready_to_prep") inProgress++;
    else if (s === "collecting_docs" || s === "new_intake") waiting++;
    else if (s === "client_review") pending++;
    else if (s === "pay_and_sign") ready++;
  }
  const total = inProgress + waiting + pending + ready;
  const safeTotal = total || 1;
  return {
    total,
    segments: [
      { label: "In progress",       count: inProgress, pct: Math.round((inProgress / safeTotal) * 100), color: "text-foreground/80" },
      { label: "Waiting on client", count: waiting,    pct: Math.round((waiting    / safeTotal) * 100), color: "text-amber-500/70" },
      { label: "Pending review",    count: pending,    pct: Math.round((pending    / safeTotal) * 100), color: "text-blue-500/70" },
      { label: "Ready to file",     count: ready,      pct: Math.round((ready      / safeTotal) * 100), color: "text-emerald-500/70" },
    ],
  };
})();

// ─── 9. E-file acceptance rate (weekly trend, %) ──────────────────────

export const EFILE_RATE_TREND: number[] = [95, 96, 97, 97, 98, 98, 98];
export const EFILE_RATE_CURRENT = EFILE_RATE_TREND[EFILE_RATE_TREND.length - 1];
export const EFILE_RATE_DELTA = EFILE_RATE_CURRENT - EFILE_RATE_TREND[0];

// ─── 10. Revenue by service line (this month, $) ──────────────────────

export const REVENUE_BY_SERVICE: { label: string; amount: number; pct: number }[] = (() => {
  const raw = [
    { label: "Individual Tax", amount: 124000 },
    { label: "Business Tax",   amount: 86000 },
    { label: "Advisory",       amount: 32000 },
    { label: "Bookkeeping",    amount: 21000 },
    { label: "Other",          amount: 9000 },
  ];
  const total = raw.reduce((s, r) => s + r.amount, 0);
  return raw.map((r) => ({ ...r, pct: Math.round((r.amount / total) * 100) }));
})();
export const REVENUE_TOTAL = REVENUE_BY_SERVICE.reduce((s, r) => s + r.amount, 0);

// ─── 11. Petal time saved (weekly trend, hours) ───────────────────────

export const PETAL_TIME_SAVED_TREND: number[] = [32, 35, 38, 41, 44, 46, 47];
export const PETAL_TIME_SAVED_CURRENT = PETAL_TIME_SAVED_TREND[PETAL_TIME_SAVED_TREND.length - 1];
export const PETAL_TIME_SAVED_DELTA_PCT = Math.round(
  ((PETAL_TIME_SAVED_CURRENT - PETAL_TIME_SAVED_TREND[0]) / PETAL_TIME_SAVED_TREND[0]) * 100
);

// ─── 12. Notice management ────────────────────────────────────────────

export const NOTICE_MANAGEMENT: {
  label: string;
  value: string;
  delta: string;
  isGood: boolean;
}[] = [
  { label: "Notices received",       value: "14",  delta: "-8%",  isGood: true  }, // fewer is good
  { label: "Notices resolved",       value: "12",  delta: "+15%", isGood: true  }, // more is good
  { label: "Avg. days to resolve",   value: "4.2", delta: "+1.1", isGood: false }, // longer is bad
];

// ─── 13. Pipeline velocity (avg days per stage transition) ────────────

export const PIPELINE_VELOCITY: { label: string; days: number; isBottleneck: boolean }[] = [
  { label: "New intake → Collecting",  days: 2.3, isBottleneck: false },
  { label: "Collecting → Ready",        days: 6.1, isBottleneck: true  },
  { label: "Ready → In prep",           days: 1.2, isBottleneck: false },
  { label: "In prep → Client review",   days: 3.4, isBottleneck: false },
  { label: "Client review → Pay/sign",  days: 5.2, isBottleneck: false },
  { label: "Pay/sign → Filed",          days: 1.8, isBottleneck: false },
];
export const PIPELINE_VELOCITY_TOTAL = PIPELINE_VELOCITY.reduce((s, p) => s + p.days, 0);

// ─── Status strip (bottom of page) ────────────────────────────────────

export const STATUS_PILLS: { label: string; value: string; sub: string }[] = [
  { label: "Filing readiness",     value: `${FILING_READINESS_PCT}%`, sub: "on track" },
  { label: "Returns at risk",       value: "12",                       sub: "needs attention" },
  { label: "AI drafts pending",     value: "18",                       sub: "ready to approve" },
  { label: "Returns on extension",  value: "14",                       sub: "to Oct 15" },
  { label: "Open notices",          value: "2",                        sub: "in triage" },
];
