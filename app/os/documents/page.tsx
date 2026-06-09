"use client";

// /os/documents — every expected document, organized client → engagement.
// Docs attach to ENGAGEMENTS; every count derives from lib/fixtures at render time.

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import {
  households, householdById, engagementsOf, expectedDocs, docsOfEngagement,
  type ExpectedDoc, type Engagement,
} from "@/lib/fixtures/firm";
import { docsOf, docsOfHousehold } from "@/lib/fixtures/derive";
import { expectedDocMeta, type ExpectedDocStatus } from "@/lib/fixtures/vocab";
import {
  EngagementDocsHeader, DocCard, DocRow, ReviewModal, DocLayoutToggle,
  isChecklistDoc, DOC_ROW_GRID,
} from "@/components/os/doc-gallery";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
function RailAvatar({ name }: { name: string }) {
  return <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]">{initials(name)}</span>;
}

/* ── the rail spine: clients → engagements, attention-first ── */
interface RailClient {
  id: string;
  name: string;
  engs: Engagement[];
  docs: ExpectedDoc[];
  review: number;
  requested: number;
}

const railClients: RailClient[] = households
  .map(h => {
    const engs = engagementsOf(h.id);
    const docs = engs.flatMap(e => docsOfEngagement(e.id));
    return {
      id: h.id, name: h.name, engs, docs,
      review: docs.filter(d => d.status === "needs_review").length,
      requested: docs.filter(d => d.status === "requested").length,
    };
  })
  .filter(c => c.docs.length > 0)
  .sort((a, b) => (b.review - a.review) || (b.requested - a.requested) || a.name.localeCompare(b.name));

/* ── scope + tabs ── */
type Scope = { kind: "all" } | { kind: "household"; id: string } | { kind: "engagement"; id: string };

type Tab = "all" | ExpectedDocStatus;
const TABS: { key: Tab; label: string; filter: (d: ExpectedDoc) => boolean }[] = [
  { key: "all", label: "All", filter: () => true },
  { key: "needs_review", label: expectedDocMeta.needs_review.label, filter: d => d.status === "needs_review" },
  { key: "have", label: expectedDocMeta.have.label, filter: d => d.status === "have" },
  { key: "requested", label: expectedDocMeta.requested.label, filter: d => d.status === "requested" },
];

const emptyCopy: Record<Tab, string> = {
  all: "No documents in this view yet — forward anything to vazant@docs.petal.app and Petal files it to the engagement.",
  needs_review: "Nothing needs review here — every extracted field cleared the confidence bar.",
  have: "Nothing in hand here yet — open a requested document to send a reminder.",
  requested: "Nothing outstanding — everything expected is in hand.",
  na: "Nothing marked N/A for this scope.",
};

const STATUS_PRIORITY: Record<ExpectedDocStatus, number> = { needs_review: 0, requested: 1, have: 2, na: 3 };

function DocumentsPageInner() {
  const preselect = useSearchParams().get("client");
  const preselected = preselect && householdById(preselect) ? preselect : null;

  const [scope, setScope] = useState<Scope>(preselected ? { kind: "household", id: preselected } : { kind: "all" });
  const [expanded, setExpanded] = useState<string[]>(preselected ? [preselected] : []);
  const [tab, setTab] = useState<Tab>("all");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [openDoc, setOpenDoc] = useState<ExpectedDoc | null>(null);
  const [clientQuery, setClientQuery] = useState("");

  const visibleClients = railClients.filter(c => c.name.toLowerCase().includes(clientQuery.trim().toLowerCase()));

  const scoped: ExpectedDoc[] =
    scope.kind === "all" ? expectedDocs
    : scope.kind === "household" ? engagementsOf(scope.id).flatMap(e => docsOfEngagement(e.id))
    : docsOfEngagement(scope.id);

  const activeTab = TABS.find(t => t.key === tab)!;
  const files = scoped
    .filter(activeTab.filter)
    .slice()
    .sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);
  const counts = Object.fromEntries(TABS.map(t => [t.key, scoped.filter(t.filter).length]));

  const notable = files.filter(d => !isChecklistDoc(d));
  const checklist = files.filter(isChecklistDoc);

  function selectClient(id: string) {
    if (scope.kind === "household" && scope.id === id) {
      setExpanded(x => (x.includes(id) ? x.filter(e => e !== id) : [...x, id]));
    } else {
      setScope({ kind: "household", id });
      setExpanded(x => (x.includes(id) ? x : [...x, id]));
    }
  }

  const railRow = (active: boolean) =>
    cn(
      "flex h-7 w-full items-center gap-2 rounded-md px-2 text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]",
      active ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
    );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--os-border)] px-5 pt-6 pb-5 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Documents</h1>
            <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Source documents Petal collects, extracts, and files — organized by client and engagement.</p>
          </div>
          <button className="flex h-7 shrink-0 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]">
            <Icon icon={I.attach} size={15} /> Upload
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* ── Clients → engagements rail ── */}
        <aside className="flex max-h-[38vh] w-full shrink-0 flex-col overflow-hidden border-b border-[var(--os-border)] md:max-h-none md:w-[224px] md:border-b-0 md:border-r">
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
                <button onClick={() => setClientQuery("")} aria-label="Clear search" className="grid size-4 shrink-0 place-items-center rounded text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={11} /></button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-1.5 pb-2">
            <button onClick={() => setScope({ kind: "all" })} className={railRow(scope.kind === "all")}>
              <Icon icon={I.clients} size={15} className="shrink-0" />
              <span className="truncate">All clients</span>
              <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{expectedDocs.length}</span>
            </button>
            <div className="os-label px-2 pb-1 pt-3">Clients</div>
            <div className="space-y-0.5">
              {visibleClients.map(c => {
                const open = expanded.includes(c.id);
                return (
                  <div key={c.id}>
                    <button onClick={() => selectClient(c.id)} aria-expanded={open} className={railRow(scope.kind === "household" && scope.id === c.id)}>
                      <Icon icon={I.chevronRight} size={11} className={cn("shrink-0 text-[var(--os-ink-subtle)] transition-transform", open && "rotate-90")} />
                      <RailAvatar name={c.name} />
                      <span className="truncate">{c.name}</span>
                      {c.review > 0 && <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />}
                      <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{docsOfHousehold(c.id).label}</span>
                    </button>
                    {open && (
                      <div className="mt-0.5 space-y-0.5">
                        {c.engs.map(e => {
                          const dc = docsOf(e.id);
                          return (
                            <button key={e.id} onClick={() => setScope({ kind: "engagement", id: e.id })} className={cn(railRow(scope.kind === "engagement" && scope.id === e.id), "pl-9")}>
                              <span className="truncate">{e.form} · {e.taxYear}</span>
                              {dc.needsReview > 0 && <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />}
                              <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{dc.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleClients.length === 0 && <div className="px-2 py-2 text-[12px] text-[var(--os-ink-subtle)]">No clients match.</div>}
            </div>
          </div>
        </aside>

        {/* ── Main: status tabs + gallery ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--os-border)] px-3">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]",
                  tab === t.key ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
                )}
              >
                {t.label}
                <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{counts[t.key]}</span>
                {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
              </button>
            ))}
            <div className="ml-auto pl-2"><DocLayoutToggle layout={layout} onChange={setLayout} /></div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            {scope.kind === "engagement" && (
              <div className="mb-6">
                <EngagementDocsHeader engagementId={scope.id} />
              </div>
            )}

            {files.length === 0 ? (
              <div className="grid h-full place-items-center px-6 text-center text-[13px] text-[var(--os-ink-subtle)]">{emptyCopy[tab]}</div>
            ) : layout === "grid" ? (
              <>
                {notable.length > 0 && (
                  <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {notable.map(d => <DocCard key={d.id} doc={d} onOpen={setOpenDoc} />)}
                  </div>
                )}
                {checklist.length > 0 && (
                  <div className={cn(notable.length > 0 && "mt-8")}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="os-label">From the 2024 checklist</span>
                      <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{checklist.length}</span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-[var(--os-border)]">
                      <div className="min-w-[560px]">
                        {checklist.map(d => <DocRow key={d.id} doc={d} onOpen={setOpenDoc} />)}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2", DOC_ROW_GRID)}>
                    {["Document", "Status", "Via", "Received"].map(h => <div key={h} className="os-label">{h}</div>)}
                  </div>
                  {files.map(d => <DocRow key={d.id} doc={d} onOpen={setOpenDoc} />)}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--os-border)] px-5 py-2.5 text-[12px] text-[var(--os-ink-muted)] sm:px-8">
            Forward documents to <span className="font-medium text-[var(--os-ink)]">vazant@docs.petal.app</span> — client photo uploads land here too.
          </div>
        </div>
      </div>

      <AnimatePresence>{openDoc && <ReviewModal doc={openDoc} onClose={() => setOpenDoc(null)} />}</AnimatePresence>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsPageInner />
    </Suspense>
  );
}
