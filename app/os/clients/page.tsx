"use client";

import { useState } from "react";
import Link from "next/link";
import {
  households, people, returns, entitiesOf, householdStage,
  kindLabel, stageLabels, type ReturnStage,
} from "@/lib/os-entities";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";

type View = "clients" | "returns" | "people";

const VIEWS: { key: View; label: string; count: number; newLabel: string }[] = [
  { key: "clients", label: "Entities", count: households.length, newLabel: "New entity" },
  { key: "returns", label: "Returns", count: returns.length, newLabel: "New return" },
  { key: "people", label: "People", count: people.length, newLabel: "New person" },
];

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

function HeaderRow({ cols, labels }: { cols: string; labels: string[] }) {
  return (
    <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-4 py-2", cols)}>
      {labels.map(h => <div key={h} className={cn("os-label", h === "Fee" && "text-right")}>{h}</div>)}
    </div>
  );
}

// ── Clients (Households) — Assembly CRM table composition ──
const CLIENT_COLS = "grid-cols-[minmax(240px,1.7fr)_minmax(140px,1fr)_148px_110px_140px_44px]";
// soft status pills (Assembly component style), bucketed by phase to stay restrained
const STAGE_PILL: Record<string, string> = {
  filed: "bg-emerald-50 text-emerald-700",
  pay_and_sign: "bg-blue-50 text-blue-700",
  client_review: "bg-blue-50 text-blue-700",
  in_preparation: "bg-amber-50 text-amber-700",
  ready_to_prep: "bg-amber-50 text-amber-700",
};
function ClientsTable() {
  return (
    <>
      <HeaderRow cols={CLIENT_COLS} labels={["Name", "Forms", "Stage", "Created", "Tier", ""]} />
      <div className="flex-1 overflow-y-auto">
        {households.map(h => {
          const ents = entitiesOf(h.id);
          const stage = householdStage(h.id);
          const person = people.find(p => p.householdId === h.id);
          return (
            <Link key={h.id} href={`/os/clients/${h.id}`} className={cn("grid h-[60px] items-center gap-x-4 border-b border-[var(--os-border)] px-4 transition-colors hover:bg-[var(--os-hover)]", CLIENT_COLS)}>
              {/* Name */}
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[11px] font-medium text-[var(--os-ink-muted)]">{initials(h.name)}</span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{h.name}</div>
                  <div className="truncate text-[12px] text-[var(--os-ink-subtle)]">{person?.email ?? kindLabel[h.kind]}</div>
                </div>
              </div>
              {/* Entities */}
              <div className="flex min-w-0 items-center gap-1">
                {ents.slice(0, 3).map(e => (
                  <span key={e.id} className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-muted)]">{e.form}</span>
                ))}
                {ents.length > 3 && <span className="text-[11px] text-[var(--os-ink-subtle)]">+{ents.length - 3}</span>}
              </div>
              {/* Stage — soft pill */}
              <div>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", STAGE_PILL[stage] || "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>{stageLabels[stage as ReturnStage] || stage}</span>
              </div>
              {/* Created */}
              <div className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">{h.since}</div>
              {/* Tier — outline pill */}
              <div>
                <span className="inline-flex items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)]">{h.serviceTier}</span>
              </div>
              {/* actions */}
              <button onClick={e => e.preventDefault()} className="grid size-7 place-items-center justify-self-end rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.more} size={16} /></button>
            </Link>
          );
        })}
      </div>
    </>
  );
}

// ── Returns — stage, form, document progress, fee (the work-state of a return) ──
const RETURN_COLS = "grid-cols-[minmax(240px,1.7fr)_148px_88px_150px_104px_44px]";
function ReturnsTable() {
  return (
    <>
      <HeaderRow cols={RETURN_COLS} labels={["Return", "Stage", "Form", "Documents", "Fee", ""]} />
      <div className="flex-1 overflow-y-auto">
        {returns.map(r => {
          const complete = r.docsSubmitted >= r.docsRequired;
          const pct = Math.round((r.docsSubmitted / r.docsRequired) * 100);
          return (
            <Link key={r.id} href={`/os/clients/${r.householdId}`} className={cn("grid h-[60px] items-center gap-x-4 border-b border-[var(--os-border)] px-4 transition-colors hover:bg-[var(--os-hover)]", RETURN_COLS)}>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(r.entityName)}</span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{r.entityName}</div>
                  <div className="truncate text-[12px] text-[var(--os-ink-subtle)]">{r.householdName} · {r.year}</div>
                </div>
              </div>
              <div>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", STAGE_PILL[r.stage] || "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>{stageLabels[r.stage as ReturnStage] || r.stage}</span>
              </div>
              <div>
                <span className="inline-flex rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{r.form}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--os-selected)]"><div className="h-full rounded-full bg-[var(--os-ink-muted)]" style={{ width: `${pct}%` }} /></div>
                <span className={cn("text-[11px] tabular-nums", complete ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{r.docsSubmitted}/{r.docsRequired}</span>
              </div>
              <div className="text-right text-[13px] font-medium tabular-nums text-[var(--os-ink)]">${r.fee.toLocaleString()}</div>
              <button onClick={e => e.preventDefault()} className="grid size-7 place-items-center justify-self-end rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.more} size={16} /></button>
            </Link>
          );
        })}
      </div>
    </>
  );
}

// ── People (Contacts) — relationship + contact info, not tax-work fields ──
const PEOPLE_COLS = "grid-cols-[minmax(220px,1.6fr)_130px_minmax(160px,1.1fr)_150px_44px]";
function PeopleTable() {
  return (
    <>
      <HeaderRow cols={PEOPLE_COLS} labels={["Name", "Role", "Client", "Phone", ""]} />
      <div className="flex-1 overflow-y-auto">
        {people.map(p => (
          <Link key={p.id} href={`/os/clients/${p.householdId}`} className={cn("grid h-[60px] items-center gap-x-4 border-b border-[var(--os-border)] px-4 transition-colors hover:bg-[var(--os-hover)]", PEOPLE_COLS)}>
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(p.name)}</span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{p.name}</div>
                <div className="truncate text-[12px] text-[var(--os-ink-subtle)]">{p.email}</div>
              </div>
            </div>
            <div>
              <span className="inline-flex items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)]">{p.role}</span>
            </div>
            <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{p.householdName}</div>
            <div className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">{p.phone}</div>
            <button onClick={e => e.preventDefault()} className="grid size-7 place-items-center justify-self-end rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.more} size={16} /></button>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function ClientsPage() {
  const [view, setView] = useState<View>("clients");

  return (
    <div className="flex h-full flex-col">
      {/* object header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-4 py-2.5">
        <Icon icon={I.clients} size={17} className="text-[var(--os-ink-muted)]" />
        <h1 className="text-[15px] font-semibold os-display">Clients</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} className="text-[var(--os-ink-muted)]" /> Search</button>
          <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.eye} size={15} className="text-[var(--os-ink-muted)]" /> View</button>
          <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.download} size={15} className="text-[var(--os-ink-muted)]" /> Export</button>
          <button className="flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]">Create <Icon icon={I.chevronDown} size={14} /></button>
        </div>
      </div>

      {/* view switcher (the consolidated book — Households / Returns / People) */}
      <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-4">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={cn("relative flex items-center gap-1.5 px-2.5 py-2 text-[13px] transition-colors", view === v.key ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
          >
            {v.label}
            <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{v.count}</span>
            {view === v.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
          </button>
        ))}
      </div>

      {view === "clients" && <ClientsTable />}
      {view === "returns" && <ReturnsTable />}
      {view === "people" && <PeopleTable />}
    </div>
  );
}
