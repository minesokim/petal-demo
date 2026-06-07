"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { returns, OWNERS, stageLabels, stageDotStyles, type ReturnStage } from "@/lib/os-entities";
import { checklistFor } from "@/lib/os-documents";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";

const money = (n: number) => `$${n.toLocaleString()}`;

function StageTag({ stage }: { stage: ReturnStage }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
      <span className={cn("size-1.5 rounded-full", (stageDotStyles as Record<string, string>)[stage] || "bg-stone-400")} />
      {stageLabels[stage] || stage}
    </span>
  );
}

export default function ReturnPage() {
  const params = useParams();
  const r = returns.find(x => x.id === params.id);
  if (!r) return <div className="p-8 text-[13px] text-[var(--os-ink-muted)]">Return not found.</div>;

  const owner = OWNERS[r.assignedTo] || "Unassigned";
  const items = checklistFor(r.form);
  const received = Math.min(r.docsSubmitted, items.length);
  const missing = Math.max(0, items.length - received);
  const pct = Math.round((r.docsSubmitted / r.docsRequired) * 100);
  const summary = `${r.entityName}'s ${r.year} ${r.form} is in ${stageLabels[r.stage] || r.stage}. ${r.docsSubmitted} of ${r.docsRequired} documents are in${missing > 0 ? `, ${missing} still outstanding` : ""}. Fee ${money(r.fee)}${r.depositPaid ? ", deposit paid" : ", deposit not collected"}.`;

  return (
    <div className="flex h-full flex-col">
      {/* breadcrumb header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Link href="/os/clients" className="text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]">Clients</Link>
        <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
        <Link href={`/os/clients/${r.householdId}`} className="text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]">{r.householdName}</Link>
        <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
        <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{r.form}</span>
        <span className="text-[13px] font-semibold text-[var(--os-ink)]">{r.entityName} · {r.year}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/os/tasks" className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.trigger} size={14} className="text-[var(--os-ink-muted)]" /> Review draft</Link>
          <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><PetalMark className="size-3.5" /> Run skill</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[820px] space-y-6">
          {/* Petal summary */}
          <div className="rounded-lg bg-[var(--os-bg-subtle)] p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Catch me up</div>
            <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{summary}</p>
          </div>

          {/* return attrs */}
          <section>
            <div className="os-label mb-2">Return</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([["Form", r.form], ["Year", String(r.year)], ["Fee", money(r.fee)], ["Deposit", r.depositPaid ? "Paid" : "Not collected"]] as const).map(([label, val]) => (
                <div key={label} className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-3">
                  <div className="text-[11px] text-[var(--os-ink-muted)]">{label}</div>
                  <div className="mt-1 text-[15px] font-semibold tabular-nums os-display text-[var(--os-ink)]">{val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* stage + document progress */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <div className="os-label">Stage</div>
              <StageTag stage={r.stage} />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3.5 py-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]"><div className="h-full rounded-full bg-[var(--os-ink-muted)]" style={{ width: `${pct}%` }} /></div>
              <span className={cn("shrink-0 text-[12px] tabular-nums", received >= items.length ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{r.docsSubmitted}/{r.docsRequired} docs</span>
            </div>
          </section>

          {/* documents checklist */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <div className="os-label">Documents</div>
              {missing > 0 && <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--os-ink-subtle)]"><PetalMark className="size-3" /> Doc Chase is chasing {missing}</span>}
            </div>
            <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
              {items.map((it, i) => {
                const has = i < received;
                return (
                  <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5">
                    {has
                      ? <Icon icon={I.check} size={15} className="shrink-0 text-emerald-600" />
                      : <span className="size-[15px] shrink-0 rounded-full border-[1.5px] border-amber-400" />}
                    <span className="text-[13px] text-[var(--os-ink)]">{it.label}</span>
                    {it.note && <span className="text-[11px] text-[var(--os-ink-subtle)]">{it.note}</span>}
                    <span className={cn("ml-auto text-[12px]", has ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{has ? "Extracted" : "Requested"}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* assignment */}
          <section>
            <div className="os-label mb-2">Assignment</div>
            <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
              <div className="flex items-center justify-between px-3.5 py-2.5"><span className="text-[12px] text-[var(--os-ink-muted)]">Preparer</span><span className="text-[13px] text-[var(--os-ink)]">{owner}</span></div>
              <Link href={`/os/clients/${r.householdId}`} className="flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]"><span className="text-[12px] text-[var(--os-ink-muted)]">Household</span><span className="flex items-center gap-1 text-[13px] text-[var(--os-ink)]">{r.householdName} <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" /></span></Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
