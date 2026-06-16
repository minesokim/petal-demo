"use client";

// Practice - where the firm stands. Every KPI and chart derives from
// lib/fixtures/derive at render time; the Client health card calls the same
// clientHealth() that powers Today's at-risk module, so the two always agree.

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  STAGE_ORDER, stageMeta, healthMeta, money, DEMO_DATE_LABEL, type Health,
} from "@/lib/fixtures/vocab";
import { households, engagements, FIRM_PROFILE, type Household } from "@/lib/fixtures/firm";
import {
  activeEngagements, feesBooked, feesBlockedByDocs, stageCounts, healthCounts, invoiceOf, docsOf,
} from "@/lib/fixtures/derive";

const TAX_YEAR = engagements[0].taxYear;
const TIER_ORDER: Household["serviceTier"][] = ["Premium", "Standard", "Basic"];
const HEALTH_ORDER: Health[] = ["at_risk", "watch", "healthy"];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
      <div className="text-[12px] text-[var(--os-ink-muted)]">{label}</div>
      <div className="mt-1 text-[24px] font-semibold tabular-nums os-display">{value}</div>
      <div className="mt-0.5 text-[11px] text-[var(--os-ink-subtle)]">{sub}</div>
    </div>
  );
}

function HBar({
  label, sub, dot, value, max, display, color, href,
}: {
  label: string;
  sub?: string;
  dot?: string;
  value: number;
  max: number;
  display?: string;
  color?: string;
  href?: string;
}) {
  const pct = max ? (value / max) * 100 : 0;
  const row = (
    <>
      <div className="w-[124px] shrink-0">
        <div className="flex items-center gap-1.5">
          {dot && <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />}
          <span className={cn("truncate text-[12px] text-[var(--os-ink-muted)]", href && "group-hover:text-[var(--os-ink)]")}>{label}</span>
        </div>
        {sub && <div className="truncate text-[10px] text-[var(--os-ink-subtle)]">{sub}</div>}
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
        <div
          className={cn("h-full rounded-full", color || "bg-[var(--os-ink-subtle)]")}
          style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
        />
      </div>
      <div className="w-[72px] shrink-0 text-right text-[12px] font-medium tabular-nums text-[var(--os-ink)]">{display ?? value}</div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn("group -mx-2 flex items-center gap-3 rounded-md px-2 py-1 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
        {row}
      </Link>
    );
  }
  return <div className="flex items-center gap-3">{row}</div>;
}

function ReportCard({ title, source, foot, children }: { title: string; source: string; foot?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
      <div className="mb-3.5 flex items-center gap-2">
        <span className="text-[13px] font-medium text-[var(--os-ink)]">{title}</span>
        <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[11px] text-[var(--os-ink-muted)]">{source}</span>
      </div>
      <div className="space-y-2.5">{children}</div>
      {foot && <div className="mt-3.5 border-t border-[var(--os-border)] pt-2.5 text-[11px] text-[var(--os-ink-subtle)]">{foot}</div>}
    </div>
  );
}

export default function PracticePage() {
  const open = activeEngagements();
  const blockedCount = open.filter(e => docsOf(e.id).requested > 0).length;

  const sc = stageCounts();
  const maxStage = Math.max(...STAGE_ORDER.map(s => sc[s]), 1);

  const feesByTier = TIER_ORDER.map(tier => ({
    tier,
    value: households.filter(h => h.serviceTier === tier).reduce((s, h) => s + invoiceOf(h.id).invoiced, 0),
  }));
  const maxTier = Math.max(...feesByTier.map(t => t.value), 1);

  const antonio = FIRM_PROFILE.owner.name.split(" ")[0];
  const elena = FIRM_PROFILE.admin.name.split(" ")[0];
  const maxWork = Math.max(engagements.length, households.length, 1);

  const hc = healthCounts();
  const maxHealth = Math.max(...HEALTH_ORDER.map(h => hc[h]), 1);

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="border-b border-[var(--os-border)] px-5 pt-6 pb-5 md:px-8">
        <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Practice</h1>
        <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Where the practice stands as of {DEMO_DATE_LABEL}.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-[960px] space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <KpiCard label="Active clients" value={`${households.length}`} sub={`${antonio} + ${elena}`} />
            <KpiCard label="Open returns" value={`${open.length}`} sub="extension season" />
            <KpiCard label="Fees booked" value={money(feesBooked())} sub={`tax year ${TAX_YEAR}`} />
            <KpiCard
              label="Fees blocked by missing docs"
              value={money(feesBlockedByDocs())}
              sub={`${blockedCount} return${blockedCount === 1 ? "" : "s"} waiting on documents`}
            />
          </div>

          {/* Report grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ReportCard title="Returns by stage" source="Returns" foot="Each row opens the board filtered to that stage.">
              {STAGE_ORDER.map(s => (
                <HBar
                  key={s}
                  label={stageMeta[s].label}
                  value={sc[s]}
                  max={maxStage}
                  href={`/os/returns?stage=${s}`}
                />
              ))}
            </ReportCard>

            <ReportCard title="Fees by service tier" source="Billing">
              {feesByTier.map(t => (
                <HBar key={t.tier} label={t.tier} value={t.value} max={maxTier} display={money(t.value)} />
              ))}
            </ReportCard>

            <ReportCard title="Workload" source="Returns" foot={`${antonio} prepares every return; ${elena} covers admin across all clients.`}>
              <HBar
                label={antonio}
                sub="preparer of record"
                value={engagements.length}
                max={maxWork}
                display={`${engagements.length} returns`}
              />
              <HBar
                label={elena}
                sub="intake · docs · billing follow-up"
                value={households.length}
                max={maxWork}
                display={`${households.length} clients`}
              />
            </ReportCard>

            <ReportCard title="Client health" source="Clients" foot="The same assessment that builds Today's at-risk list.">
              {HEALTH_ORDER.map(h => (
                <HBar
                  key={h}
                  label={healthMeta[h].label}
                  dot={healthMeta[h].dot}
                  value={hc[h]}
                  max={maxHealth}
                  color={healthMeta[h].dot}
                  display={`${hc[h]} client${hc[h] === 1 ? "" : "s"}`}
                />
              ))}
            </ReportCard>
          </div>
        </div>
      </div>
    </div>
  );
}
