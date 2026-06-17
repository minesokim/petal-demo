"use client";

// Request documents — an on-demand way to ask a client for outstanding docs.
// Lists the household's not-yet-received expected docs, lets you add a custom
// item + a message, and "sends" it: a waiting_client task lands in the queue so
// the chase is tracked (and nudgeable). Demo-interactive (session task store).

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { engagementsOf, householdById, entityById, docsOfEngagement } from "@/lib/fixtures/firm";
import { demoStore } from "@/lib/demo-store";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

export function RequestDocsButton({
  householdId, engagementId, onToast, className,
}: {
  householdId: string;
  engagementId?: string;
  onToast?: (m: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS, className)}
      >
        <Icon icon={I.mail} size={14} className="text-[var(--os-ink-subtle)]" /> Request documents
      </button>
      {open && <RequestDocsModal householdId={householdId} engagementId={engagementId} onClose={() => setOpen(false)} onToast={onToast} />}
    </>
  );
}

function RequestDocsModal({
  householdId, engagementId, onClose, onToast,
}: {
  householdId: string;
  engagementId?: string;
  onClose: () => void;
  onToast?: (m: string) => void;
}) {
  const hh = householdById(householdId);
  const engs = (engagementId ? engagementsOf(householdId).filter(e => e.id === engagementId) : engagementsOf(householdId));
  const outstanding = engs.flatMap(e => docsOfEngagement(e.id).filter(d => d.status === "requested").map(d => ({ d, eng: e })));

  const [selected, setSelected] = useState<Set<string>>(() => new Set(outstanding.map(x => x.d.id)));
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const count = selected.size + (custom.trim() ? 1 : 0);
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const send = () => {
    if (count === 0) return;
    demoStore.createTask({
      id: demoStore.newId(),
      householdId,
      engagementId: engagementId || undefined,
      status: "waiting_client",
      kind: "Document request",
      title: `Requested ${count} document${count === 1 ? "" : "s"} from ${hh?.name ?? "client"}`,
      why: note.trim() || `Sent a secure request for ${count} outstanding document${count === 1 ? "" : "s"}. Petal nudges automatically if there's no reply.`,
      skillId: "",
      origin: "human",
    });
    onToast?.(`Request sent to ${hh?.name ?? "client"}`);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[6px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={e => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-[460px] flex-col overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[0_16px_48px_rgba(17,17,26,0.2)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--os-border)] px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--os-ink)]">Request documents</h2>
            <p className="text-[12px] text-[var(--os-ink-subtle)]">{hh?.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3.5">
          {outstanding.length > 0 ? (
            <div>
              <div className="os-label mb-1.5">Outstanding documents</div>
              <div className="overflow-hidden rounded-md border border-[var(--os-border)]">
                {outstanding.map(({ d, eng }, i) => {
                  const on = selected.has(d.id);
                  return (
                    <button key={d.id} onClick={() => toggle(d.id)} className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--os-hover)]", i > 0 && "border-t border-[var(--os-border)]")}>
                      <span className={cn("grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors", on ? "border-[var(--os-primary)] bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "border-[var(--os-border-strong)] text-transparent")}><Icon icon={I.check} size={12} /></span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{d.source}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{entityById(eng.entityId)?.name ?? eng.form}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-[var(--os-border-strong)] px-3 py-2.5 text-[12.5px] text-[var(--os-ink-muted)]">All expected documents are in. Add a custom item below if you need something else.</p>
          )}

          <div>
            <label className="os-label mb-1 block">Add another</label>
            <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="e.g. Closing statement for the rental sale" className="w-full rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-1.5 text-[13px] text-[var(--os-ink)] focus:border-[var(--os-border-strong)] focus:outline-none" />
          </div>
          <div>
            <label className="os-label mb-1 block">Message <span className="font-normal normal-case text-[var(--os-ink-subtle)]">· optional</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="A short note the client sees with the request…" className="w-full resize-none rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-1.5 text-[13px] text-[var(--os-ink)] focus:border-[var(--os-border-strong)] focus:outline-none" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-1.5 border-t border-[var(--os-border)] px-4 py-3">
          <span className="text-[12px] text-[var(--os-ink-subtle)]">{count} selected</span>
          <div className="flex items-center gap-1.5">
            <button onClick={onClose} className="h-8 rounded-md px-3 text-[12.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">Cancel</button>
            <button onClick={send} disabled={count === 0} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-40">
              <Icon icon={I.send} size={13} /> Send request
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
