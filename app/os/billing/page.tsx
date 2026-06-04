"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { AgentAvatar } from "@/components/os/primitives";
import { agents } from "@/lib/os-agents";
import {
  invoices, invoiceStatusMeta, outstandingTotal, outstandingCount,
  overdueTotal, overdueInvoices, collectedTotal, billedTotal,
  type Invoice, type InvoiceStatus,
} from "@/lib/os-billing";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const money = (n: number) => `$${n.toLocaleString()}`;
const docChase = agents.find(a => a.id === "a-chase");

const COLS = "grid-cols-[minmax(200px,1.7fr)_148px_104px_104px_108px_120px]";

type Tab = "all" | "outstanding" | "overdue" | "paid";
const TABS: { key: Tab; label: string; filter: (i: Invoice) => boolean }[] = [
  { key: "all", label: "All invoices", filter: () => true },
  { key: "outstanding", label: "Outstanding", filter: i => i.status === "balance_due" || i.status === "overdue" },
  { key: "overdue", label: "Overdue", filter: i => i.status === "overdue" },
  { key: "paid", label: "Paid", filter: i => i.status === "paid" },
];

function StatusTag({ status, className }: { status: InvoiceStatus; className?: string }) {
  const m = invoiceStatusMeta[status];
  return <span className={cn("inline-flex items-center gap-1.5 text-[12px]", m.accent, className)}><span className={cn("size-1.5 shrink-0 rounded-full", m.dot)} /> {m.label}</span>;
}

/** Mercury-style toolbar pill. */
function Pill({ label, icon, chevron, active, onClick }: { label: string; icon?: typeof I.filter; chevron?: boolean; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] transition-colors", active ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] text-[var(--os-ink)]" : "border-[var(--os-border)] bg-[var(--os-surface)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}>
      {icon && <Icon icon={icon} size={14} className="text-[var(--os-ink-subtle)]" />}
      {label}
      {chevron && <Icon icon={I.chevronDown} size={13} className="text-[var(--os-ink-subtle)]" />}
    </button>
  );
}

/** Inline summary stat — no box (Mercury). */
function Stat({ label, value, sub, valueClass, dot }: { label: string; value: string; sub: string; valueClass?: string; dot?: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">{dot && <span className={cn("size-1.5 rounded-full", dot)} />}{label}</div>
      <div className={cn("mt-1 text-[22px] font-semibold leading-none tabular-nums os-display", valueClass)}>{value}</div>
      <div className="mt-1 text-[11px] text-[var(--os-ink-subtle)]">{sub}</div>
    </div>
  );
}

function Drawer({ inv, onClose }: { inv: Invoice; onClose: () => void }) {
  const chase = inv.status === "overdue" || inv.status === "balance_due";
  const heroLabel = inv.status === "paid" ? "Paid in full" : inv.status === "overdue" ? "Balance overdue" : "Balance due";
  return (
    <motion.aside
      key={inv.id}
      initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="flex w-[392px] shrink-0 flex-col overflow-y-auto border-l border-[var(--os-border)] bg-[var(--os-surface)]"
    >
      <div className="flex items-start gap-2 px-5 pb-4 pt-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[11px] font-medium text-[var(--os-ink-muted)]">{initials(inv.clientName)}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-[var(--os-ink)]">{inv.clientName}</div>
          <div className="text-[12px] text-[var(--os-ink-subtle)]">{inv.number} · {inv.serviceTier}</div>
        </div>
        <button onClick={onClose} className="grid size-6 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={15} /></button>
      </div>

      <div className="px-5">
        <div className="text-[12px] text-[var(--os-ink-muted)]">{heroLabel}</div>
        <div className={cn("mt-1 text-[30px] font-semibold leading-none tabular-nums os-display", inv.status === "overdue" && "text-[var(--os-danger)]")}>{money(inv.status === "paid" ? inv.invoiced : inv.balance)}</div>
        <StatusTag status={inv.status} className="mt-2.5" />
      </div>

      {/* issued → due timeline */}
      <div className="mt-5 px-5">
        <div className="flex gap-2.5">
          <div className="flex flex-col items-center pt-0.5">
            <span className="size-2 rounded-full border-2 border-[var(--os-border-strong)]" />
            <span className="my-0.5 w-px flex-1 bg-[var(--os-border)]" />
            <span className="size-2 rounded-full bg-[var(--os-ink)]" />
          </div>
          <div className="flex-1 space-y-3 pb-0.5">
            <div>
              <div className="text-[13px] text-[var(--os-ink)]">Invoice issued</div>
              <div className="text-[11px] text-[var(--os-ink-subtle)]">{inv.issued}</div>
            </div>
            <div>
              <div className="text-[13px] text-[var(--os-ink)]">{inv.status === "paid" ? "Paid in full" : inv.due}</div>
              <div className="text-[11px] text-[var(--os-ink-subtle)]">{inv.status === "paid" ? "Settled" : "Balance due on filing"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* breakdown */}
      <div className="mx-5 mt-5 divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
        {[["Invoiced", inv.invoiced, false], ["Collected", inv.collected, false], ["Balance", inv.balance, true]].map(([label, val, bold]) => (
          <div key={label as string} className="flex items-center justify-between px-3 py-2">
            <span className="text-[12px] text-[var(--os-ink-muted)]">{label as string}</span>
            <span className={cn("text-[12px] tabular-nums", bold ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>{money(val as number)}</span>
          </div>
        ))}
      </div>

      {/* Petal reminder (AI layer) */}
      {chase && (
        <div className="mx-5 mt-4 rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] p-3">
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
            <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" /> Petal drafted a payment reminder
            {docChase && <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--os-ink-subtle)]"><AgentAvatar gradient={docChase.gradient} icon={docChase.glyph} size={16} /> Doc Chase</span>}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.mail} size={14} /> Review draft</button>
            <Link href={`/os/clients/${inv.householdId}`} className="flex h-7 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px]">Open record</Link>
          </div>
        </div>
      )}

      {/* notes */}
      <div className="mt-4 px-5">
        <div className="os-label mb-1.5">Notes</div>
        <textarea placeholder="Add a note for this invoice" className="h-16 w-full resize-none rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-2 text-[12px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)] focus:border-[var(--os-border-strong)]" />
      </div>

      {/* attachments */}
      <div className="mt-4 px-5 pb-5">
        <div className="os-label mb-1.5">Attachments</div>
        <div className="grid place-items-center gap-1 rounded-lg border border-dashed border-[var(--os-border-strong)] px-3 py-4 text-center">
          <Icon icon={I.attach} size={16} className="text-[var(--os-ink-subtle)]" />
          <div className="text-[12px] text-[var(--os-ink-muted)]">Drag a receipt or click to upload</div>
        </div>
        <div className="mt-2 text-[11px] text-[var(--os-ink-subtle)]">or email invoices to <span className="text-[var(--os-accent)]">billing@vazant.co</span></div>
      </div>

      {/* comment */}
      <div className="mt-auto border-t border-[var(--os-border)] px-5 py-3">
        <input placeholder="Add a comment" className="h-8 w-full rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)] focus:border-[var(--os-border-strong)]" />
      </div>
    </motion.aside>
  );
}

export default function BillingPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [statusOpen, setStatusOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const activeTab = TABS.find(t => t.key === tab)!;
  const rows = invoices.filter(activeTab.filter);
  const counts = TABS.reduce<Record<string, number>>((a, t) => { a[t.key] = invoices.filter(t.filter).length; return a; }, {});
  const selectedInv = selected ? invoices.find(i => i.id === selected) ?? null : null;

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-4 py-2.5">
        <Icon icon={I.returns} size={17} className="text-[var(--os-ink-muted)]" />
        <h1 className="text-[15px] font-semibold os-display">Billing</h1>
        <span className="text-[12px] text-[var(--os-ink-subtle)]">Accounts receivable</span>
        <button className="ml-auto flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.plus} size={15} /> New invoice</button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            {/* toolbar — Mercury pills */}
            <div className="flex items-center gap-2">
              <Pill label="Filters" icon={I.filter} />
              <Pill label="Date" chevron />
              <div className="relative">
                <Pill label={tab === "all" ? "Status" : `Status: ${activeTab.label}`} icon={I.sort} chevron active={tab !== "all"} onClick={() => setStatusOpen(o => !o)} />
                {statusOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                    <div className="absolute left-0 top-9 z-20 w-48 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-lg">
                      {TABS.map(t => (
                        <button key={t.key} onClick={() => { setTab(t.key); setStatusOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                          {t.label}
                          <span className="ml-auto tabular-nums text-[11px] text-[var(--os-ink-subtle)]">{counts[t.key]}</span>
                          {tab === t.key && <Icon icon={I.check} size={13} className="text-[var(--os-ink)]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Pill label="Amount" chevron />
            </div>

            {/* inline summary stats — no boxes */}
            <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
              <Stat label="Outstanding" value={money(outstandingTotal)} sub={`${outstandingCount} invoices awaiting payment`} />
              <Stat label="Overdue" value={money(overdueTotal)} sub={`${overdueInvoices.length} past due · Petal can chase`} valueClass="text-[var(--os-danger)]" dot="bg-red-500" />
              <Stat label="Collected this season" value={money(collectedTotal)} sub={`of ${money(billedTotal)} billed`} />
            </div>

            {/* table */}
            <div className="mt-6">
              <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2", COLS)}>
                {["Client", "Status", "Invoiced", "Collected", "Balance", "Due"].map((h, i) => (
                  <div key={h} className={cn("os-label", i >= 2 && i <= 4 && "text-right")}>{h}</div>
                ))}
              </div>
              {rows.map(inv => (
                <button key={inv.id} onClick={() => setSelected(inv.id)} className={cn("grid w-full items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2.5 text-left transition-colors hover:bg-[var(--os-hover)]", selected === inv.id && "bg-[var(--os-selected)]", COLS)}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(inv.clientName)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{inv.clientName}</div>
                      <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{inv.number} · {inv.serviceTier}</div>
                    </div>
                  </div>
                  <StatusTag status={inv.status} />
                  <div className="text-right text-[13px] tabular-nums text-[var(--os-ink-muted)]">{money(inv.invoiced)}</div>
                  <div className="text-right text-[13px] tabular-nums text-[var(--os-ink-muted)]">{money(inv.collected)}</div>
                  <div className={cn("text-right text-[13px] font-medium tabular-nums", inv.balance === 0 ? "text-[var(--os-ink-subtle)]" : inv.status === "overdue" ? "text-[var(--os-danger)]" : "text-[var(--os-ink)]")}>{money(inv.balance)}</div>
                  <div className={cn("text-[12px]", inv.status === "overdue" ? "text-[var(--os-danger)]" : "text-[var(--os-ink-muted)]")}>{inv.due}</div>
                </button>
              ))}

              {/* pagination footer */}
              <div className="flex items-center gap-3 px-2 py-3 text-[12px] text-[var(--os-ink-muted)]">
                <span className="tabular-nums">{rows.length} invoices</span>
                <div className="ml-auto flex items-center gap-0.5">
                  <button className="grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)]"><Icon icon={I.chevronLeft} size={15} /></button>
                  <button className="grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)]"><Icon icon={I.chevronRight} size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>{selectedInv && <Drawer inv={selectedInv} onClose={() => setSelected(null)} />}</AnimatePresence>
      </div>
    </div>
  );
}
