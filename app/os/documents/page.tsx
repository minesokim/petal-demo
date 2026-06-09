"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { docs, type OsDoc } from "@/lib/os-files";
import { DocCard, DocRow, ReviewModal, DocLayoutToggle } from "@/components/os/doc-gallery";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
function RailAvatar({ name }: { name: string }) {
  return <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]">{initials(name)}</span>;
}

// clients are first-class: the left rail spine. attention-first ordering.
const clientList = Array.from(new Map(docs.map(d => [d.householdId, d.clientName])).entries())
  .map(([id, name]) => {
    const cd = docs.filter(d => d.householdId === id);
    return { id, name, total: cd.length, review: cd.filter(d => d.status === "needs_review").length, outstanding: cd.filter(d => d.status === "requested").length };
  })
  .sort((a, b) => (b.review - a.review) || (b.outstanding - a.outstanding) || a.name.localeCompare(b.name));


type Tab = "all" | "needs_review" | "received" | "requested";
const TABS: { key: Tab; label: string; filter: (d: OsDoc) => boolean }[] = [
  { key: "all", label: "All", filter: () => true },
  { key: "needs_review", label: "Needs review", filter: d => d.status === "needs_review" },
  { key: "received", label: "Extracted", filter: d => d.status === "received" },
  { key: "requested", label: "Requested", filter: d => d.status === "requested" },
];

export default function DocumentsPage() {
  const [client, setClient] = useState<string | null>(null); // null = all clients
  const [tab, setTab] = useState<Tab>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [clientQuery, setClientQuery] = useState("");

  const railClients = clientList.filter(c => c.name.toLowerCase().includes(clientQuery.trim().toLowerCase()));
  const scoped = client ? docs.filter(d => d.householdId === client) : docs;
  const activeTab = TABS.find(t => t.key === tab)!;
  const files = scoped.filter(activeTab.filter);
  const counts = TABS.reduce<Record<string, number>>((a, t) => { a[t.key] = scoped.filter(t.filter).length; return a; }, {});
  const doc = openDoc ? docs.find(d => d.id === openDoc) ?? null : null;

  function railRow(active: boolean) {
    return cn("flex h-7 w-full items-center gap-2 rounded-md px-2 text-[13px] transition-colors", active ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Documents</h1>
            <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Source documents Petal collects, extracts, and files by client.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} /></button>
            <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.attach} size={15} /> Upload</button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ── Clients rail (first-class spine) ── */}
        <aside className="flex w-[212px] shrink-0 flex-col overflow-hidden border-r border-[var(--os-border)]">
          <div className="px-2.5 pb-1.5 pt-2.5">
            <div className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 focus-within:border-[var(--os-border-strong)]">
              <Icon icon={I.search} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
              <input
                value={clientQuery}
                onChange={e => setClientQuery(e.target.value)}
                placeholder="Search clients"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
              />
              {clientQuery && (
                <button onClick={() => setClientQuery("")} className="grid size-4 shrink-0 place-items-center rounded text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={11} /></button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-1.5 pb-2">
            <button onClick={() => setClient(null)} className={railRow(client === null)}>
              <Icon icon={I.clients} size={15} className="shrink-0" />
              <span className="truncate">All clients</span>
              <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{docs.length}</span>
            </button>
            <div className="os-label px-2 pb-1 pt-3">Clients</div>
            <div className="space-y-0.5">
              {railClients.map(c => (
                <button key={c.id} onClick={() => setClient(c.id)} className={railRow(client === c.id)}>
                  <RailAvatar name={c.name} />
                  <span className="truncate">{c.name}</span>
                  {c.review > 0 && <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />}
                  <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{c.total}</span>
                </button>
              ))}
              {railClients.length === 0 && <div className="px-2 py-2 text-[12px] text-[var(--os-ink-subtle)]">No clients match.</div>}
            </div>
          </div>
        </aside>

        {/* ── Main: status tabs + gallery ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-3">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={cn("relative flex items-center gap-1.5 px-2.5 py-2.5 text-[13px] transition-colors", tab === t.key ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}>
                {t.label}
                <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{counts[t.key]}</span>
                {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
              </button>
            ))}
            <div className="ml-auto"><DocLayoutToggle value={view} onChange={setView} /></div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {files.length === 0 ? (
              <div className="grid h-full place-items-center text-[13px] text-[var(--os-ink-subtle)]">Nothing here right now.</div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
                {files.map(d => <DocCard key={d.id} doc={d} onOpen={setOpenDoc} showClient={!client} />)}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[1fr_180px_150px_110px] items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2">
                  {["Name", "Client", "Status", "Modified"].map(h => <div key={h} className="os-label">{h}</div>)}
                </div>
                {files.map(d => <DocRow key={d.id} doc={d} onOpen={setOpenDoc} showClient />)}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>{doc && <ReviewModal doc={doc} onClose={() => setOpenDoc(null)} />}</AnimatePresence>
    </div>
  );
}
