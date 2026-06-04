"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { docs, docStatusMeta, type OsDoc, type DocStatus } from "@/lib/os-files";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
function RailAvatar({ name }: { name: string }) {
  return <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]">{initials(name)}</span>;
}

function StatusDot({ status }: { status: DocStatus }) {
  const m = docStatusMeta[status];
  return <span className={cn("inline-flex items-center gap-1.5 text-[11px]", m.accent)}><span className={cn("size-1.5 rounded-full", m.dot)} /> {m.label}</span>;
}
function GridGlyph({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" /></svg>;
}
function ListGlyph({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden><rect x="1.5" y="3" width="13" height="1.8" rx="0.9" /><rect x="1.5" y="7.1" width="13" height="1.8" rx="0.9" /><rect x="1.5" y="11.2" width="13" height="1.8" rx="0.9" /></svg>;
}

/** Stylized document preview — we have no real PDFs in the mock, so render a tasteful faux page. */
function DocThumb({ doc }: { doc: OsDoc }) {
  if (doc.status === "requested") {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed border-[var(--os-border-strong)] bg-[var(--os-bg-subtle)] transition-colors group-hover:border-[var(--os-ink-subtle)]">
        <Icon icon={I.file} size={26} className="text-[var(--os-ink-subtle)]" />
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] p-3 transition-shadow group-hover:shadow-sm">
      <div className="h-full overflow-hidden rounded border border-[var(--os-border)] bg-white px-2.5 pt-2 shadow-sm">
        <div className="flex items-center gap-1 border-b border-[var(--os-border)] pb-1.5">
          <Icon icon={I.file} size={10} className="text-[var(--os-ink-subtle)]" />
          <span className="text-[8px] font-semibold uppercase tracking-wide text-[var(--os-ink-muted)]">{doc.type}</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {(doc.fields ?? [{ label: "" }, { label: "" }, { label: "" }, { label: "" }]).slice(0, 4).map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-1 w-10 rounded-full bg-[var(--os-selected)]" />
              <span className="h-1 flex-1 rounded-full bg-[var(--os-selected)]" style={{ maxWidth: 60 + (i % 2) * 24 }} />
            </div>
          ))}
        </div>
      </div>
      {doc.status === "needs_review" && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-amber-500 ring-2 ring-[var(--os-bg-subtle)]" />}
    </div>
  );
}

function ReviewModal({ doc, onClose }: { doc: OsDoc; onClose: () => void }) {
  const isReq = doc.status === "requested";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={onClose} className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-6">
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }} transition={{ duration: 0.16, ease: "easeOut" }} onClick={e => e.stopPropagation()} className="flex max-h-[82vh] w-full max-w-[920px] flex-col overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] px-5 py-3 text-[12px] text-[var(--os-ink-subtle)]">
          <Icon icon={I.file} size={13} /> <span>{doc.type}</span>
          <Icon icon={I.chevronRight} size={12} />
          <Link href={`/os/clients/${doc.householdId}`} className="text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]">{doc.clientName}</Link>
          <span className="ml-2 truncate text-[13px] font-semibold text-[var(--os-ink)]">{doc.name}</span>
          <button onClick={onClose} className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={15} /></button>
        </div>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 items-start justify-center overflow-y-auto bg-[var(--os-bg-subtle)] p-8">
            {isReq ? (
              <div className="mt-12 flex flex-col items-center text-center">
                <span className="grid size-12 place-items-center rounded-xl border border-dashed border-[var(--os-border-strong)] text-[var(--os-ink-subtle)]"><Icon icon={I.file} size={22} /></span>
                <div className="mt-3 text-[13px] font-medium text-[var(--os-ink)]">Not received yet</div>
                <p className="mt-1 max-w-[280px] text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{doc.note}</p>
              </div>
            ) : (
              <div className="w-full max-w-[420px] rounded-lg border border-[var(--os-border)] bg-white p-7 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[var(--os-border)] pb-3">
                  <Icon icon={I.file} size={16} className="text-[var(--os-ink-subtle)]" />
                  <span className="text-[13px] font-semibold text-[var(--os-ink)]">{doc.type}</span>
                  <span className="ml-auto font-mono text-[10px] text-[var(--os-ink-subtle)]">{doc.name}</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {(doc.fields ?? []).map((f, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-[var(--os-ink-subtle)]">{f.label}</span>
                      <span className="h-2 flex-1 rounded bg-[var(--os-selected)]" style={{ maxWidth: 120 + (i % 3) * 40 }} />
                    </div>
                  ))}
                  <div className="h-2 w-2/3 rounded bg-[var(--os-selected)]" /><div className="h-2 w-5/6 rounded bg-[var(--os-selected)]" />
                </div>
              </div>
            )}
          </div>
          <aside className="flex w-[320px] shrink-0 flex-col overflow-y-auto border-l border-[var(--os-border)] px-4 py-4">
            {isReq ? (
              <>
                <div className="os-label mb-1.5">Status</div>
                <StatusDot status={doc.status} />
                <p className="mt-3 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{doc.note}</p>
                <div className="mt-4 flex items-center gap-1.5">
                  <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><PetalMark className="size-3.5" /> Send reminder</button>
                  <Link href={`/os/clients/${doc.householdId}`} className="flex h-7 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px]">Open record</Link>
                </div>
              </>
            ) : (
              <>
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                  <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />
                  <span className="text-[12px] font-medium text-[var(--os-ink-muted)]">Petal extracted</span>
                  <StatusDot status={doc.status} />
                </div>
                {doc.note && <p className="mb-3 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{doc.note}</p>}
                <div className="os-label mb-1.5">Extracted fields</div>
                <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                  {(doc.fields ?? []).map((f, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-3 px-3 py-2">
                      <span className="text-[12px] text-[var(--os-ink-muted)]">{f.label}</span>
                      <span className={cn("text-right text-[12px] font-medium tabular-nums", f.flag ? "text-[var(--os-warning)]" : "text-[var(--os-ink)]")}>{f.value}</span>
                    </div>
                  ))}
                </div>
                {doc.status === "needs_review" ? (
                  <div className="mt-3 flex items-center gap-1.5">
                    <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.check} size={14} /> Confirm</button>
                    <button className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px]"><Icon icon={I.sendBack} size={14} /> Send back</button>
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]"><Icon icon={I.check} size={14} className="text-emerald-600" /> Confirmed & filed</div>
                )}
              </>
            )}
          </aside>
        </div>
      </motion.div>
    </motion.div>
  );
}

// clients are first-class: the left rail spine. attention-first ordering.
const clientList = Array.from(new Map(docs.map(d => [d.householdId, d.clientName])).entries())
  .map(([id, name]) => {
    const cd = docs.filter(d => d.householdId === id);
    return { id, name, total: cd.length, review: cd.filter(d => d.status === "needs_review").length, outstanding: cd.filter(d => d.status === "requested").length };
  })
  .sort((a, b) => (b.review - a.review) || (b.outstanding - a.outstanding) || a.name.localeCompare(b.name));

const needsReviewTotal = docs.filter(d => d.status === "needs_review").length;
const clientsWithReview = new Set(docs.filter(d => d.status === "needs_review").map(d => d.householdId)).size;

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
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-4 py-2.5">
        <Icon icon={I.file} size={17} className="text-[var(--os-ink-muted)]" />
        <h1 className="text-[15px] font-semibold os-display">Documents</h1>
        <span className="text-[12px] text-[var(--os-ink-subtle)]">{clientList.length} clients · {docs.length} documents</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} /></button>
          <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.attach} size={15} /> Upload</button>
        </div>
      </div>

      {/* Petal insight strip → review across all clients */}
      {needsReviewTotal > 0 && (
        <button onClick={() => { setClient(null); setTab("needs_review"); }} className="flex w-full items-center gap-2.5 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-4 py-3 text-left transition-colors hover:bg-[var(--os-selected)]">
          <PetalMark className="size-4 shrink-0 text-[var(--os-ink-muted)]" />
          <span className="text-[13px] text-[var(--os-ink-muted)]">Petal extracted <span className="font-medium text-[var(--os-ink)]">{needsReviewTotal} documents</span> that need your review across {clientsWithReview} clients</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-[var(--os-ink-muted)]">Review all <Icon icon={I.chevronRight} size={13} /></span>
        </button>
      )}

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
            <div className="ml-auto flex items-center gap-0.5 rounded-md bg-[var(--os-bg-subtle)] p-0.5">
              <button onClick={() => setView("grid")} className={cn("grid size-6 place-items-center rounded transition-colors", view === "grid" ? "bg-[var(--os-surface)] text-[var(--os-ink)] shadow-sm" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><GridGlyph className="size-3.5" /></button>
              <button onClick={() => setView("list")} className={cn("grid size-6 place-items-center rounded transition-colors", view === "list" ? "bg-[var(--os-surface)] text-[var(--os-ink)] shadow-sm" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><ListGlyph className="size-3.5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {files.length === 0 ? (
              <div className="grid h-full place-items-center text-[13px] text-[var(--os-ink-subtle)]">Nothing here right now.</div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
                {files.map(d => (
                  <button key={d.id} onClick={() => setOpenDoc(d.id)} className="group text-left">
                    <DocThumb doc={d} />
                    <div className="mt-2.5 px-0.5">
                      <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{d.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusDot status={d.status} />
                        <span className="ml-auto shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{d.when}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-[var(--os-ink-subtle)]">{client ? d.context : `${d.clientName} · ${d.context}`}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-[1fr_180px_150px_110px] items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2">
                  {["Name", "Client", "Status", "Modified"].map(h => <div key={h} className="os-label">{h}</div>)}
                </div>
                {files.map(d => (
                  <button key={d.id} onClick={() => setOpenDoc(d.id)} className="grid w-full grid-cols-[1fr_180px_150px_110px] items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2.5 text-left transition-colors hover:bg-[var(--os-hover)]">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--os-selected)] text-[var(--os-ink-subtle)]"><Icon icon={I.file} size={14} /></span>
                      <span className="truncate text-[13px] font-medium text-[var(--os-ink)]">{d.name}</span>
                    </div>
                    <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{d.clientName}</div>
                    <div><StatusDot status={d.status} /></div>
                    <div className="text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{d.when}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>{doc && <ReviewModal doc={doc} onClose={() => setOpenDoc(null)} />}</AnimatePresence>
    </div>
  );
}
