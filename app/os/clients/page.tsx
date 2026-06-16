"use client";

import { useState } from "react";
import Link from "next/link";
import {
  households, people, engagements, entitiesOf, householdById, entityById,
  CURRENT_USER_ID,
  type HouseholdKind, type Person, type Household, type Engagement,
} from "@/lib/fixtures/firm";
import { STAGE_ORDER, stageMeta, money, type Stage } from "@/lib/fixtures/vocab";
import {
  householdStage, householdDeadline, docsOfHousehold, docsOf, invoiceOf, engagementDeadline,
} from "@/lib/fixtures/derive";
import { assigneeOf, useAssignVersion } from "@/lib/assign-store";
import { StageTag, DeadlineChip, ScopeToggle, type Scope } from "@/components/os/primitives";
import { AssigneePicker } from "@/components/os/assignee-picker";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";

type View = "clients" | "returns" | "people";
type Layout = "list" | "board";

const VIEWS: { key: View; label: string }[] = [
  { key: "clients", label: "Clients" },
  { key: "returns", label: "Returns" },
  { key: "people", label: "People" },
];

const kindLabel: Record<HouseholdKind, string> = {
  individual: "Individual",
  business: "Business",
  mixed: "Individual + business",
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]";

// Ramp-style grid: every cell stretches full row height (so the vertical dividers are
// continuous), centers its content, and carries a right divider — last cell omits it.
const CELL =
  "[&>*]:flex [&>*]:min-w-0 [&>*]:items-center [&>*]:border-r [&>*]:border-[var(--os-border)] [&>*]:px-3 [&>*:first-child]:pl-8 [&>*:first-child]:pr-8 [&>*:last-child]:border-r-0 [&>*:last-child]:pr-8";

// Name column = flexible with a 300px floor: it fills the row (long, like before) when
// there's room, and holds 300px when the table overflows and scrolls. The fr absorbs any
// slack so the grid lines never extend past the content.

function HeaderRow({ cols, labels, right }: { cols: string; labels: string[]; right?: string[] }) {
  return (
    <div className={cn("grid border-b border-[var(--os-border)] [&>*]:py-2.5", cols, CELL)}>
      {labels.map(h => <div key={h} className={cn("os-label", right?.includes(h) && "justify-end")}>{h}</div>)}
    </div>
  );
}

/** Thin docs progress bar + the canonical "have/denom" label. */
function DocsBar({ label, inHand, denom }: { label: string; inHand: number; denom: number }) {
  const pct = denom > 0 ? Math.round((inHand / denom) * 100) : 100;
  const complete = denom > 0 && inHand >= denom;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--os-selected)]">
        <div className="h-full rounded-full bg-[var(--os-ink-muted)]" style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-[11px] tabular-nums", complete ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{label}</span>
    </div>
  );
}

const EmDash = () => <span className="text-[12px] text-[var(--os-ink-subtle)]">—</span>;

// ── Clients (households) — the deliverable table ──
const CLIENT_COLS = "grid-cols-[minmax(300px,1.7fr)_150px_136px_104px_148px_104px_92px_96px]";

function ClientsTable({ rows }: { rows: Household[] }) {
  return (
    <div className="min-w-[1130px]">
      <HeaderRow cols={CLIENT_COLS} labels={["Name", "Forms", "Stage", "Deadline", "Docs", "Balance", "Tier", "Owner"]} right={["Balance", "Owner"]} />
      {rows.map(h => {
        const ents = entitiesOf(h.id);
        const docs = docsOfHousehold(h.id);
        const dl = householdDeadline(h.id);
        const balance = invoiceOf(h.id).balance;
        return (
          <Link
            key={h.id}
            href={`/os/clients/${h.id}`}
            className={cn("grid border-b border-[var(--os-border)] [&>*]:py-3.5 transition-colors hover:bg-[var(--os-hover)]", FOCUS, CLIENT_COLS, CELL)}
          >
            <div className="gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(h.name)}</span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{h.name}</div>
                <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{kindLabel[h.kind]}</div>
              </div>
            </div>
            <div className="gap-1">
              {ents.slice(0, 3).map(e => (
                <span key={e.id} className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-muted)]">{e.form}</span>
              ))}
              {ents.length > 3 && <span className="text-[11px] text-[var(--os-ink-subtle)]">+{ents.length - 3}</span>}
            </div>
            <div><StageTag stage={householdStage(h.id)} /></div>
            <div>{dl ? <DeadlineChip iso={dl.iso} extended={dl.extended} /> : <EmDash />}</div>
            <div className="gap-2"><DocsBar label={docs.label} inHand={docs.inHand} denom={docs.denom} /></div>
            <div className={cn("justify-end text-[13px] tabular-nums", balance > 0 ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)]")}>{money(balance)}</div>
            <div className="text-[12px] text-[var(--os-ink-muted)]">{h.serviceTier}</div>
            <div className="justify-end"><AssigneePicker householdId={h.id} variant="avatar" align="right" /></div>
          </Link>
        );
      })}
    </div>
  );
}

// ── Returns (engagements) ──
const RETURN_COLS = "grid-cols-[minmax(300px,1.7fr)_136px_104px_148px_104px_96px]";

function ReturnsTable({ rows }: { rows: Engagement[] }) {
  return (
    <div className="min-w-[888px]">
      <HeaderRow cols={RETURN_COLS} labels={["Return", "Stage", "Deadline", "Docs", "Fee", "Owner"]} right={["Fee", "Owner"]} />
      {rows.map(e => {
        const entity = entityById(e.entityId);
        const hh = householdById(e.householdId);
        const docs = docsOf(e.id);
        const closed = e.stage === "e_filed" || e.stage === "accepted";
        const dl = engagementDeadline(e);
        return (
          <Link
            key={e.id}
            href={`/os/returns/${e.id}`}
            className={cn("grid border-b border-[var(--os-border)] [&>*]:py-3.5 transition-colors hover:bg-[var(--os-hover)]", FOCUS, RETURN_COLS, CELL)}
          >
            <div className="gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(entity?.name ?? e.form)}</span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{entity?.name ?? hh?.name}</div>
                <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{hh?.name} · {e.form} · {e.taxYear}</div>
              </div>
            </div>
            <div><StageTag stage={e.stage} /></div>
            <div>{closed ? <EmDash /> : <DeadlineChip iso={dl.iso} extended={dl.extended} />}</div>
            <div><DocsBar label={docs.label} inHand={docs.inHand} denom={docs.denom} /></div>
            <div className="justify-end text-[13px] font-medium tabular-nums text-[var(--os-ink)]">{money(e.fee)}</div>
            <div className="justify-end"><AssigneePicker householdId={e.householdId} variant="avatar" align="right" /></div>
          </Link>
        );
      })}
    </div>
  );
}

// ── People (contacts) ──
const PEOPLE_COLS = "grid-cols-[minmax(300px,1.6fr)_120px_200px_140px_96px]";

function PeopleTable({ rows }: { rows: Person[] }) {
  return (
    <div className="min-w-[856px]">
      <HeaderRow cols={PEOPLE_COLS} labels={["Name", "Role", "Client", "Phone", "Owner"]} right={["Owner"]} />
      {rows.map(p => (
        <Link
          key={p.id}
          href={`/os/clients/${p.householdId}`}
          className={cn("grid border-b border-[var(--os-border)] [&>*]:py-3.5 transition-colors hover:bg-[var(--os-hover)]", FOCUS, PEOPLE_COLS, CELL)}
        >
          <div className="gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(p.name)}</span>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{p.name}</div>
              <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{p.email}</div>
            </div>
          </div>
          <div className="text-[12px] text-[var(--os-ink-muted)]">{p.role}</div>
          <div className="truncate text-[12px] text-[var(--os-ink-muted)]"><span className="truncate">{householdById(p.householdId)?.name}</span></div>
          <div className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">{p.phone}</div>
          <div className="justify-end"><AssigneePicker householdId={p.householdId} variant="avatar" align="right" /></div>
        </Link>
      ))}
    </div>
  );
}

// ── Board (7 canon stage columns) ──
type BoardItem = { id: string; href: string; name: string; sub: string; pills: string[]; stage: Stage; tag?: string };

function BoardCard({ it }: { it: BoardItem }) {
  return (
    <Link
      href={it.href}
      className={cn("rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-2.5 shadow-[0_1px_2px_rgba(17,17,26,0.03)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]", FOCUS)}
    >
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(it.name)}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{it.name}</div>
          <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{it.sub}</div>
        </div>
        {it.tag && <span className="shrink-0 rounded border border-[var(--os-border)] bg-[var(--os-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-muted)]">{it.tag}</span>}
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
  return (
    <div className="flex min-w-max gap-3 px-5 py-4">
      {STAGE_ORDER.map(s => {
        const group = items.filter(i => i.stage === s);
        return (
          <div key={s} className="flex w-[280px] shrink-0 flex-col">
            <div className="flex items-center gap-2 px-1 py-2">
              <span className={cn("size-2 shrink-0 rounded-full", stageMeta[s].dot)} />
              <span className="text-[13px] font-medium text-[var(--os-ink)]">{stageMeta[s].label}</span>
              <span className="text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{group.length}</span>
            </div>
            <div className="flex flex-col gap-2 px-0.5 pb-4">
              {group.map(it => <BoardCard key={it.id} it={it} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ClientsPage() {
  const [view, setView] = useState<View>("clients");
  const [layout, setLayout] = useState<Layout>("list");
  const [scope, setScope] = useState<Scope>("firm");
  const [query, setQuery] = useState("");
  useAssignVersion(); // re-filter when a client is reassigned from the table

  const mine = scope === "mine";
  const q = query.trim().toLowerCase();
  const hhRows = (mine ? households.filter(h => assigneeOf(h.id) === CURRENT_USER_ID) : households)
    .filter(h => !q || h.name.toLowerCase().includes(q));
  const engRows = (mine ? engagements.filter(e => assigneeOf(e.householdId) === CURRENT_USER_ID) : engagements)
    .filter(e => !q || `${entityById(e.entityId)?.name ?? ""} ${householdById(e.householdId)?.name ?? ""} ${e.form}`.toLowerCase().includes(q));
  const peopleRows = (mine ? people.filter(p => assigneeOf(p.householdId) === CURRENT_USER_ID) : people)
    .filter(p => !q || `${p.name} ${p.email}`.toLowerCase().includes(q));

  const counts: Record<View, number> = {
    clients: hhRows.length,
    returns: engRows.length,
    people: peopleRows.length,
  };

  // board items reflect the active object view — both group on the 7 canon stages
  const boardItems: BoardItem[] = view === "returns"
    ? engRows.map(e => {
        const entity = entityById(e.entityId);
        const hh = householdById(e.householdId);
        return { id: e.id, href: `/os/returns/${e.id}`, name: entity?.name ?? hh?.name ?? e.form, sub: `${hh?.name} · ${e.taxYear}`, pills: [e.form], stage: e.stage };
      })
    : hhRows.map(h => ({
        id: h.id, href: `/os/clients/${h.id}`, name: h.name, sub: kindLabel[h.kind],
        pills: entitiesOf(h.id).map(x => x.form), stage: householdStage(h.id), tag: h.serviceTier,
      }));

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
            <button className={cn("flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}><Icon icon={I.download} size={15} className="text-[var(--os-ink-muted)]" /> Export</button>
            <button className={cn("flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>Create <Icon icon={I.chevronDown} size={14} /></button>
          </div>
        </div>
      </div>

      {/* view switcher */}
      <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-8">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={cn("relative flex items-center gap-1.5 px-2.5 py-2 text-[13px] transition-colors", FOCUS, view === v.key ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
          >
            {v.label}
            <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{counts[v.key]}</span>
            {view === v.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
          </button>
        ))}
      </div>

      {/* controls row — search on the left, scope + layout on the right */}
      <div className="flex items-center gap-3 border-b border-[var(--os-border)] px-8 py-2">
        <div className="relative w-full max-w-[300px]">
          <Icon icon={I.search} size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--os-ink-subtle)]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${view}…`}
            className={cn("h-8 w-full rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] pl-8 pr-7 text-[13px] text-[var(--os-ink)] placeholder:text-[var(--os-ink-subtle)] transition-colors hover:border-[var(--os-border-strong)] focus:border-[var(--os-border-strong)]", FOCUS)}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" className={cn("absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
              <Icon icon={I.close} size={13} />
            </button>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ScopeToggle scope={scope} onChange={setScope} />
          {view !== "people" && (
            <div className="flex items-center gap-0.5 rounded-md border border-[var(--os-border)] p-0.5">
              <button onClick={() => setLayout("list")} aria-label="List layout" className={cn("grid size-6 place-items-center rounded transition-colors", FOCUS, layout === "list" ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><Icon icon={I.viewList} size={14} /></button>
              <button onClick={() => setLayout("board")} aria-label="Board layout" className={cn("grid size-6 place-items-center rounded transition-colors", FOCUS, layout === "board" ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><Icon icon={I.viewBoard} size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* body — one scroll container so narrow viewports pan the whole table */}
      <div className="min-h-0 flex-1 overflow-auto">
        {view === "people" ? (
          <PeopleTable rows={peopleRows} />
        ) : layout === "board" ? (
          <StageBoard items={boardItems} />
        ) : view === "clients" ? (
          <ClientsTable rows={hhRows} />
        ) : (
          <ReturnsTable rows={engRows} />
        )}
      </div>
    </div>
  );
}
