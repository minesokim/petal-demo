"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { AgentAvatar } from "@/components/os/primitives";
import { agents } from "@/lib/os-agents";
import { agentRuns, type DiffRow, type RunStep } from "@/lib/os-runs";
import { trustMeta, type TriageItem } from "@/lib/os-triage";

export function agentByName(name?: string) {
  return agents.find(a => a.name === name);
}
export function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

/** Linear-style status: a 6px dot + plain text. No filled pill. */
function StatusDot({ dot, label, className }: { dot: string; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] text-[var(--os-ink)]", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
      {label}
    </span>
  );
}

function Delta({ d }: { d: number }) {
  const up = d > 0;
  const big = Math.abs(d) >= 0.25;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] tabular-nums", big ? "text-[var(--os-warning)]" : "text-[var(--os-ink-subtle)]")}>
      <Icon icon={up ? I.deltaUp : I.deltaDown} size={12} />{Math.abs(Math.round(d * 100))}%
    </span>
  );
}

function DiffLine({ row, onCite }: { row: DiffRow; onCite?: (r: DiffRow) => void }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--os-border)] py-2 last:border-b-0">
      <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", row.kind === "flag" ? "bg-amber-500" : row.kind === "new" ? "bg-emerald-500" : "bg-[var(--os-border-strong)]")} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-[var(--os-ink)]">{row.label}</span>
          <span className="flex items-center gap-2 whitespace-nowrap">
            {row.prior && <span className="text-[12px] tabular-nums text-[var(--os-ink-subtle)] line-through">{row.prior}</span>}
            <span className={cn("text-[13px] font-medium tabular-nums", row.kind === "flag" ? "text-[var(--os-warning)]" : "text-[var(--os-ink)]")}>{row.current}</span>
            {row.delta !== undefined && <Delta d={row.delta} />}
          </span>
        </div>
        {row.cite && (
          <button onClick={() => onCite?.(row)} className="group mt-1 inline-flex items-center gap-1 rounded border border-[var(--os-border)] bg-[var(--os-surface)] px-1.5 py-0.5 text-[11px] text-[var(--os-ink-muted)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
            <Icon icon={I.file} size={11} className="text-[var(--os-ink-subtle)]" /> {row.cite}
            <Icon icon={I.chevronRight} size={11} className="text-[var(--os-ink-subtle)] transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/** The Petal brand element: a contained card with a brand-marked header,
 *  used wherever content was authored by Petal (drafts, recommendations). */
function PetalCard({ label, meta, children }: { label: string; meta?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
      <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-1.5">
        <PetalMark className="size-3 shrink-0 text-[var(--os-ink-muted)]" />
        <span className="text-[11px] font-medium text-[var(--os-ink-muted)]">{label}</span>
        {meta && <span className="ml-auto text-[11px] text-[var(--os-ink-subtle)]">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="os-label mb-1">{label}</div>
      {children}
    </div>
  );
}

/** One agent step in the "what Petal did" timeline. */
function Step({ step, last }: { step: RunStep; last: boolean }) {
  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center">
        {step.active
          ? <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-blue-500"><span className="size-1.5 animate-pulse rounded-full bg-white" /></span>
          : <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500"><Icon icon={I.check} size={10} className="text-white" /></span>}
        {!last && <span className="my-0.5 w-px flex-1 bg-[var(--os-border)]" />}
      </div>
      <div className="min-w-0 pb-3.5">
        <div className="text-[13px] leading-tight text-[var(--os-ink)]">{step.label}</div>
        {step.detail && <div className="mt-0.5 text-[12px] text-[var(--os-ink-muted)]">{step.detail}</div>}
      </div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.8 ? "bg-emerald-500" : value >= 0.65 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-[12px] tabular-nums text-[var(--os-ink-muted)]">{pct}%</span>
    </div>
  );
}

/** Believable abstracted source-document fields, with the cited value highlighted. */
function docFields(row: DiffRow): { k: string; v: string; hi?: boolean }[] {
  const cite = row.cite ?? "";
  if (/W-2/i.test(cite)) return [
    { k: "Box 1 — Wages, tips, other comp.", v: row.current, hi: true },
    { k: "Box 2 — Federal tax withheld", v: "$7,840" },
    { k: "Box 3 — Social security wages", v: row.current },
    { k: "Box 12a — Code D (401k)", v: "$6,000" },
  ];
  if (/1099-B/i.test(cite)) return [
    { k: "Proceeds — 23 lots", v: "$84,200" },
    { k: "Cost basis — reported to IRS", v: "16 lots" },
    { k: "Cost basis — not reported", v: "7 lots", hi: true },
    { k: "Wash-sale adjustments", v: "None" },
  ];
  if (/Txn|csv|export|POS/i.test(cite)) return [
    { k: "Date", v: cite.split("·").pop()?.trim() ?? "—" },
    { k: "Amount", v: row.current.split("—")[0].trim(), hi: true },
    { k: "Description", v: row.current.split("—")[1]?.trim() ?? "Unmatched" },
    { k: "Matched category", v: "None on file" },
  ];
  if (/1098/i.test(cite)) return [
    { k: "Box 1 — Mortgage interest", v: row.current, hi: true },
    { k: "Box 2 — Outstanding principal", v: "$612,000" },
    { k: "Box 3 — Origination date", v: "Mar 2025" },
  ];
  return [
    { k: "Prior year", v: row.prior ?? "—" },
    { k: row.label, v: row.current, hi: true },
    { k: "Basis", v: cite || "Calculated" },
  ];
}

/** Clean abstracted source-document viewer — slides in when a citation is clicked. */
function SourceDoc({ row, onClose }: { row: DiffRow; onClose: () => void }) {
  const parts = (row.cite ?? "Source").split("·").map(s => s.trim());
  const docName = parts[0];
  const locator = parts.slice(1).join(" · ");
  const fields = docFields(row);
  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute inset-y-0 right-0 z-20 flex w-[440px] flex-col border-l border-[var(--os-border)] bg-[var(--os-surface)] shadow-[-8px_0_28px_-16px_rgba(17,17,26,0.25)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Icon icon={I.file} size={15} className="shrink-0 text-[var(--os-ink-muted)]" />
        <span className="truncate text-[13px] font-medium text-[var(--os-ink)]">{docName}</span>
        {locator && <span className="shrink-0 text-[12px] text-[var(--os-ink-subtle)]">{locator}</span>}
        <button onClick={onClose} aria-label="Close source" className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={15} /></button>
      </div>
      <div className="flex-1 overflow-y-auto bg-[var(--os-bg-subtle)] p-5">
        <div className="mx-auto max-w-[340px] rounded-md border border-[var(--os-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 border-b border-dashed border-[var(--os-border)] pb-3 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--os-ink-muted)]">{docName}</div>
            <div className="text-[10px] text-[var(--os-ink-subtle)]">Tax year 2025 · source document</div>
          </div>
          <div className="space-y-1.5">
            {fields.map((f, i) => (
              <div key={i} className={cn("flex items-center justify-between gap-3 rounded px-2 py-1.5 text-[12px]", f.hi && "bg-amber-100 ring-1 ring-amber-300")}>
                <span className="text-[var(--os-ink-muted)]">{f.k}</span>
                <span className={cn("shrink-0 tabular-nums", f.hi ? "font-semibold text-[var(--os-ink)]" : "text-[var(--os-ink)]")}>{f.v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-3 flex max-w-[340px] items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
          <PetalMark className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <p className="text-[12px] leading-relaxed text-amber-800"><span className="font-semibold">{row.current}</span> — {row.label} traces to this field. Petal cited it directly.</p>
        </div>
      </div>
    </motion.div>
  );
}

/** The full task / triage-item detail: header, body (why now, what Petal did, work product), properties rail.
 *  Shared by the Tasks page (master-detail panel) and the client record Tasks tab (modal). */
export function Detail({ item, onClose }: { item: TriageItem; onClose: () => void }) {
  const run = item.runId ? agentRuns.find(r => r.id === item.runId) : undefined;
  const ag = agentByName(item.agent);
  const tm = trustMeta[item.trust];
  const isDone = item.trust === "auto";
  const escalated = run?.status === "escalated";
  const conf = run?.confidence ?? item.confidence;
  const [citedRow, setCitedRow] = useState<DiffRow | null>(null);
  const primary = isDone ? null : escalated ? "Request from client" : run ? "Approve" : item.recommendedReply ? "Approve & send" : "Mark resolved";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* header */}
      <div className="border-b border-[var(--os-border)] px-6 py-3.5">
        <div className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
          {ag && <span className="inline-flex items-center gap-1.5"><AgentAvatar gradient={ag.gradient} size={18} bare /> {ag.name}</span>}
          <Icon icon={I.chevronRight} size={12} />
          <Link href={`/os/clients/${item.householdId}`} className="truncate text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]">{item.clientName}</Link>
          <button onClick={onClose} aria-label="Close" className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={15} /></button>
        </div>
        <h2 className="text-[15px] font-semibold text-[var(--os-ink)]">{item.title}</h2>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
          <span>{item.typeLabel}</span><span>·</span><span>{item.when}</span>
          {item.estimatedMin > 0 && <><span>·</span><span>~{item.estimatedMin} min</span></>}
        </div>

        {/* actions */}
        <div className="mt-3.5 flex items-center gap-1.5">
          {primary ? (
            <>
              <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={escalated ? I.mail : I.check} size={14} /> {primary}</button>
              <button className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] hover:bg-[var(--os-hover)]"><Icon icon={I.edit} size={14} /> Edit</button>
              <button className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] hover:bg-[var(--os-hover)]"><Icon icon={I.sendBack} size={14} /> Send back</button>
              <button className="ml-auto flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.history} size={14} /> Snooze</button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--os-ink-muted)]">
              <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" /> Petal handled this — no action needed
            </span>
          )}
        </div>
      </div>

      {/* body */}
      <div className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
          {escalated && run?.escalation && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
              <Icon icon={I.escalate} size={15} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <div className="text-[12px] font-medium text-rose-800">Petal stopped and escalated</div>
                <div className="text-[12px] leading-snug text-rose-700">{run.escalation}</div>
              </div>
            </div>
          )}

          {/* why now */}
          <Field label="Why now">
            <p className="text-[13px] leading-relaxed text-[var(--os-ink-muted)]">{item.whyNow}</p>
          </Field>

          {/* what Petal did — step timeline */}
          {run && run.steps.length > 0 && (
            <div className="mt-6">
              <div className="os-label mb-2.5">What Petal did</div>
              <div>{run.steps.map((s, i) => <Step key={i} step={s} last={i === run.steps.length - 1} />)}</div>
            </div>
          )}

          {/* the work product — Petal-branded */}
          {run && run.diff.length > 0 && (
            <div className="mt-6">
              <PetalCard label="Petal drafted" meta="click a figure to see its source">
                <div className="px-3.5">
                  {run.diff.map((row, i) => <DiffLine key={i} row={row} onCite={setCitedRow} />)}
                </div>
              </PetalCard>
            </div>
          )}
          {run?.reasoning && (
            <div className="mt-6">
              <div className="os-label mb-1.5 flex items-center gap-1.5"><PetalMark className="size-3 text-[var(--os-ink-muted)]" /> Petal&apos;s reasoning</div>
              <p className="text-[13px] leading-relaxed text-[var(--os-ink-muted)]">{run.reasoning}</p>
            </div>
          )}
          {item.recommendedReply && (
            <div className="mt-6">
              <PetalCard label="Petal drafted a reply" meta="ready to send">
                <p className="px-3.5 py-3 text-[13px] leading-relaxed text-[var(--os-ink)]">{item.recommendedReply}</p>
              </PetalCard>
            </div>
          )}
          {item.recommendation && (
            <div className="mt-6">
              <PetalCard label="Petal recommends">
                <p className="px-3.5 py-3 text-[13px] leading-relaxed text-[var(--os-ink)]">{item.recommendation}</p>
              </PetalCard>
            </div>
          )}
          {item.evidence && item.evidence.length > 0 && (
            <div className="mt-6">
              <div className="os-label mb-1">Evidence</div>
              <div className="border-t border-[var(--os-border)]">
                {item.evidence.map((e, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[var(--os-border)] py-2 text-[13px] last:border-b-0"><span className="text-[var(--os-ink)]">{e.label}</span><span className="text-[var(--os-ink-muted)]">{e.detail}</span></div>
                ))}
              </div>
            </div>
          )}

          {/* next — the chaining loop, quiet */}
          {item.nextStep && (
            <p className="mt-6 text-[12px] leading-relaxed text-[var(--os-ink-subtle)]">
              <span className="text-[var(--os-ink-muted)]">Next</span> &nbsp;{item.nextStep}
            </p>
          )}
        </div>

        {/* properties rail — Linear-quiet */}
        <aside className="w-[216px] shrink-0 space-y-4 overflow-y-auto border-l border-[var(--os-border)] px-4 py-5">
          <div className="os-label">Properties</div>
          <Field label="Status">
            <StatusDot dot={tm.dot} label={tm.label} />
          </Field>
          {ag && (
            <Field label="Agent">
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--os-ink)]">
                <AgentAvatar gradient={ag.gradient} size={18} bare /> {ag.name}
              </span>
            </Field>
          )}
          <Field label="Client">
            <Link href={`/os/clients/${item.householdId}`} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--os-ink)] hover:underline">
              <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]">{initials(item.clientName)}</span>
              {item.clientName}
            </Link>
          </Field>
          {conf !== undefined && (
            <Field label="Confidence">
              <ConfidenceBar value={conf} />
            </Field>
          )}
          <Field label="Sources">
            <div className="space-y-1.5">
              {(run?.sources ?? item.sources).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]"><Icon icon={I.file} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" /><span className="truncate">{s}</span></div>
              ))}
            </div>
          </Field>
          {item.deepLink && (
            <Link href={item.deepLink} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]"><Icon icon={I.escalate} size={13} /> Open in record</Link>
          )}
        </aside>

        <AnimatePresence>{citedRow && <SourceDoc row={citedRow} onClose={() => setCitedRow(null)} />}</AnimatePresence>
      </div>
    </div>
  );
}
