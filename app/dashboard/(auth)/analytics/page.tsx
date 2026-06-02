"use client";

import { format } from "date-fns";
import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileWarningIcon,
  FilterIcon,
  MailIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PetalMark } from "@/components/petal-mark";
import { cn } from "@/lib/utils";
import {
  ACTIVE_CLIENTS_CURRENT,
  ACTIVE_CLIENTS_DELTA_PCT,
  ACTIVE_CLIENTS_TICK_LABELS,
  ACTIVE_CLIENTS_TREND,
  AI_ASSIST_BY_CATEGORY,
  AI_ASSIST_AVG_PCT,
  AVG_DAYS_TO_FILE_CURRENT,
  AVG_DAYS_TO_FILE_DELTA,
  AVG_DAYS_TO_FILE_TREND,
  EFILE_RATE_CURRENT,
  EFILE_RATE_DELTA,
  EFILE_RATE_TREND,
  FILING_READINESS_DELTA,
  FILING_READINESS_PCT,
  NOTICE_MANAGEMENT,
  PETAL_TIME_SAVED_CURRENT,
  PETAL_TIME_SAVED_DELTA_PCT,
  PETAL_TIME_SAVED_TREND,
  PIPELINE_VELOCITY,
  RESPONSE_TIME_CURRENT_HRS,
  RESPONSE_TIME_DELTA_HRS,
  RESPONSE_TIME_TREND,
  REVENUE_BY_SERVICE,
  REVENUE_TOTAL,
  STATUS_PILLS,
  TOP_SERVICE_LINES,
  WHY_IT_MATTERS,
  WORK_IN_PROGRESS,
} from "@/lib/analytics-mock-data";

// ═════════════════════════════════════════════════════════════════════════
// Page
// ═════════════════════════════════════════════════════════════════════════

export default function AnalyticsPage() {
  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Analytics</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Last 30 days <span className="mx-1.5 text-muted-foreground/40">·</span>
            Tax Season 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterChip label="Last 30 days" />
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <DownloadIcon className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* ── AI banner (links to triage queue) ── */}
      <Link
        href="/dashboard/triage"
        className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground/[0.05]">
            <PetalMark className="size-4 text-foreground/70" />
          </span>
          <div className="text-[13px]">
            <span className="font-medium">I found 18 ways</span>
            <span className="text-muted-foreground"> to improve filing readiness and response speed</span>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          Open queue <ArrowRightIcon className="size-3" />
        </span>
      </Link>

      {/* ── Row 1: Active clients + Filing readiness ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-0">
            <CardHeading title="Active clients" />
            <HeroStat
              value={String(ACTIVE_CLIENTS_CURRENT)}
              delta={ACTIVE_CLIENTS_DELTA_PCT}
              goodWhen="up"
            />
            <BarLineChart data={ACTIVE_CLIENTS_TREND} />
            <AxisLabels labels={ACTIVE_CLIENTS_TICK_LABELS} />
            <ChartFooter
              compareLabel="Compared to Apr 27 – May 3"
              chips={["Daily", "This week"]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-0">
            <CardHeading title="Filing readiness score" />
            <div className="flex items-center justify-center pt-2">
              <Donut
                segments={[{ pct: FILING_READINESS_PCT, color: "text-foreground/85" }]}
                centerValue={`${FILING_READINESS_PCT}%`}
                size={172}
                thickness={14}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <DeltaChip value={FILING_READINESS_DELTA} goodWhen="up" suffix="%" />
              <div className="text-[11px] text-muted-foreground">vs Apr 27 – May 3</div>
            </div>
            <ChartFooter chips={["This week"]} alignRight />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: AI-assisted prep + Avg days to file ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-0">
            <CardHeading
              title="AI-assisted return prep"
              subtitle={`${AI_ASSIST_AVG_PCT}% of returns prepped with Petal across categories`}
            />
            <CategoryBars data={AI_ASSIST_BY_CATEGORY} />
            <ChartFooter chips={["This week"]} alignRight />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-0">
            <CardHeading title="Average days to file" />
            <HeroStat
              value={String(AVG_DAYS_TO_FILE_CURRENT)}
              delta={AVG_DAYS_TO_FILE_DELTA}
              goodWhen="down"
              suffix=""
              subLabel="days to file"
            />
            <SimpleLineChart data={AVG_DAYS_TO_FILE_TREND} />
            <AxisLabels labels={["Apr 27", "May 4", "May 11", "May 17"]} />
            <ChartFooter
              compareLabel="Compared to prior 4 weeks"
              chips={["Last 4 weeks"]}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Top service lines (wide) + Why it matters ── */}
      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-8">
          <CardContent className="space-y-4 pt-0">
            <CardHeading
              title="Top service lines"
              subtitle="Based on active clients as % of total"
            />
            <ul className="space-y-3">
              {TOP_SERVICE_LINES.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-[12.5px] text-foreground/85">
                    {row.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/75"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-[12px] font-medium tabular-nums">
                    {row.pct}%
                  </span>
                </li>
              ))}
            </ul>
            <ChartFooter chips={["Active clients", "This month"]} alignLeft />
          </CardContent>
        </Card>

        <Card className="md:col-span-4 bg-muted/30">
          <CardContent className="flex h-full flex-col gap-4 pt-0">
            <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
              <PetalMark className="size-3 text-foreground/55" />
              Why it matters
            </div>
            <div>
              <div className="font-display text-[18px] leading-tight tracking-tight">
                {WHY_IT_MATTERS.headline}
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-foreground/75">
                {WHY_IT_MATTERS.body}
              </p>
            </div>
            <Link href={WHY_IT_MATTERS.ctaHref} className="mt-auto">
              <Button size="sm" variant="outline" className="w-full justify-center">
                {WHY_IT_MATTERS.ctaLabel} <ArrowRightIcon className="size-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Response time + WIP donut + E-file acceptance ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-4 pt-0">
            <CardHeading title="Client response time" subtitle="Median time to client reply" />
            <HeroStat
              value={`${RESPONSE_TIME_CURRENT_HRS}h`}
              delta={RESPONSE_TIME_DELTA_HRS}
              goodWhen="down"
              suffix="h"
            />
            <SimpleLineChart data={RESPONSE_TIME_TREND} />
            <AxisLabels labels={["Apr 27", "May 4", "May 11", "May 17"]} />
            <ChartFooter compareLabel="Compared to prior 4 weeks" chips={["Last 4 weeks"]} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-0">
            <CardHeading title="Work in progress" subtitle="All open workflows" />
            <div className="flex items-center justify-center pt-1">
              <Donut
                segments={WORK_IN_PROGRESS.segments.map((s) => ({ pct: s.pct, color: s.color }))}
                centerValue={String(WORK_IN_PROGRESS.total)}
                centerLabel="Total"
                size={148}
                thickness={12}
              />
            </div>
            <ul className="space-y-1.5">
              {WORK_IN_PROGRESS.segments.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-2 text-[11.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full bg-current", s.color)} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="tabular-nums text-foreground/80">{s.pct}%</span>
                </li>
              ))}
            </ul>
            <ChartFooter chips={["This week"]} alignRight />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-0">
            <CardHeading title="E-file acceptance rate" subtitle="Last 30 days" />
            <HeroStat
              value={`${EFILE_RATE_CURRENT}%`}
              delta={EFILE_RATE_DELTA}
              goodWhen="up"
              suffix="%"
            />
            <SimpleLineChart data={EFILE_RATE_TREND} />
            <AxisLabels labels={["Apr 27", "May 4", "May 11", "May 17"]} />
            <ChartFooter chips={["Last 30 days"]} alignRight />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: Revenue + Petal time saved ── */}
      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-7">
          <CardContent className="space-y-4 pt-0">
            <CardHeading
              title="Revenue by service line"
              subtitle={`$${(REVENUE_TOTAL / 1000).toFixed(0)}K this month`}
            />
            <ul className="space-y-3">
              {REVENUE_BY_SERVICE.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-[12.5px] text-foreground/85">
                    {row.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground/75"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[12px] font-medium tabular-nums">
                    ${(row.amount / 1000).toFixed(0)}K
                    <span className="ml-1 text-muted-foreground">({row.pct}%)</span>
                  </span>
                </li>
              ))}
            </ul>
            <ChartFooter chips={["This month"]} alignLeft />
          </CardContent>
        </Card>

        <Card className="md:col-span-5">
          <CardContent className="space-y-4 pt-0">
            <CardHeading title="Petal time saved" subtitle="Hours of work AI absorbed" />
            <HeroStat
              value={`${PETAL_TIME_SAVED_CURRENT}h`}
              delta={PETAL_TIME_SAVED_DELTA_PCT}
              goodWhen="up"
              suffix="%"
            />
            <SimpleLineChart data={PETAL_TIME_SAVED_TREND} />
            <AxisLabels labels={["Apr 27", "May 4", "May 11", "May 17"]} />
            <ChartFooter compareLabel="Compared to prior 4 weeks" chips={["Last 4 weeks"]} />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 6: Notice management + Pipeline velocity ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 pt-0">
            <CardHeading title="Notice management" subtitle="Last 30 days" />
            <ul className="divide-y divide-border/40">
              {NOTICE_MANAGEMENT.map((row) => (
                <li key={row.label} className="flex items-center gap-3 py-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                    <FileWarningIcon className="size-4 text-muted-foreground" />
                  </span>
                  <span className="flex-1 text-[13px] text-foreground/85">{row.label}</span>
                  <span className="font-display text-[16px] font-medium tabular-nums">{row.value}</span>
                  <span
                    className={cn(
                      "w-12 text-right text-[11.5px] font-medium tabular-nums",
                      row.isGood ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    {row.delta}
                  </span>
                </li>
              ))}
            </ul>
            <ChartFooter chips={["Last 30 days"]} alignRight />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-0">
            <CardHeading
              title="Pipeline velocity"
              subtitle="Avg days between stage transitions · bottleneck flagged"
            />
            <ul className="space-y-2.5">
              {PIPELINE_VELOCITY.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      row.isBottleneck ? "bg-red-500" : "bg-foreground/40"
                    )}
                  />
                  <span className="flex-1 truncate text-[12.5px] text-foreground/85">{row.label}</span>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        row.isBottleneck ? "bg-red-500/70" : "bg-foreground/60"
                      )}
                      style={{ width: `${Math.min(100, (row.days / 8) * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[12px] font-medium tabular-nums">
                    {row.days}d
                  </span>
                </li>
              ))}
            </ul>
            <ChartFooter chips={["Last 30 days"]} alignLeft />
          </CardContent>
        </Card>
      </div>

      {/* ── Status strip ── */}
      <div className="grid gap-2 border-t border-border/60 pt-4 sm:grid-cols-2 lg:grid-cols-5">
        {STATUS_PILLS.map((pill) => (
          <Link
            key={pill.label}
            href="/dashboard/clients"
            className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/30"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded bg-foreground/[0.04]">
              <ShieldCheckIcon className="size-3.5 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium">{pill.label}</div>
              <div className="truncate text-[10.5px] text-muted-foreground">
                <span className="font-medium tabular-nums text-foreground/80">{pill.value}</span>
                <span className="ml-1">{pill.sub}</span>
              </div>
            </div>
            <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
        <span>Data as of {format(new Date(), "MMMM d, yyyy")}</span>
        <span>All metrics are mock — wires to Convex in production</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Reusable card primitives
// ═════════════════════════════════════════════════════════════════════════

function CardHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pt-6">
      <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
      {subtitle && <p className="mt-1 text-[11.5px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function HeroStat({
  value,
  delta,
  goodWhen,
  suffix = "%",
  subLabel,
}: {
  value: string;
  delta: number;
  goodWhen: "up" | "down";
  suffix?: string;
  subLabel?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2.5">
        <span className="font-display text-[40px] font-medium leading-none tracking-tight tabular-nums md:text-[44px]">
          {value}
        </span>
        <DeltaChip value={delta} goodWhen={goodWhen} suffix={suffix} />
      </div>
      {subLabel && (
        <div className="mt-1 text-[12px] text-muted-foreground">{subLabel}</div>
      )}
    </div>
  );
}

function DeltaChip({
  value,
  goodWhen,
  suffix = "%",
}: {
  value: number;
  goodWhen: "up" | "down";
  suffix?: string;
}) {
  if (value === 0) return null;
  const isPositive = value > 0;
  const isGood = (goodWhen === "up" && isPositive) || (goodWhen === "down" && !isPositive);
  const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span
      className={cn(
        "flex items-baseline gap-0.5 text-[13px] font-medium",
        isGood ? "text-emerald-600" : "text-red-600"
      )}
    >
      <Icon className="size-3" />
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <button className="flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-muted">
      {label}
      <ChevronDownIcon className="size-3" />
    </button>
  );
}

function ChartFooter({
  compareLabel,
  chips,
  alignLeft,
  alignRight,
}: {
  compareLabel?: string;
  chips: string[];
  alignLeft?: boolean;
  alignRight?: boolean;
}) {
  const showCompare = compareLabel && !alignRight;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 pt-1",
        alignRight ? "justify-end" : "justify-between"
      )}
    >
      {showCompare && <span className="text-[11px] text-muted-foreground">{compareLabel}</span>}
      <div className={cn("flex items-center gap-1.5", alignLeft && "ml-0", alignRight && "ml-auto")}>
        {chips.map((c) => (
          <FilterChip key={c} label={c} />
        ))}
        <button
          className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Filter"
          aria-label="Filter"
        >
          <FilterIcon className="size-3.5" />
        </button>
        <button
          className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Download"
          aria-label="Download"
        >
          <DownloadIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function AxisLabels({ labels }: { labels: string[] }) {
  return (
    <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
      {labels.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Chart primitives
// ═════════════════════════════════════════════════════════════════════════

/**
 * Bars + dotted trend line (matches the Overview's ReadinessChart pattern).
 * Used for "Active clients" — the dense daily-bar look with a smoothed
 * dashed overlay that floats above the bars.
 */
function BarLineChart({ data }: { data: number[] }) {
  const W = 700;
  const H = 140;
  const PAD_TOP = 18;
  const PAD_BOT = 4;
  const LINE_OFFSET = 32;                 // line floats well above the bars (matches Overview)
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const slotW = W / data.length;
  const barW = Math.max(1.2, slotW * 0.4);
  const yFor = (v: number) => H - PAD_BOT - ((v - min) / range) * (H - PAD_TOP - PAD_BOT);

  // Heavy moving average (35-pt window) — matches Overview's smoothing strength
  const window = 17;
  const smoothed = data.map((_, i) => {
    const start = Math.max(0, i - window);
    const end = Math.min(data.length, i + window + 1);
    const slice = data.slice(start, end);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  // Subsample to 8 evenly-spaced control points → Catmull-Rom → Bezier
  // (fewer points = no wobble between adjacent days, just one flowing S)
  const SAMPLE = 8;
  const pts = Array.from({ length: SAMPLE }, (_, k) => {
    const idx = Math.round((k / (SAMPLE - 1)) * (smoothed.length - 1));
    return {
      x: idx * slotW + slotW / 2,
      y: Math.max(2, yFor(smoothed[idx]) - LINE_OFFSET),
    };
  });

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const p0 = pts[Math.max(0, i - 2)];
    const p1 = pts[i - 1];
    const p3 = pts[Math.min(pts.length - 1, i + 1)];
    const cp1x = p1.x + (p.x - p0.x) / 6;
    const cp1y = p1.y + (p.y - p0.y) / 6;
    const cp2x = p.x - (p3.x - p1.x) / 6;
    const cp2y = p.y - (p3.y - p1.y) / 6;
    return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, "");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full">
      {data.map((v, i) => {
        const x = i * slotW + slotW / 2;
        const y = yFor(v);
        const opacity = 0.3 + (i / (data.length - 1)) * 0.35;
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

/**
 * Simple smoothed line chart — Catmull-Rom Bezier over subsampled points,
 * no bars. Used for any trend that doesn't need daily-granularity bars
 * (response time, e-file rate, Petal time saved, avg days to file).
 */
function SimpleLineChart({ data }: { data: number[] }) {
  const W = 400;
  const H = 80;
  const PAD = 6;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - PAD - ((v - min) / range) * (H - PAD * 2),
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const p0 = pts[Math.max(0, i - 2)];
    const p1 = pts[i - 1];
    const p3 = pts[Math.min(pts.length - 1, i + 1)];
    const cp1x = p1.x + (p.x - p0.x) / 6;
    const cp1y = p1.y + (p.y - p0.y) / 6;
    const cp2x = p.x - (p3.x - p1.x) / 6;
    const cp2y = p.y - (p3.y - p1.y) / 6;
    return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, "");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-20 w-full">
      <path
        d={linePath}
        fill="none"
        stroke="rgba(40,40,40,0.85)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Single-value (one segment) OR multi-segment donut with center label.
 * Each segment is a stroked circle with stroke-dasharray + offset so segments
 * sit end-to-end around the ring.
 */
function Donut({
  segments,
  centerValue,
  centerLabel,
  size = 140,
  thickness = 12,
}: {
  segments: { pct: number; color: string }[];
  centerValue: string;
  centerLabel?: string;
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Base track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth={thickness}
        />
        {/* Segments */}
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              className={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-[26px] font-medium leading-none tabular-nums">{centerValue}</div>
        {centerLabel && (
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {centerLabel}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Vertical bar chart with one bar per category, label beneath each.
 * Used for "AI-assisted prep by category."
 */
function CategoryBars({ data }: { data: { label: string; pct: number }[] }) {
  const max = Math.max(...data.map((d) => d.pct));
  return (
    <div className="space-y-2">
      <div className="flex h-32 items-end gap-2">
        {data.map((d) => {
          const intensity = 0.4 + (d.pct / max) * 0.45;
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-muted-foreground">{d.pct}%</span>
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${(d.pct / max) * 100}%`,
                  background: `rgba(60,60,60,${intensity.toFixed(2)})`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 truncate text-center text-[10px] text-muted-foreground">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
