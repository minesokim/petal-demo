"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { docStatusMeta, type OsDoc, type DocStatus } from "@/lib/os-files";

export function StatusDot({ status }: { status: DocStatus }) {
  const m = docStatusMeta[status];
  return <span className={cn("inline-flex items-center gap-1.5 text-[11px]", m.accent)}><span className={cn("size-1.5 rounded-full", m.dot)} /> {m.label}</span>;
}

/** Stylized document preview — we have no real PDFs in the mock, so render a tasteful faux page. */
export function DocThumb({ doc }: { doc: OsDoc }) {
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

/** A single document tile: faux-page thumbnail + name + status + timestamp. Click opens the review modal. */
export function DocCard({ doc, onOpen, showClient }: { doc: OsDoc; onOpen: (id: string) => void; showClient?: boolean }) {
  return (
    <button onClick={() => onOpen(doc.id)} className="group text-left">
      <DocThumb doc={doc} />
      <div className="mt-2.5 px-0.5">
        <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{doc.name}</div>
        <div className="mt-1 flex items-center gap-2">
          <StatusDot status={doc.status} />
          <span className="ml-auto shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{doc.when}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-[var(--os-ink-subtle)]">{showClient ? `${doc.clientName} · ${doc.context}` : doc.context}</div>
      </div>
    </button>
  );
}

/** A single document as a dense list row (file glyph + name + status + timestamp). Click opens the review modal. */
export function DocRow({ doc, onOpen, showClient }: { doc: OsDoc; onOpen: (id: string) => void; showClient?: boolean }) {
  return (
    <button onClick={() => onOpen(doc.id)} className={cn("grid w-full items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2.5 text-left transition-colors last:border-0 hover:bg-[var(--os-hover)]", showClient ? "grid-cols-[1fr_180px_150px_110px]" : "grid-cols-[1fr_150px_110px]")}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--os-selected)] text-[var(--os-ink-subtle)]"><Icon icon={I.file} size={14} /></span>
        <span className="shrink-0 truncate text-[13px] font-medium text-[var(--os-ink)]">{doc.name}</span>
        {!showClient && doc.context && <span className="hidden min-w-0 truncate text-[12px] text-[var(--os-ink-subtle)] sm:inline">{doc.context}</span>}
      </div>
      {showClient && <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{doc.clientName}</div>}
      <div><StatusDot status={doc.status} /></div>
      <div className="text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{doc.when}</div>
    </button>
  );
}

export type DocLayout = "grid" | "list";

function GridGlyph({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" /></svg>;
}
function ListGlyph({ className }: { className?: string }) {
  return <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden><rect x="1.5" y="3" width="13" height="1.8" rx="0.9" /><rect x="1.5" y="7.1" width="13" height="1.8" rx="0.9" /><rect x="1.5" y="11.2" width="13" height="1.8" rx="0.9" /></svg>;
}

/** Grid / list segmented toggle, shared by the Documents page and the client record Documents tab. */
export function DocLayoutToggle({ value, onChange }: { value: DocLayout; onChange: (v: DocLayout) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md bg-[var(--os-bg-subtle)] p-0.5">
      <button onClick={() => onChange("list")} aria-label="List view" className={cn("grid size-6 place-items-center rounded transition-colors", value === "list" ? "bg-[var(--os-surface)] text-[var(--os-ink)] shadow-sm" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><ListGlyph className="size-3.5" /></button>
      <button onClick={() => onChange("grid")} aria-label="Grid view" className={cn("grid size-6 place-items-center rounded transition-colors", value === "grid" ? "bg-[var(--os-surface)] text-[var(--os-ink)] shadow-sm" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><GridGlyph className="size-3.5" /></button>
    </div>
  );
}

export function ReviewModal({ doc, onClose }: { doc: OsDoc; onClose: () => void }) {
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
