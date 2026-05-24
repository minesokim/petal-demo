"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronRightIcon, ChevronDownIcon, CalendarIcon, MessageSquareIcon,
  ArrowRightIcon, ArrowUpIcon, ShieldCheckIcon, FileTextIcon, EyeIcon, FileWarningIcon,
  AlertCircleIcon, PenIcon, MailIcon,
} from "lucide-react";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { clients, type Client } from "@/lib/mock-data";
import { PetalMark } from "@/components/petal-mark";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/toast-notification";
import { cn } from "@/lib/utils";

// ─── Mock content for the Command Center cards ───

const todayAppointments = [
  { name: "Sarah Mitchell", avatar: "/images/avatars/10.png", time: "10:00 AM", note: "New client intro call", clientId: "c21" },
  { name: "David Park", avatar: "/images/avatars/11.png", time: "3:00 PM", note: "S-Corp return review", clientId: "c11" },
  { name: "Miguel Sandoval", avatar: "/images/avatars/09.png", time: "4:00 PM", note: "Discuss incorporation", clientId: "c9" },
];

const recentMessages = [
  { name: "Priya Sharma", avatar: "/images/avatars/02.png", message: "I have my TikTok 1099 but I'm not sure how to upload it.", time: "2:30 PM" },
  { name: "David Park", avatar: "/images/avatars/11.png", message: "Can we push the call to 3pm?", time: "8:15 AM" },
  { name: "Carlos & Elena Mendez", avatar: "/images/avatars/03.png", message: "Elena wants to know about the paint booth deduction.", time: "Yesterday" },
];

// ─── Team activity: workload distribution across Antonio's team — Petal AI counted as a member ───
type TeamMember = {
  name: string;
  role: string;
  initials: string;
  avatar?: string;
  returns: number;
  isAI: boolean;
};
const TEAM_MEMBERS: TeamMember[] = [
  { name: "Petal",            role: "AI · across all clients",        initials: "P",  returns: 86, isAI: true },
  { name: "Antonio Vazquez",  role: "EA · owner",                     initials: "AV", avatar: "/images/avatars/04.png", returns: 28, isAI: false },
  { name: "Maria Rodriguez",  role: "Bookkeeper · part-time",         initials: "MR", avatar: "/images/avatars/05.png", returns: 12, isAI: false },
  { name: "James Chen",       role: "Junior preparer · seasonal",     initials: "JC", avatar: "/images/avatars/06.png", returns: 9,  isAI: false },
];
const TEAM_MAX = Math.max(...TEAM_MEMBERS.map(m => m.returns));

// ─── Filing-readiness 84-day daily trend (deterministic, sigmoid + weekly oscillation) ───
const READINESS_DAYS = 84;
const READINESS_TREND: number[] = Array.from({ length: READINESS_DAYS }, (_, i) => {
  const t = i / (READINESS_DAYS - 1);
  const base = 22 + 48 * (1 / (1 + Math.exp(-7 * (t - 0.45))));   // S-curve growth 22 → 70
  const weekly = Math.sin(i * 0.9) * 2.2;                          // ~7-day oscillation
  const jitter = ((i * 23) % 11) / 2 - 2.5;                        // deterministic noise
  return Math.max(15, Math.min(80, Math.round((base + weekly + jitter) * 10) / 10));
});

// 6 evenly spaced x-axis labels ending today (2026-05-24)
const READINESS_TICK_LABELS: string[] = (() => {
  const end = new Date(2026, 4, 24);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (READINESS_DAYS - 1) + Math.round((i / 5) * (READINESS_DAYS - 1)));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
})();

/**
 * Bars + dotted trend line — matching the "Active clients" reference:
 * bars are spaced (40/60 bar/gap), the trend line is a SMOOTHED Catmull-Rom
 * curve OFFSET ABOVE the bars so the two visuals don't collide, and dashes
 * are true round dots (1px stroke + round caps + sparse gaps).
 */
function ReadinessChart({ data }: { data: number[] }) {
  const W = 700;
  const H = 140;
  const PAD_TOP = 18;
  const PAD_BOT = 4;
  const LINE_OFFSET = 32;                         // line floats above bars
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const slotW = W / data.length;
  const barW = Math.max(1.2, slotW * 0.4);        // thinner bars, more gap

  const yFor = (v: number) => H - PAD_BOT - ((v - min) / range) * (H - PAD_TOP - PAD_BOT);

  // Heavy moving average (17-pt window = 35-pt avg) flattens daily noise into a trend signal
  const window = 17;
  const smoothed = data.map((_, i) => {
    const start = Math.max(0, i - window);
    const end = Math.min(data.length, i + window + 1);
    const slice = data.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  // Subsample to 8 evenly-spaced control points so Catmull-Rom produces a flowing S,
  // not a wave that tracks every minor bump in the underlying data.
  const SAMPLE_COUNT = 8;
  const linePts = Array.from({ length: SAMPLE_COUNT }, (_, k) => {
    const idx = Math.round((k / (SAMPLE_COUNT - 1)) * (smoothed.length - 1));
    return {
      x: idx * slotW + slotW / 2,
      y: Math.max(2, yFor(smoothed[idx]) - LINE_OFFSET),
    };
  });

  // Catmull-Rom → cubic Bezier conversion for organic curvature
  const linePath = linePts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const p0 = linePts[Math.max(0, i - 2)];
    const p1 = linePts[i - 1];
    const p2 = p;
    const p3 = linePts[Math.min(linePts.length - 1, i + 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }, "");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-32 w-full"
      role="img"
      aria-label="Filing readiness — 84-day trend"
    >
      {data.map((v, i) => {
        const x = i * slotW + slotW / 2;
        const y = yFor(v);
        const opacity = 0.3 + (i / (data.length - 1)) * 0.35;   // subtle 0.30 → 0.65 ramp
        return (
          <rect
            key={i}
            x={x - barW / 2}
            y={y}
            width={barW}
            height={Math.max(0, H - PAD_BOT - y)}
            fill={`rgba(70,70,70,${opacity.toFixed(2)})`}
          />
        );
      })}
      <path
        d={linePath}
        fill="none"
        stroke="rgba(40,40,40,0.85)"
        strokeWidth="2"
        strokeDasharray="1 5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Page() {
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const { showToast } = useToast();

  // ─── Derive stats from real client data ───
  const stats = useMemo(() => {
    const total = clients.length;
    const filed = clients.filter(c => c.returnStage === "filed").length;
    const inPrep = clients.filter(c => c.returnStage === "in_preparation" || c.returnStage === "ready_to_prep").length;
    const collecting = clients.filter(c => c.returnStage === "collecting_docs").length;
    const review = clients.filter(c => c.returnStage === "client_review").length;
    const paySign = clients.filter(c => c.returnStage === "pay_and_sign").length;
    const newIntake = clients.filter(c => c.returnStage === "new_intake").length;
    const readinessPct = total > 0 ? Math.round(((filed + paySign + review + inPrep) / total) * 100) : 0;
    const atRisk = clients.filter(c => c.urgency === "high" || c.urgency === "urgent").slice(0, 3);
    const daysToDeadline = 42;
    // Workflow-stage order — clients move through these states in this sequence,
    // and Missing documents is the first place returns get stuck.
    const bottlenecks = [
      { label: "Missing documents", count: collecting, sub: `${collecting} reminders drafted` },
      { label: "Awaiting signature", count: paySign, sub: `${paySign} nudges scheduled` },
      { label: "In review", count: review + inPrep, sub: `${inPrep} with AI pre-review complete` },
      { label: "Notice response", count: 2, sub: "2 responses drafted" },
    ];
    const bottlenecksMax = Math.max(...bottlenecks.map(b => b.count), 1);
    return { total, filed, inPrep, collecting, review, paySign, newIntake, readinessPct, atRisk, daysToDeadline, bottlenecks, bottlenecksMax };
  }, []);

  // ─── Clients needing review today ───
  const needsReviewToday = useMemo(() => {
    return clients
      .filter(c => c.returnStage === "client_review" || c.returnStage === "pay_and_sign" || (c.urgency === "high" && c.returnStage === "in_preparation"))
      .slice(0, 5)
      .map(c => ({
        client: c,
        action: c.returnStage === "client_review" ? "Review return"
          : c.returnStage === "pay_and_sign" ? "Sign as ERO"
          : "Resolve flags",
        status: c.returnStage === "pay_and_sign" ? { label: "ERO ready", tone: "success" as const }
          : c.urgency === "urgent" ? { label: "urgent flag", tone: "danger" as const }
          : c.urgency === "high" ? { label: "high priority", tone: "warning" as const }
          : { label: "AI pre-review done", tone: "muted" as const },
        date: c.returnStage === "pay_and_sign" ? "Today" : c.returnStage === "client_review" ? "Today" : "Mar 8",
      }));
  }, []);

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Command Center</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Tax Season {new Date().getFullYear() + 1} <span className="text-muted-foreground/40">·</span> {stats.daysToDeadline} days left
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast("info", "Brief me", "Petal is generating your morning brief...")}
          >
            Brief me
          </Button>
          <Button
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={() => showToast("info", "Analytics", "Full firm analytics coming soon")}
          >
            View all analytics
          </Button>
        </div>
      </div>

      {/* ─── AI banner ─── */}
      <Link
        href="/dashboard/actions"
        className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground/[0.05]">
            <PetalMark className="size-4 text-foreground/70" />
          </span>
          <div className="text-[13px]">
            <span className="font-medium">Petal drafted 14 actions</span>
            <span className="text-muted-foreground"> ready for your review</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          Open queue <ArrowRightIcon className="size-3" />
        </span>
      </Link>

      {/* ─── Top hero row: Filing readiness (7) leads, Today's brief (5) on the right ─── */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* ── Today's brief ── (narrower — clickable narrative, sits on the right via md:order-2) */}
        <Card className="md:col-span-5 md:order-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-[15px] font-semibold">
              <PetalMark className="size-3.5 text-foreground/60" /> Today&apos;s brief
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ul className="space-y-1">
              {[
                {
                  tone: "urgent" as const,
                  headline: "Sarah Mitchell's S-Corp",
                  detail: "Q4 estimates are $2,800 short of safe harbor — review before her 10am intro call.",
                  href: "/dashboard/clients",
                },
                {
                  tone: "ready" as const,
                  headline: "ERO signing queue",
                  detail: "6 returns ready for your signature · 2 marked urgent by clients.",
                  href: "/dashboard/actions",
                },
                {
                  tone: "info" as const,
                  headline: "Petal worked overnight",
                  detail: "Drafted IRS notice responses for 3 clients · summarized 12 new intake forms.",
                  href: "/dashboard/actions",
                },
                {
                  tone: "alert" as const,
                  headline: "Doc-collection pile-up",
                  detail: "12 clients have been waiting on docs for >14 days · nudges ready to send.",
                  href: "/dashboard/clients",
                },
                {
                  tone: "win" as const,
                  headline: "Yesterday's wins",
                  detail: "8 returns filed · season pace +12% vs the same week last year.",
                  href: "/dashboard/actions",
                },
              ].map(item => (
                <li key={item.headline}>
                  <Link
                    href={item.href}
                    className="group -mx-2 flex gap-3 rounded-md p-2 transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", {
                        "bg-red-500": item.tone === "urgent",
                        "bg-emerald-500": item.tone === "ready",
                        "bg-amber-500": item.tone === "alert",
                        "bg-blue-500": item.tone === "win",
                        "bg-foreground/55": item.tone === "info",
                      })}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-foreground/90 transition-colors group-hover:text-foreground">
                        {item.headline}
                      </div>
                      <div className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                        {item.detail}
                      </div>
                    </div>
                    <ChevronRightIcon className="mt-1.5 size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard/actions"
              className="mt-auto flex items-center gap-1 pt-4 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Read full brief <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* ── Filing readiness ── (wider — chart + at-risk list, hero of the page via md:order-1) */}
        <Card className="md:col-span-7 md:order-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold">Filing readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Hero stat — big number + ↑ growth chip */}
            <div>
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-[44px] font-medium leading-none tracking-tight tabular-nums">
                  {stats.readinessPct}%
                </span>
                <span className="flex items-baseline gap-0.5 text-[13px] font-medium text-emerald-600">
                  <ArrowUpIcon className="size-3" /> 6%
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-[12.5px]">
                <span className="font-medium text-red-600">{stats.atRisk.length} returns at risk</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">+6 pts vs last week</span>
              </div>
            </div>

            {/* At-risk list — avatar + name + reason */}
            <ul className="space-y-1">
              {stats.atRisk.map(c => {
                const initials = c.fullName.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
                const reason = c.returnStage === "collecting_docs" ? `missing ${c.documentsRequired - c.documentsSubmitted} docs`
                  : c.returnStage === "pay_and_sign" ? "signature pending 3d"
                  : "position unresolved";
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setDetailClient(c)}
                      className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <Avatar className="size-7 shrink-0">
                        {c.avatar && <AvatarImage src={c.avatar} alt={c.fullName} />}
                        <AvatarFallback className="bg-foreground/10 text-[9px] font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="shrink-0 text-[12.5px] font-medium text-foreground/90">{c.fullName}</span>
                      <span className="shrink-0 text-muted-foreground/60">·</span>
                      <span className="truncate text-[12px] text-muted-foreground">{reason}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Chart — bars + dashed trend line, with x-axis tick labels */}
            <div className="space-y-1.5">
              <ReadinessChart data={READINESS_TREND} />
              <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                {READINESS_TICK_LABELS.map(label => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>

            {/* Compare + period chips — reference: "Compared to Apr 27 – May 3  Daily ▾  This week ▾" */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground">
                Compared to <span className="text-foreground/70">Dec 9 – Mar 1</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button className="flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted">
                  Daily <ChevronDownIcon className="size-3" />
                </button>
                <button className="flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-muted">
                  This week <ChevronDownIcon className="size-3" />
                </button>
              </div>
            </div>

            <Link
              href="/dashboard/clients"
              className="flex items-center gap-1 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              View all at-risk returns <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>

      </div>

      {/* ─── Second hero row: Workflow (5) + Team activity (7) — team distribution as the diagonal partner to Filing ─── */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* ── Workflow bottlenecks ── (chunky horizontal bars, big display numbers, sub-text right-aligned beneath) */}
        <Card className="md:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] font-semibold">Workflow bottlenecks</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ul className="space-y-7">
              {stats.bottlenecks.map(item => (
                <li key={item.label} className="space-y-1.5">
                  {/* Row: label / full bar / count at the right end of the bar */}
                  <div className="flex items-center gap-4">
                    <span className="w-36 shrink-0 text-[13px] text-foreground/85">{item.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground/85"
                        style={{ width: `${(item.count / stats.bottlenecksMax) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[17px] font-semibold leading-none tabular-nums">
                      {item.count}
                    </span>
                  </div>
                  {/* Caption beneath, right-aligned to row's right edge */}
                  <div className="text-right text-[11px] text-muted-foreground">{item.sub}</div>
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard/clients"
              className="mt-auto flex items-center gap-1 pt-6 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              View all bottlenecks <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* ── Team activity ── (Top-power-users pattern: avatar + role + horizontal bar + count, Petal counted as a member) */}
        <Card className="md:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] font-semibold">Team activity</CardTitle>
            <p className="text-[11.5px] text-muted-foreground">Returns touched · last 30 days</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ul className="space-y-4">
              {TEAM_MEMBERS.map(member => (
                <li key={member.name} className="flex items-center gap-3">
                  {member.isAI ? (
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]"
                      aria-label="Petal AI"
                    >
                      <PetalMark className="size-4 text-foreground/70" />
                    </div>
                  ) : (
                    <Avatar className="size-8 shrink-0">
                      {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                      <AvatarFallback className="bg-foreground/10 text-[10px] font-semibold">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="w-40 min-w-0 shrink-0">
                    <div className="truncate text-[13px] font-medium text-foreground/90">{member.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{member.role}</div>
                  </div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        member.isAI ? "bg-foreground/55" : "bg-foreground/85"
                      )}
                      style={{ width: `${(member.returns / TEAM_MAX) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[13px] font-medium tabular-nums">
                    {member.returns} <span className="text-[11px] font-normal text-muted-foreground">returns</span>
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard/pages/settings/profile"
              className="mt-auto flex items-center gap-1 pt-4 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Manage team <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ─── Third hero row: Needs review (7) leads, Defense (5) on the right via md:order-* ─── */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* ── Defense layer ── (narrower — sits on the right via md:order-2) */}
        <Card className="md:col-span-5 md:order-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold">Defense layer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { icon: ShieldCheckIcon, label: "Active audits", sub: "IRS examinations in progress", count: 1 },
              { icon: FileWarningIcon, label: "Notices in triage", sub: "Drafts ready for review", count: 2 },
              { icon: FileTextIcon, label: "Form 8867 due diligence", sub: "Checklists pending", count: 4 },
              { icon: EyeIcon, label: "8275 disclosures", sub: "Ready to file", count: 1 },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => showToast("info", item.label, "Coming soon")}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                  <item.icon className="size-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{item.label}</div>
                  <div className="text-[11.5px] text-muted-foreground">{item.sub}</div>
                </div>
                <span className="text-[14px] font-semibold tabular-nums">{item.count}</span>
                <ChevronRightIcon className="size-3.5 text-muted-foreground/60" />
              </button>
            ))}

            <Link
              href="/dashboard/clients"
              className="mt-2 flex items-center gap-1 px-2 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              View all defense items <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* ── Needs review today ── (wider — leads the row via md:order-1) */}
        <Card className="md:col-span-7 md:order-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] font-semibold">Needs review today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {needsReviewToday.map(({ client, action, status, date }) => {
              const initials = client.fullName.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
              const statusClasses = status.tone === "danger" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                : status.tone === "warning" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                : status.tone === "success" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-muted text-muted-foreground";
              return (
                <button
                  key={client.id}
                  onClick={() => setDetailClient(client)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/40"
                >
                  <Avatar className="size-9 shrink-0">
                    {client.avatar && <AvatarImage src={client.avatar} alt={client.fullName} />}
                    <AvatarFallback className="bg-foreground/10 text-[10px] font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{client.fullName}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate">
                      {client.businessName || client.serviceTier} <span className="text-muted-foreground/40">·</span> {action}
                    </div>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none", statusClasses)}>
                    {status.label}
                  </span>
                  <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">{date}</span>
                </button>
              );
            })}

            <Link
              href="/dashboard/clients"
              className="mt-2 flex items-center gap-1 px-2 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              View all reviews <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ─── Bottom 3-column row ─── */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* ── Upcoming meetings ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-[15px] font-semibold">
              <CalendarIcon className="size-3.5 text-muted-foreground" /> Upcoming meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {todayAppointments.map(appt => (
              <div key={appt.clientId} className="flex items-center gap-3 rounded-md px-1 py-2">
                <span className="w-16 shrink-0 text-[11.5px] font-medium tabular-nums text-muted-foreground">{appt.time}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium truncate">{appt.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{appt.note}</div>
                </div>
              </div>
            ))}
            <Link href="/dashboard/apps/calendar" className="mt-3 flex items-center gap-1 px-1 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground">
              View calendar <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* ── Recent messages ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-[15px] font-semibold">
              <MessageSquareIcon className="size-3.5 text-muted-foreground" /> Recent messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {recentMessages.map(msg => {
              const initials = msg.name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={msg.name} className="flex items-start gap-2.5 rounded-md px-1 py-2">
                  <Avatar className="size-7 shrink-0">
                    {msg.avatar && <AvatarImage src={msg.avatar} alt={msg.name} />}
                    <AvatarFallback className="bg-foreground/10 text-[9px] font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-medium truncate">{msg.name}</span>
                      <span className="shrink-0 text-[10.5px] text-muted-foreground tabular-nums">{msg.time}</span>
                    </div>
                    <div className="text-[11.5px] text-muted-foreground line-clamp-1">{msg.message}</div>
                  </div>
                </div>
              );
            })}
            <Link href="/dashboard/apps/chat" className="mt-3 flex items-center gap-1 px-1 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground">
              Go to inbox <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* ── Action center ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-[15px] font-semibold">
              <ShieldCheckIcon className="size-3.5 text-muted-foreground" /> Action center
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              { icon: PetalMark, label: "AI drafts awaiting approval", count: 11 },
              { icon: AlertCircleIcon, label: "Positions cited this week", count: 34 },
              { icon: PenIcon, label: "Evidence chains complete", count: 27 },
              { icon: FileWarningIcon, label: "Notices triaged", count: 8 },
              { icon: MailIcon, label: "Reversible actions pending", count: 4 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5 rounded-md px-1 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground">
                  <item.icon className="size-3.5" />
                </span>
                <span className="flex-1 truncate text-[12.5px] text-foreground/85">{item.label}</span>
                <span className="shrink-0 text-[13px] font-semibold tabular-nums">{item.count}</span>
              </div>
            ))}
            <Link href="/dashboard/actions" className="mt-3 flex items-center gap-1 px-1 text-[12px] font-medium text-foreground/80 transition-colors hover:text-foreground">
              View all actions <ArrowRightIcon className="size-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
        <span>© {new Date().getFullYear() + 1} Petal, Inc.</span>
        <span>Data as of {format(new Date(), "MMMM d, yyyy")}</span>
      </div>

      {/* Client detail dialog */}
      <ClientDetailDialog
        client={detailClient}
        open={!!detailClient}
        onOpenChange={(o) => !o && setDetailClient(null)}
      />
    </div>
  );
}
