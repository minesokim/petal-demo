"use client";

// Document gallery - canonical-fixture edition. Docs attach to ENGAGEMENTS
// (ExpectedDoc from lib/fixtures/firm); statuses render only via expectedDocMeta.
// The Documents page and the client-record Documents tab share these exact contracts.

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { ProvenancePanel } from "@/components/os/provenance";
import {
  engagementById, householdById, skillRuns, type ExpectedDoc,
} from "@/lib/fixtures/firm";
import { docsOf } from "@/lib/fixtures/derive";
import { expectedDocMeta, type ExpectedDocStatus } from "@/lib/fixtures/vocab";

const CONFIDENCE_BAR = 0.95;

/** Boring already-in-hand checklist docs - may render compactly, always counted. */
export const isChecklistDoc = (d: ExpectedDoc) => d.source.includes("per 2024 checklist");

/** The run that touched this document (provenance), found by source ref. Extraction docs only. */
export function runForDoc(doc: ExpectedDoc) {
  if (!doc.fields) return undefined;
  return skillRuns.find(r => r.inputs.some(i => i.ref === doc.source));
}

const lowConfidence = (f: { confidence: number; flag?: boolean }) => !!f.flag || f.confidence < CONFIDENCE_BAR;

/** Expected-doc status: small dot + neutral label, via expectedDocMeta only. */
export function StatusDot({ status, className }: { status: ExpectedDocStatus; className?: string }) {
  const m = expectedDocMeta[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}

/* ── Per-engagement header: counts · thin progress bar · prior-year caption ── */
export function EngagementDocsHeader({ engagementId }: { engagementId: string }) {
  const c = docsOf(engagementId);
  const pct = c.denom > 0 ? Math.round((c.inHand / c.denom) * 100) : 0;
  const seg = (label: string, n: number, dot?: string) => (
    <span className="inline-flex items-center gap-1.5">
      {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
      {label} <span className="font-medium tabular-nums text-[var(--os-ink)]">{n}</span>
    </span>
  );
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--os-ink-muted)]">
        {seg("Expected", c.expected)}
        {seg(expectedDocMeta.have.label, c.have, expectedDocMeta.have.dot)}
        {c.needsReview > 0 && seg(expectedDocMeta.needs_review.label, c.needsReview, expectedDocMeta.needs_review.dot)}
        {seg(expectedDocMeta.requested.label, c.requested, expectedDocMeta.requested.dot)}
        {c.na > 0 && seg(expectedDocMeta.na.label, c.na, expectedDocMeta.na.dot)}
        <span className="ml-auto tabular-nums text-[var(--os-ink-subtle)]">{c.label} in hand</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
        <div className="h-full rounded-full bg-[var(--os-ink)] transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--os-ink-subtle)]">Based on the 2024 return</p>
    </div>
  );
}

/** Stylized document preview - no real PDFs in the mock, so render a tasteful faux page. */
export function DocThumb({ doc }: { doc: ExpectedDoc }) {
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
          {(doc.fields ?? [0, 1, 2, 3]).slice(0, 4).map((_, i) => (
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

/** A single document tile: faux-page thumbnail + source + status + timestamp. Click opens the review modal. */
export function DocCard({ doc, onOpen }: { doc: ExpectedDoc; onOpen: (d: ExpectedDoc) => void }) {
  return (
    <button
      onClick={() => onOpen(doc)}
      className="group rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
    >
      <DocThumb doc={doc} />
      <div className="mt-2.5 px-0.5">
        <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{doc.source}</div>
        <div className="mt-1 flex items-center gap-2">
          <StatusDot status={doc.status} />
          {doc.when && <span className="ml-auto shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{doc.when}</span>}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-[var(--os-ink-subtle)]">
          {doc.type}{doc.receivedVia ? ` · via ${doc.receivedVia}` : ""}
        </div>
      </div>
    </button>
  );
}

/** Shared column template so the page's list header lines up with DocRow. */
export const DOC_ROW_GRID = "grid-cols-[minmax(0,1fr)_130px_90px_70px]";

/** A single document as a dense list row. Click opens the review modal. */
export function DocRow({ doc, onOpen }: { doc: ExpectedDoc; onOpen: (d: ExpectedDoc) => void }) {
  return (
    <button
      onClick={() => onOpen(doc)}
      className={cn(
        "grid w-full items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2.5 text-left transition-colors last:border-0 hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]",
        DOC_ROW_GRID,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--os-selected)] text-[var(--os-ink-subtle)]"><Icon icon={I.file} size={14} /></span>
        <span className="truncate text-[13px] font-medium text-[var(--os-ink)]">{doc.source}</span>
        <span className="hidden shrink-0 text-[11px] text-[var(--os-ink-subtle)] sm:inline">{doc.type}</span>
      </div>
      <div><StatusDot status={doc.status} /></div>
      <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{doc.receivedVia ?? "-"}</div>
      <div className="text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{doc.when ?? ""}</div>
    </button>
  );
}

function GridGlyph({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" /></svg>;
}
function ListGlyph({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden><rect x="1.5" y="3" width="13" height="1.8" rx="0.9" /><rect x="1.5" y="7.1" width="13" height="1.8" rx="0.9" /><rect x="1.5" y="11.2" width="13" height="1.8" rx="0.9" /></svg>;
}

/** Grid / list segmented toggle, shared by the Documents page and the client record Documents tab. */
export function DocLayoutToggle({ layout, onChange }: { layout: "grid" | "list"; onChange: (l: "grid" | "list") => void }) {
  const btn = (active: boolean) =>
    cn(
      "grid size-6 place-items-center rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
      active ? "bg-[var(--os-surface)] text-[var(--os-ink)] shadow-sm" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]",
    );
  return (
    <div className="flex items-center gap-0.5 rounded-md bg-[var(--os-bg-subtle)] p-0.5">
      <button onClick={() => onChange("list")} aria-label="List view" className={btn(layout === "list")}><ListGlyph className="size-3.5" /></button>
      <button onClick={() => onChange("grid")} aria-label="Grid view" className={btn(layout === "grid")}><GridGlyph className="size-3.5" /></button>
    </div>
  );
}

/* ── Review modal: faux page left, extraction diff + provenance right ── */
export function ReviewModal({ doc, onClose }: { doc: ExpectedDoc; onClose: () => void }) {
  const [decision, setDecision] = useState<"confirmed" | "sent_back" | null>(null);
  const [reminderQueued, setReminderQueued] = useState(false);
  const eng = engagementById(doc.engagementId);
  const household = eng ? householdById(eng.householdId) : undefined;
  const run = runForDoc(doc);
  const isReq = doc.status === "requested";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const primaryBtn = "flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
  const secondaryBtn = "flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] text-[var(--os-ink)] hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={onClose} className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }} onClick={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={doc.source}
        className="flex max-h-[82vh] w-full max-w-[920px] flex-col overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
      >
        <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] px-5 py-3 text-[12px] text-[var(--os-ink-subtle)]">
          <Icon icon={I.file} size={13} /> <span>{doc.type}</span>
          <Icon icon={I.chevronRight} size={12} />
          {household && eng ? (
            <Link href={`/os/clients/${household.id}`} className="text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]">
              {household.name} · {eng.form} · {eng.taxYear}
            </Link>
          ) : null}
          <span className="ml-2 truncate text-[13px] font-semibold text-[var(--os-ink)]">{doc.source}</span>
          <button onClick={onClose} aria-label="Close" className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"><Icon icon={I.close} size={15} /></button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          {/* the page */}
          <div className="flex min-w-0 flex-1 items-start justify-center overflow-y-auto bg-[var(--os-bg-subtle)] p-8">
            {isReq ? (
              <div className="mt-12 flex flex-col items-center text-center">
                <span className="grid size-12 place-items-center rounded-xl border border-dashed border-[var(--os-border-strong)] text-[var(--os-ink-subtle)]"><Icon icon={I.file} size={22} /></span>
                <div className="mt-3 text-[13px] font-medium text-[var(--os-ink)]">Not received yet</div>
                {doc.note && <p className="mt-1 max-w-[280px] text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{doc.note}</p>}
              </div>
            ) : (
              <div className="w-full max-w-[420px] rounded-lg border border-[var(--os-border)] bg-white p-7 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[var(--os-border)] pb-3">
                  <Icon icon={I.file} size={16} className="text-[var(--os-ink-subtle)]" />
                  <span className="text-[13px] font-semibold text-[var(--os-ink)]">{doc.type}</span>
                  <span className="ml-auto truncate font-mono text-[10px] text-[var(--os-ink-subtle)]">{doc.source}</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {(doc.fields ?? [{ label: "" }, { label: "" }, { label: "" }]).map((f, i) => (
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

          {/* the panel */}
          <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-[var(--os-border)] px-4 py-4 sm:w-[340px] sm:border-l sm:border-t-0">
            {isReq ? (
              <>
                <div className="os-label mb-1.5">Status</div>
                <StatusDot status={doc.status} />
                {doc.note && <p className="mt-3 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{doc.note}</p>}
                {reminderQueued ? (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--os-ink)]">
                      <Icon icon={I.check} size={14} className="text-emerald-600" /> Queued - lands in Tasks
                    </span>
                    {household && <Link href={`/os/clients/${household.id}`} className={secondaryBtn}>Open record</Link>}
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-1.5">
                    <button onClick={() => setReminderQueued(true)} className={primaryBtn}><PetalMark className="size-3.5" /> Send reminder</button>
                    {household && <Link href={`/os/clients/${household.id}`} className={secondaryBtn}>Open record</Link>}
                  </div>
                )}
              </>
            ) : doc.fields ? (
              <>
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                  <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />
                  <span className="text-[12px] font-medium text-[var(--os-ink-muted)]">Petal extracted</span>
                  <StatusDot status={doc.status} className="ml-auto" />
                </div>
                {doc.note && <p className="mb-3 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{doc.note}</p>}

                <div className="os-label mb-1.5">Extraction diff</div>
                <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                  {doc.fields.map((f, i) => {
                    const low = lowConfidence(f);
                    return (
                      <div key={i} className={cn("px-3 py-2", low && "bg-amber-50/60")}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[12px] text-[var(--os-ink-muted)]">{f.label}</span>
                          <span className="flex items-baseline gap-2">
                            <span className={cn("text-right text-[12px] font-medium tabular-nums", low ? "text-amber-700" : "text-[var(--os-ink)]")}>{f.value}</span>
                            <span className={cn("text-[10.5px] tabular-nums", low ? "font-medium text-amber-700" : "text-[var(--os-ink-subtle)]")}>
                              {Math.round(f.confidence * 100)}%{low ? " · review" : ""}
                            </span>
                          </span>
                        </div>
                        {i === 0 && doc.priorYearValue && (
                          <div className="mt-0.5 text-right text-[11px] tabular-nums text-[var(--os-ink-subtle)]">2024: {doc.priorYearValue}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {run && <ProvenancePanel runId={run.id} className="mt-3" />}

                {doc.status === "needs_review" ? (
                  decision === null ? (
                    <div className="mt-3 flex items-center gap-1.5">
                      <button onClick={() => setDecision("confirmed")} className={primaryBtn}><Icon icon={I.check} size={14} /> Confirm &amp; file</button>
                      <button onClick={() => setDecision("sent_back")} className={secondaryBtn}><Icon icon={I.sendBack} size={14} /> Send back</button>
                    </div>
                  ) : decision === "confirmed" ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--os-ink)]">
                      <Icon icon={I.check} size={14} className="text-emerald-600" /> Confirmed &amp; filed
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                      <Icon icon={I.sendBack} size={14} /> Sent back - Petal will re-extract
                    </div>
                  )
                ) : (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                    <Icon icon={I.check} size={14} className="text-emerald-600" /> In hand - filed to the engagement
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="os-label mb-1.5">Status</div>
                <StatusDot status={doc.status} />
                {(doc.receivedVia || doc.when) && (
                  <div className="mt-2 text-[12px] text-[var(--os-ink-muted)]">
                    {doc.receivedVia ? `Received via ${doc.receivedVia}` : ""}{doc.receivedVia && doc.when ? " · " : ""}{doc.when ?? ""}
                  </div>
                )}
                {doc.note && <p className="mt-3 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{doc.note}</p>}
              </>
            )}
          </aside>
        </div>
      </motion.div>
    </motion.div>
  );
}
