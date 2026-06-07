"use client";

import { useState } from "react";
import Link from "next/link";
import {
  households, people, returns, entitiesOf, householdStage,
  kindLabel, stageLabels, type ReturnStage,
} from "@/lib/os-entities";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";

const ME = "u-antonio";

type View = "clients" | "returns" | "people";
type Layout = "list" | "board";
type Scope = "all" | "mine";

const VIEWS: { key: View; label: string }[] = [
  { key: "clients", label: "Entities" },
  { key: "returns", label: "Returns" },
  { key: "people", label: "People" },
];

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

// soft status pills, bucketed by phase to stay restrained
const STAGE_PILL: Record<string, string> = {
  filed: "bg-emerald-50 text-emerald-700",
  pay_and_sign: "bg-blue-50 text-blue-700",
  client_review: "bg-blue-50 text-blue-700",
  in_preparation: "bg-amber-50 text-amber-700",
  ready_to_prep: "bg-amber-50 text-amber-700",
};

// pipeline column order + dot color (kanban)
const BOARD_STAGES: ReturnStage[] = ["new_intake", "collecting_docs", "ready_to_prep", "in_preparation", "client_review", "pay_and_sign", "filed", "extended"];
const STAGE_DOT: Record<string, string> = {
  new_intake: "bg-[var(--os-ink-subtle)]",
  collecting_docs: "bg-amber-500",
  ready_to_prep: "bg-amber-500",
  in_preparation: "bg-blue-500",
  client_review: "bg-blue-500",
  pay_and_sign: "bg-violet-500",
  filed: "bg-emerald-500",
  extended: "bg-[var(--os-ink-subtle)]",
};

function HeaderRow({ cols, labels }: { cols: string; labels: string[] }) {
  return (
    <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-8 py-2", cols)}>
      {labels.map(h => <div key={h} className={cn("os-label", h === "Fee" && "text-right")}>{h}</div>)}
    </div>
  );
}

// ── Clients (Households) ──
const CLIENT_COLS = "grid-cols-[minmax(240px,1.7fr)_minmax(140px,1fr)_148px_110px_140px_44px]";
function ClientsTable({ rows }: { rows: typeof households }) {
  return (
    <>
      <HeaderRow cols={CLIENT_COLS} labels={["Name", "Forms", "Stage", "Created", "Tier", ""]} />
      <div className="flex-1 overflow-y-auto">
        {rows.map(h => {
          const ents = entitiesOf(h.id);
          const stage = householdStage(h.id);
          const person = people.find(p => p.householdId === h.id);
          return (
            <Link key={h.id} href={`/os/clients/${h.id}`} className={cn("grid h-[60px] items-center gap-x-4 border-b border-[var(--os-border)] px-8 transition-colors hover:bg-[var(--os-hover)]", CLIENT_COLS)}>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[11px] font-medium text-[var(--os-ink-muted)]">{initials(h.name)}</span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{h.name}</div>
                  <div className="truncate text-[12px] text-[var(--os-ink-subtle)]">{person?.email ?? kindLabel[h.kind]}</div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-1">
                {ents.slice(0, 3).map(e => (
                  <span key={e.id} className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-muted)]">{e.form}</span>
                ))}
                {ents.length > 3 && <span className="text-[11px] text-[var(--os-ink-subtle)]">+{ents.length - 3}</span>}
              </div>
              <div>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", STAGE_PILL[stage] || "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>{stageLabels[stage as ReturnStage] || stage}</span>
              </div>
              <div className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">{h.since}</div>
              <div>
                <span className="inline-flex items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)]">{h.serviceTier}</span>
              </div>
              <button onClick={e => e.preventDefault()} className="grid size-7 place-items-center justify-self-end rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.more} size={16} /></button>
            </Link>
          );
        })}
      </div>
    </>
  );
}

// ── Returns ──
const RETURN_COLS = "grid-cols-[minmax(240px,1.7fr)_148px_88px_150px_104px_44px]";
function ReturnsTable({ rows }: { rows: typeof returns }) {
  return (
    <>
      <HeaderRow cols={RETURN_COLS} labels={["Return", "Stage", "Form", "Documents", "Fee", ""]} />
      <div className="flex-1 overflow-y-auto">
        {rows.map(r => {
          const complete = r.docsSubmitted >= r.docsRequired;
          const pct = Math.round((r.docsSubmitted / r.docsRequired) * 100);
          return (
            <Link key={r.id} href={`/os/clients/${r.householdId}`} className={cn("grid h-[60px] items-center gap-x-4 border-b border-[var(--os-border)] px-8 transition-colors hover:bg-[var(--os-hover)]", RETURN_COLS)}>
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

// ── People (Contacts) ──
const PEOPLE_COLS = "grid-cols-[minmax(220px,1.6fr)_130px_minmax(160px,1.1fr)_150px_44px]";
function PeopleTable({ rows }: { rows: typeof people }) {
  return (
    <>
      <HeaderRow cols={PEOPLE_COLS} labels={["Name", "Role", "Client", "Phone", ""]} />
      <div className="flex-1 overflow-y-auto">
        {rows.map(p => (
          <Link key={p.id} href={`/os/clients/${p.householdId}`} className={cn("grid h-[60px] items-center gap-x-4 border-b border-[var(--os-border)] px-8 transition-colors hover:bg-[var(--os-hover)]", PEOPLE_COLS)}>
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

// ── Kanban (same style as Tasks board) ──
type BoardItem = { id: string; href: string; name: string; sub: string; pills: string[]; stage: ReturnStage; tier?: string };

function BoardCard({ it }: { it: BoardItem }) {
  return (
    <Link href={it.href} className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-2.5 shadow-[0_1px_2px_rgba(17,17,26,0.03)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]">
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(it.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{it.name}</div>
          <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{it.sub}</div>
        </div>
        {it.tier && <span className="shrink-0 rounded border border-[var(--os-border)] bg-[var(--os-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-muted)]">{it.tier}</span>}
      </div>
      {it.pills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {it.pills.slice(0, 4).map((p, i) => <span key={i} className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-muted)]">{p}</span>)}
        </div>
      )}
    </Link>
  );
}

function StageBoard({ items }: { items: BoardItem[] }) {
  const groups = BOARD_STAGES.map(s => ({ stage: s, items: items.filter(i => i.stage === s) })).filter(g => g.items.length > 0);
  return (
    <div className="min-h-0 flex-1 overflow-x-auto">
      {groups.length === 0 ? (
        <div className="grid h-full place-items-center px-6 text-center text-[13px] text-[var(--os-ink-subtle)]">Nothing here.</div>
      ) : (
        <div className="flex min-w-max gap-3 px-5 py-4">
          {groups.map(g => (
            <div key={g.stage} className="flex w-[300px] shrink-0 flex-col">
              <div className="flex items-center gap-2 px-1 py-2">
                <span className={cn("size-2 shrink-0 rounded-full", STAGE_DOT[g.stage])} />
                <span className="text-[13px] font-medium text-[var(--os-ink)]">{stageLabels[g.stage] || g.stage}</span>
                <span className="tabular-nums text-[12px] text-[var(--os-ink-subtle)]">{g.items.length}</span>
                <button className="ml-auto grid size-5 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.plus} size={14} /></button>
              </div>
              <div className="flex flex-col gap-2 px-0.5 pb-4">
                {g.items.map(it => <BoardCard key={it.id} it={it} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  const [view, setView] = useState<View>("clients");
  const [layout, setLayout] = useState<Layout>("list");
  const [scope, setScope] = useState<Scope>("mine");

  const mine = scope === "mine";
  const hh = mine ? households.filter(h => h.assignedTo === ME) : households;
  const rr = mine ? returns.filter(r => r.assignedTo === ME) : returns;
  const pp = mine ? people.filter(p => households.find(x => x.id === p.householdId)?.assignedTo === ME) : people;

  const counts: Record<View, number> = { clients: hh.length, returns: rr.length, people: pp.length };

  // kanban items reflect the active object view
  const boardItems: BoardItem[] = view === "returns"
    ? rr.map(r => ({ id: r.id, href: `/os/clients/${r.householdId}`, name: r.entityName, sub: `${r.householdName} · ${r.year}`, pills: [r.form], stage: r.stage }))
    : hh.map(h => {
        const person = people.find(p => p.householdId === h.id);
        return { id: h.id, href: `/os/clients/${h.id}`, name: h.name, sub: person?.email ?? kindLabel[h.kind], pills: entitiesOf(h.id).map(e => e.form), stage: householdStage(h.id), tier: h.serviceTier };
      });

  return (
    <div className="flex h-full flex-col">
      {/* object header */}
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Clients</h1>
            <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Every household, return, and contact across your book.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} className="text-[var(--os-ink-muted)]" /> Search</button>
            <button className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.download} size={15} className="text-[var(--os-ink-muted)]" /> Export</button>
            <button className="flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]">Create <Icon icon={I.chevronDown} size={14} /></button>
          </div>
        </div>
      </div>

      {/* view switcher + scope + layout toggle */}
      <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-8">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={cn("relative flex items-center gap-1.5 px-2.5 py-2 text-[13px] transition-colors", view === v.key ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
          >
            {v.label}
            <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{counts[v.key]}</span>
            {view === v.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5 py-1.5">
          {/* scope — All / Mine (replaces Worklists) */}
          <div className="flex items-center gap-0.5 rounded-md border border-[var(--os-border)] p-0.5">
            {(["mine", "all"] as const).map(s => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn("h-6 rounded px-2 text-[12px] transition-colors", scope === s ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
              >
                {s === "mine" ? "Mine" : "All"}
              </button>
            ))}
          </div>
          {/* layout — list / board (board not applicable to People) */}
          {view !== "people" && (
            <div className="flex items-center gap-0.5 rounded-md border border-[var(--os-border)] p-0.5">
              <button onClick={() => setLayout("list")} aria-label="List view" className={cn("grid size-6 place-items-center rounded transition-colors", layout === "list" ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><Icon icon={I.viewList} size={14} /></button>
              <button onClick={() => setLayout("board")} aria-label="Board view" className={cn("grid size-6 place-items-center rounded transition-colors", layout === "board" ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><Icon icon={I.viewBoard} size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* body */}
      {view === "people" ? (
        <PeopleTable rows={pp} />
      ) : layout === "board" ? (
        <StageBoard items={boardItems} />
      ) : view === "clients" ? (
        <ClientsTable rows={hh} />
      ) : (
        <ReturnsTable rows={rr} />
      )}
    </div>
  );
}
