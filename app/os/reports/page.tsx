"use client";

import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { households, returns, OWNERS, stageLabels, healthMeta, type ReturnStage } from "@/lib/os-entities";

const STAGE_ORDER: ReturnStage[] = ["new_intake", "collecting_docs", "ready_to_prep", "in_preparation", "client_review", "pay_and_sign", "filed", "extended"];

function KpiCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
      <div className="text-[12px] text-[var(--os-ink-muted)]">{label}</div>
      <div className="mt-1 text-[24px] font-semibold tabular-nums os-display">{value}</div>
      <div className="mt-0.5 text-[11px] text-[var(--os-ink-subtle)]">{sub}</div>
    </div>
  );
}

function HBar({ label, value, max, display, color }: { label: string; value: number; max: number; display?: string; color?: string }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-[116px] shrink-0 truncate text-[12px] text-[var(--os-ink-muted)]">{label}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
        <div className={cn("h-full rounded-full", color || "bg-[var(--os-ink-subtle)]")} style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }} />
      </div>
      <div className="w-[60px] shrink-0 text-right text-[12px] font-medium tabular-nums text-[var(--os-ink)]">{display ?? value}</div>
    </div>
  );
}

function ReportCard({ title, source, children }: { title: string; source: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
      <div className="mb-3.5 flex items-center gap-2">
        <span className="text-[13px] font-medium text-[var(--os-ink)]">{title}</span>
        <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[11px] text-[var(--os-ink-muted)]">{source}</span>
        <button className="ml-auto grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)]"><Icon icon={I.more} size={15} /></button>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export default function ReportsPage() {
  // ── derive metrics ──
  const openReturns = returns.filter(r => r.stage !== "filed");
  const filed = returns.filter(r => r.stage === "filed");
  const feesBooked = returns.reduce((s, r) => s + r.fee, 0);

  const byStage = STAGE_ORDER.map(st => ({ label: stageLabels[st], value: returns.filter(r => r.stage === st).length })).filter(x => x.value > 0);
  const maxStage = Math.max(...byStage.map(x => x.value), 1);

  const tierOrder = ["Premium", "Standard", "Basic"] as const;
  const feesByTier = tierOrder.map(tier => {
    const hids = households.filter(h => h.serviceTier === tier).map(h => h.id);
    return { label: tier, value: returns.filter(r => hids.includes(r.householdId)).reduce((s, r) => s + r.fee, 0) };
  });
  const maxTier = Math.max(...feesByTier.map(x => x.value), 1);

  const ownerKeys = Array.from(new Set(returns.map(r => r.assignedTo)));
  const byOwner = ownerKeys.map(k => ({ label: (OWNERS[k] || "Unassigned").split(" ")[0], value: returns.filter(r => r.assignedTo === k).length }))
    .sort((a, b) => b.value - a.value);
  const maxOwner = Math.max(...byOwner.map(x => x.value), 1);

  const health = [
    { key: "low" as const, label: "Healthy", color: "bg-emerald-500" },
    { key: "high" as const, label: "Watch", color: "bg-amber-500" },
    { key: "urgent" as const, label: "At risk", color: "bg-red-500" },
  ].map(h => ({ ...h, value: households.filter(x => (x.healthUrgency === "low" || x.healthUrgency === "normal") ? h.key === "low" : x.healthUrgency === h.key).length }));
  const maxHealth = Math.max(...health.map(x => x.value), 1);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <button className="flex items-center gap-1 text-[15px] font-semibold os-display">
          Practice overview <Icon icon={I.chevronDown} size={15} className="text-[var(--os-ink-subtle)]" />
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.filter} size={15} /> Filter</button>
          <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.plus} size={15} /> Add report</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto max-w-[960px] space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Active clients" value={`${households.length}`} sub="across 5 preparers" />
            <KpiCard label="Open returns" value={`${openReturns.length}`} sub={`${filed.length} filed`} />
            <KpiCard label="Fees booked" value={`$${(feesBooked / 1000).toFixed(1)}k`} sub="this season" />
            <KpiCard label="Avg. per client" value={`$${Math.round(feesBooked / households.length).toLocaleString()}`} sub="across entities" />
          </div>

          {/* Report grid */}
          <div className="grid grid-cols-2 gap-4">
            <ReportCard title="Returns by stage" source="Returns">
              {byStage.map(s => <HBar key={s.label} label={s.label} value={s.value} max={maxStage} />)}
            </ReportCard>

            <ReportCard title="Fees by service tier" source="Returns">
              {feesByTier.map(t => <HBar key={t.label} label={t.label} value={t.value} max={maxTier} display={`$${t.value.toLocaleString()}`} />)}
            </ReportCard>

            <ReportCard title="Workload by preparer" source="Returns">
              {byOwner.map(o => <HBar key={o.label} label={o.label} value={o.value} max={maxOwner} display={`${o.value} returns`} />)}
            </ReportCard>

            <ReportCard title="Client health" source="Clients">
              {health.map(h => <HBar key={h.label} label={h.label} value={h.value} max={maxHealth} color={h.color} />)}
            </ReportCard>
          </div>
        </div>
      </div>
    </div>
  );
}
