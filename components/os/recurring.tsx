"use client";

// Recurring work — the practice's repeating jobs. The modal lists every template
// (cadence · who it's for · who runs it), lets you flip one on/off, "Run now" to
// fan it out into the live queue this instant, or add a new one. Mirrors the New
// task modal's grammar so the two read as one system.

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { MemberAvatar } from "@/components/os/primitives";
import { firmMembers, isCurrentUser, households } from "@/lib/fixtures/firm";
import {
  recurringStore, useRecurring, matchHouseholds, scopeLabel,
  CADENCE_LABEL, SCOPE_LABEL, type Cadence, type ScopeKey,
} from "@/lib/recurring-store";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const firstName = (n: string) => n.split(" ")[0];
const fieldCls = "w-full rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-1.5 text-[13px] text-[var(--os-ink)] transition-colors focus:border-[var(--os-border-strong)] focus:outline-none";
const pillCls = (on: boolean) =>
  cn(
    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-colors",
    on
      ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] text-[var(--os-ink)]"
      : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
  );

/** who-runs-it glyph + label */
function Runner({ assignee }: { assignee: string }) {
  if (assignee === "petal") return <span className="inline-flex items-center gap-1 text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Petal</span>;
  const m = firmMembers.find(x => x.id === assignee);
  return <span className="inline-flex items-center gap-1 text-[var(--os-ink-muted)]"><MemberAvatar memberId={assignee} size={14} /> {m ? (isCurrentUser(m.id) ? "You" : firstName(m.name)) : "—"}</span>;
}

export function RecurringButton({ onToast, className }: { onToast?: (m: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[12.5px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS, className)}
      >
        <Icon icon={I.history} size={14} className="text-[var(--os-ink-muted)]" /> Recurring
      </button>
      <AnimatePresence>{open && <RecurringModal onClose={() => setOpen(false)} onToast={onToast} />}</AnimatePresence>
    </>
  );
}

function RecurringModal({ onClose, onToast }: { onClose: () => void; onToast?: (m: string) => void }) {
  const templates = useRecurring();
  const [adding, setAdding] = useState(false);

  const run = (id: string, name: string) => {
    const n = recurringStore.run(id);
    onToast?.(n ? `Created ${n} task${n === 1 ? "" : "s"} from "${name}"` : "No matching clients");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={e => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[520px] flex-col overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[0_16px_48px_rgba(17,17,26,0.2)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--os-border)] px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--os-ink)]">Recurring work</h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--os-ink-subtle)]">Jobs that repeat — fan out to the queue on schedule.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
          {templates.length === 0 && !adding && (
            <p className="px-2 py-6 text-center text-[12.5px] text-[var(--os-ink-muted)]">No recurring jobs yet.</p>
          )}
          <div className="space-y-1.5">
            {templates.map(t => {
              const count = matchHouseholds(t.scope).length;
              return (
                <div key={t.id} className={cn("rounded-lg border px-3 py-2.5 transition-colors", t.active ? "border-[var(--os-border)] bg-[var(--os-card)]" : "border-[var(--os-border)] bg-transparent opacity-60")}>
                  <div className="flex items-center gap-2">
                    <span className="grid size-[22px] shrink-0 place-items-center rounded-md bg-[var(--os-selected)]"><Icon icon={I.history} size={13} className="text-[var(--os-ink-muted)]" /></span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--os-ink)]">{t.name}</span>
                    {/* active toggle */}
                    <button
                      onClick={() => recurringStore.toggle(t.id)}
                      role="switch"
                      aria-checked={t.active}
                      aria-label={t.active ? "Pause" : "Activate"}
                      className={cn("relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors", FOCUS, t.active ? "bg-[var(--os-primary)]" : "bg-[var(--os-border-strong)]")}
                    >
                      <span className={cn("absolute top-[2px] size-[14px] rounded-full bg-white shadow-sm transition-transform", t.active ? "translate-x-[14px]" : "translate-x-[2px]")} />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2.5 pl-[30px] text-[11.5px] text-[var(--os-ink-subtle)]">
                    <span className="inline-flex items-center gap-1"><Icon icon={I.calendar} size={12} /> {CADENCE_LABEL[t.cadence]}</span>
                    <span className="text-[var(--os-border-strong)]">·</span>
                    <span className="truncate">{scopeLabel(t.scope)} ({count})</span>
                    <span className="text-[var(--os-border-strong)]">·</span>
                    <Runner assignee={t.assignee} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-[30px]">
                    <button
                      onClick={() => run(t.id, t.name)}
                      disabled={!t.active || count === 0}
                      className={cn("inline-flex h-6 items-center gap-1 rounded-md bg-[var(--os-primary)] px-2 text-[11px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-40", FOCUS)}
                    >
                      <Icon icon={I.sparkle} size={11} /> Run now
                    </button>
                    <span className="text-[11px] text-[var(--os-ink-subtle)]">
                      {t.lastRun ? `Last run ${t.lastRun} · ${t.runCount} created` : `Next ${t.nextRun}`}
                    </span>
                    <button
                      onClick={() => recurringStore.remove(t.id)}
                      aria-label="Delete"
                      className="ml-auto grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"
                    >
                      <Icon icon={I.close} size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {adding ? (
            <NewTemplateForm onDone={() => setAdding(false)} />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className={cn("mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--os-border-strong)] py-2 text-[12.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}
            >
              <Icon icon={I.plus} size={14} /> New recurring job
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function NewTemplateForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [scope, setScope] = useState<ScopeKey>("all");
  const [assignee, setAssignee] = useState("petal");

  const save = () => {
    const n = name.trim();
    if (!n) return;
    recurringStore.create({ name: n, cadence, scope, assignee, nextRun: "Next cycle", active: true });
    onDone();
  };

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] p-3">
      <div>
        <label className="os-label mb-1 block">Name</label>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") save(); }} placeholder="e.g. Quarterly payroll filing" className={fieldCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="os-label mb-1 block">Cadence</label>
          <select value={cadence} onChange={e => setCadence(e.target.value as Cadence)} className={fieldCls}>
            {(Object.keys(CADENCE_LABEL) as Cadence[]).map(c => <option key={c} value={c}>{CADENCE_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="os-label mb-1 block">Applies to</label>
          <select value={scope} onChange={e => setScope(e.target.value)} className={fieldCls}>
            {(Object.keys(SCOPE_LABEL) as ("all" | "books" | "premium")[]).map(s => <option key={s} value={s}>{SCOPE_LABEL[s]}</option>)}
            <option disabled>──────────</option>
            {households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="os-label mb-1.5 block">Run as</label>
        <div className="flex flex-wrap gap-1.5">
          {firmMembers.map(m => (
            <button key={m.id} onClick={() => setAssignee(m.id)} className={pillCls(assignee === m.id)}>
              <MemberAvatar memberId={m.id} size={16} /> {isCurrentUser(m.id) ? "You" : firstName(m.name)}
            </button>
          ))}
          <button onClick={() => setAssignee("petal")} className={pillCls(assignee === "petal")}>
            <PetalMark className="size-3.5" /> Petal
          </button>
        </div>
        {assignee === "petal" && <p className="mt-1.5 text-[11px] text-[var(--os-ink-subtle)]">Each run drafts per client and returns to your queue to approve.</p>}
      </div>
      <div className="flex items-center justify-end gap-1.5 pt-0.5">
        <button onClick={onDone} className="h-8 rounded-md px-3 text-[12.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">Cancel</button>
        <button onClick={save} disabled={!name.trim()} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-40">
          Add job
        </button>
      </div>
    </div>
  );
}
