"use client";

// Task detail panel — the right pane of /os/tasks (also openable via ?task= deep links).
// Renders the canonical Task shape from lib/fixtures/firm: why · proposed actions (A/B/C,
// recommended highlighted) · the drafted artifact ("Petal drafted", monochrome mark) ·
// ProvenancePanel when a run exists · deep links to the notice and the client record.
// Exactly ONE primary verb, from taskStatusMeta[status].verb.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { StatusPill, DeadlineChip, SkillPetal } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { householdById, skillById, type Task } from "@/lib/fixtures/firm";
import { taskStatusMeta } from "@/lib/fixtures/vocab";

/* ── quiet toast (the action keeps its name: "Approve & send" → "Approved & sent") ── */
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  };
  return { msg, show };
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 6, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 6, x: "-50%" }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="fixed bottom-5 left-1/2 z-50 rounded-md bg-[var(--os-primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--os-primary-fg)] shadow-sm"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const PRIMARY_BTN =
  "flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]";
const GHOST_BTN =
  "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)] disabled:cursor-not-allowed disabled:opacity-50";
const LINK_BTN =
  "inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

export function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const skill = skillById(task.skillId);
  const household = householdById(task.householdId);
  const verb = taskStatusMeta[task.status].verb;
  const verbLabel = verb === "Approve" && task.draftText ? "Approve & send" : verb;

  const [chosen, setChosen] = useState<"A" | "B" | "C" | undefined>(task.recommendedAction);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.draftText ?? "");
  const [editLogged, setEditLogged] = useState(false);
  const { msg, show } = useToast();

  // Reset local state when the panel switches tasks.
  useEffect(() => {
    setChosen(task.recommendedAction);
    setEditing(false);
    setDraft(task.draftText ?? "");
    setEditLogged(false);
  }, [task.id, task.recommendedAction, task.draftText]);

  function onPrimary() {
    if (!verbLabel) return;
    if (verbLabel === "Decide") {
      const opt = task.proposedActions?.find(a => a.key === chosen);
      show(chosen ? `Decided ${chosen}${opt ? ` — ${opt.label}` : ""}` : "Decided");
    } else if (verbLabel === "Approve & send") {
      show("Approved & sent");
    } else if (verbLabel === "Approve") {
      show("Approved");
    } else if (verbLabel === "Nudge") {
      show("Nudge sent");
    }
  }

  const primaryIcon =
    verbLabel === "Nudge" ? I.mail : verbLabel === "View run" ? I.history : I.check;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* header */}
      <div className="border-b border-[var(--os-border)] px-6 py-4">
        {/* breadcrumb: skill › client */}
        <div className="mb-2 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
          {skill && (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[var(--os-ink-muted)]">
              <SkillPetal category={skill.category} size={14} /> {skill.name}
            </span>
          )}
          <Icon icon={I.chevronRight} size={12} className="shrink-0" />
          <Link
            href={`/os/clients/${task.householdId}`}
            className="truncate text-[var(--os-ink-muted)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
          >
            {household?.name}
          </Link>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
          >
            <Icon icon={I.close} size={15} />
          </button>
        </div>

        <h2 className="os-display text-[15px] font-semibold text-[var(--os-ink)]">{task.title}</h2>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--os-ink-subtle)]">
          <span>{task.kind}</span>
          {task.estimatedMin > 0 && <span>~{task.estimatedMin} min</span>}
          <StatusPill status={task.status} />
          {task.deadline && <DeadlineChip iso={task.deadline} />}
          {task.flagged && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--os-warning)]">
              <Icon icon={I.flag} size={12} /> Flagged
            </span>
          )}
          {task.feeContext && <span className="text-[11px]">{task.feeContext}</span>}
        </div>

        {/* actions — the ONE primary verb + ghost Edit + ghost Skip */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {verbLabel === "View run" && task.runId ? (
            <Link href={`/os/activity?run=${task.runId}`} className={PRIMARY_BTN}>
              <Icon icon={primaryIcon} size={14} /> View run
            </Link>
          ) : verbLabel ? (
            <button onClick={onPrimary} className={PRIMARY_BTN}>
              <Icon icon={primaryIcon} size={14} /> {verbLabel}
            </button>
          ) : null}
          <button
            onClick={() => setEditing(e => !e)}
            disabled={!task.draftText}
            className={GHOST_BTN}
          >
            <Icon icon={I.edit} size={14} /> Edit
          </button>
          <button onClick={onClose} className={GHOST_BTN}>
            Skip
          </button>
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {/* why */}
        <section>
          <div className="os-label mb-1.5">Why</div>
          <p className="text-[13px] leading-relaxed text-[var(--os-ink-muted)]">{task.why}</p>
        </section>

        {/* proposed actions — A/B/C, recommended highlighted */}
        {task.proposedActions && task.proposedActions.length > 0 && (
          <section className="mt-6">
            <div className="os-label mb-2">Proposed actions</div>
            <div className="space-y-2">
              {task.proposedActions.map(a => {
                const isRec = task.recommendedAction === a.key;
                const isChosen = chosen === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => setChosen(a.key)}
                    aria-pressed={isChosen}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
                      isChosen
                        ? "border-[var(--os-border-strong)] bg-[var(--os-surface)] ring-1 ring-[var(--os-border-strong)]"
                        : "border-[var(--os-border)] hover:border-[var(--os-border-strong)]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded border text-[11px] font-semibold",
                          isChosen
                            ? "border-[var(--os-primary)] bg-[var(--os-primary)] text-[var(--os-primary-fg)]"
                            : "border-[var(--os-border-strong)] text-[var(--os-ink-muted)]",
                        )}
                      >
                        {a.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--os-ink)]">{a.label}</span>
                      {isRec && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--os-ink-muted)]">
                          <PetalMark className="size-3" /> Petal recommends {a.key}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 pl-7 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{a.detail}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* recommendation */}
        {task.recommendation && (
          <p className="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">
            <PetalMark className="mt-0.5 size-3 shrink-0" />
            <span>{task.recommendation}</span>
          </p>
        )}

        {/* the drafted artifact — Petal-marked, monochrome */}
        {task.draftText && (
          <section className="mt-6">
            <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
              <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-1.5">
                <PetalMark className="size-3 shrink-0 text-[var(--os-ink-muted)]" />
                <span className="text-[11px] font-medium text-[var(--os-ink-muted)]">Petal drafted</span>
                {skill && <span className="ml-auto text-[11px] text-[var(--os-ink-subtle)]">{skill.name}</span>}
              </div>
              {editing ? (
                <div className="p-2">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    rows={6}
                    autoFocus
                    aria-label="Edit draft"
                    className="w-full resize-y rounded-md border border-[var(--os-border-strong)] bg-white p-2.5 text-[13px] leading-relaxed text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                  />
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <button onClick={() => { setEditing(false); setEditLogged(true); }} className={PRIMARY_BTN}>
                      <Icon icon={I.check} size={14} /> Save edit
                    </button>
                    <button
                      onClick={() => { setEditing(false); setDraft(task.draftText ?? ""); }}
                      className={GHOST_BTN}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line px-3.5 py-3 text-[13px] leading-relaxed text-[var(--os-ink)]">{draft}</p>
              )}
            </div>
            {editLogged && !editing && (
              <p className="mt-1.5 text-[11px] text-[var(--os-ink-subtle)]">Edit logged — Petal will learn from this edit.</p>
            )}
          </section>
        )}

        {/* sources & reasoning — every Petal artifact carries provenance */}
        {task.runId && (
          <section className="mt-6">
            <ProvenancePanel runId={task.runId} />
          </section>
        )}

        {/* deep links */}
        <section className="mt-6 flex flex-wrap items-center gap-1.5 pb-2">
          {task.noticeId && (
            <Link href={`/os/notices/${task.noticeId}`} className={LINK_BTN}>
              <Icon icon={I.file} size={13} /> View notice <Icon icon={I.chevronRight} size={11} />
            </Link>
          )}
          <Link href={`/os/clients/${task.householdId}`} className={LINK_BTN}>
            <Icon icon={I.clients} size={13} /> Open client <Icon icon={I.chevronRight} size={11} />
          </Link>
        </section>
      </div>

      <Toast msg={msg} />
    </div>
  );
}

/** Back-compat alias — older surfaces import { Detail }. */
export const Detail = TaskDetail;
