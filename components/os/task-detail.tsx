"use client";

// Task detail panel - the right pane of /os/tasks (also openable via ?task= deep links).
// Renders the canonical Task shape from lib/fixtures/firm: why · proposed actions (A/B/C,
// recommended highlighted) · the drafted artifact ("Petal drafted", monochrome mark) ·
// ProvenancePanel when a run exists · deep links to the notice and the client record.
// Exactly ONE primary verb, from taskStatusMeta[status].verb.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { StatusPill, DeadlineChip, SkillPetal, BookmarkFlag } from "@/components/os/primitives";
import { AssigneePicker } from "@/components/os/assignee-picker";
import { ProvenancePanel } from "@/components/os/provenance";
import { householdById, skillById, type Task } from "@/lib/fixtures/firm";
import { taskStatusMeta } from "@/lib/fixtures/vocab";
import { demoStore } from "@/lib/demo-store";

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

  const [chosen, setChosen] = useState<"A" | "B" | "C" | "other" | undefined>(task.recommendedAction);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.draftText ?? "");
  const [editLogged, setEditLogged] = useState(false);
  // "Something else" - the open-ended escape hatch: redirect Petal in your own words.
  const [otherText, setOtherText] = useState("");
  const [redrafting, setRedrafting] = useState(false);
  const [redrafted, setRedrafted] = useState(false);
  const redraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { msg, show } = useToast();

  // Reset local state when the panel switches tasks.
  useEffect(() => {
    setChosen(task.recommendedAction);
    setEditing(false);
    setDraft(task.draftText ?? "");
    setEditLogged(false);
    setOtherText("");
    setRedrafting(false);
    setRedrafted(false);
    if (redraftTimer.current) clearTimeout(redraftTimer.current);
  }, [task.id, task.recommendedAction, task.draftText]);

  useEffect(() => () => { if (redraftTimer.current) clearTimeout(redraftTimer.current); }, []);

  // Ask Petal to redraft to the preparer's own direction (demo: simulated re-run).
  function askPetalRedraft() {
    const note = otherText.trim();
    if (!note || redrafting) return;
    setRedrafting(true);
    redraftTimer.current = setTimeout(() => {
      setDraft(
        `Updated per your direction - "${note}".\n\nI've revised the response accordingly and flagged the open item for follow-up. Review below and approve when you're ready.`,
      );
      setRedrafting(false);
      setRedrafted(true);
      show("Petal redrafted to your direction");
    }, 1100);
  }

  // Decide / Approve / Approve & send resolve the task and close the panel -
  // the item leaves the needs-you queue across the app (session-only; reload resets).
  function resolveAndClose() {
    demoStore.resolve(task.id);
    window.setTimeout(onClose, 850);
  }

  function onPrimary() {
    if (!verbLabel) return;
    if (verbLabel === "Decide") {
      const opt = task.proposedActions?.find(a => a.key === chosen);
      show(chosen === "other" ? "Decided - your direction" : chosen ? `Decided ${chosen}${opt ? ` - ${opt.label}` : ""}` : "Decided");
      resolveAndClose();
    } else if (verbLabel === "Approve & send") {
      show("Approved & sent");
      resolveAndClose();
    } else if (verbLabel === "Approve") {
      show("Approved");
      resolveAndClose();
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
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--os-ink-muted)]">
              <BookmarkFlag size={12} /> Flagged
            </span>
          )}
          {task.feeContext && <span className="text-[11px]">{task.feeContext}</span>}
        </div>

        {/* actions - the ONE primary verb + ghost Edit + ghost Skip */}
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
          <button onClick={onClose} className={GHOST_BTN}>
            Skip
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--os-ink-subtle)]">Assignee</span>
            <AssigneePicker householdId={task.householdId} align="right" />
          </div>
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {/* why - context callout, set apart with a hairline accent */}
        <section>
          <div className="os-label mb-1.5">Why</div>
          <div className="border-l-2 border-[var(--os-border-strong)] pl-3">
            <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{task.why}</p>
          </div>
        </section>

        {/* proposed actions - A/B/C, recommended highlighted */}
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
                      "relative w-full rounded-md border border-[var(--os-border)] px-3.5 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
                      isChosen ? "bg-[var(--os-card)]" : "hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]",
                    )}
                  >
                    {/* selection stroke - soft gray, no animation */}
                    {isChosen && (
                      <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-[var(--os-ink-subtle)]" />
                    )}
                    <div className="relative flex items-center gap-2.5">
                      <span
                        className={cn(
                          "grid size-[17px] shrink-0 place-items-center rounded-full text-[9px] font-semibold leading-none transition-colors",
                          isChosen
                            ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)]"
                            : "bg-[var(--os-selected)] text-[var(--os-ink-muted)]",
                        )}
                      >
                        {a.key}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--os-ink)]">{a.label}</span>
                      {isRec && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-[5px] bg-[var(--os-selected)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--os-ink-muted)]">
                          <PetalMark className="size-2.5" /> Recommended
                        </span>
                      )}
                    </div>
                    <p className="relative mt-1.5 pl-[30px] text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{a.detail}</p>
                  </button>
                );
              })}
            </div>

            {/* Something else - the open-ended escape: redirect Petal in your own words */}
            <div className="mt-2">
              {chosen !== "other" ? (
                <button
                  onClick={() => setChosen("other")}
                  className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5 text-left text-[12.5px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                >
                  <CornerDownRight className="size-3.5 shrink-0 text-[var(--os-ink-subtle)]" />
                  Something else - tell Petal what to do instead
                </button>
              ) : (
                <div className="rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="mb-1.5 flex items-center gap-1.5 px-0.5">
                    <CornerDownRight className="size-3.5 shrink-0 text-[var(--os-ink-subtle)]" />
                    <span className="text-[12px] font-medium text-[var(--os-ink)]">Something else</span>
                    <button
                      onClick={() => { setChosen(task.recommendedAction); setOtherText(""); }}
                      className="ml-auto rounded px-1 text-[11px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    value={otherText}
                    onChange={e => setOtherText(e.target.value)}
                    rows={2}
                    autoFocus
                    placeholder="e.g. Call Maria to confirm the 1099-INT first, then redraft the dispute."
                    className="w-full resize-y rounded-md border border-[var(--os-border-strong)] bg-white p-2.5 text-[13px] leading-relaxed text-[var(--os-ink)] placeholder:text-[var(--os-ink-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[var(--os-ink-subtle)]">Petal will redraft to your direction.</span>
                    <button onClick={askPetalRedraft} disabled={!otherText.trim() || redrafting} className={PRIMARY_BTN}>
                      <PetalMark className="size-3" /> {redrafting ? "Redrafting…" : "Ask Petal"}
                    </button>
                  </div>
                </div>
              )}
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

        {/* the drafted artifact - Petal-marked, monochrome. Edit lives in the header;
            the body itself is click-to-edit. Appears after a "Something else" redraft too. */}
        {(task.draftText || redrafted) && (
          <section className="mt-6">
            <div className="overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)]">
              <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2">
                <PetalMark className="size-3 shrink-0 text-[var(--os-ink-muted)]" />
                <span className="text-[11px] font-medium text-[var(--os-ink-muted)]">Petal drafted</span>
                {skill && <span className="text-[11px] text-[var(--os-ink-subtle)]">· {skill.name}</span>}
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                  >
                    <Icon icon={I.edit} size={12} /> Edit
                  </button>
                )}
              </div>
              {editing ? (
                <div className="p-2.5">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    rows={6}
                    autoFocus
                    aria-label="Edit draft"
                    className="w-full resize-y rounded-md border border-[var(--os-border-strong)] bg-white p-2.5 text-[13px] leading-relaxed text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                  />
                  <div className="mt-2 flex items-center gap-1.5">
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
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditing(true)}
                  onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditing(true); } }}
                  title="Click to edit"
                  className="group/draft relative cursor-text px-3.5 py-3 transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]"
                >
                  <p className="whitespace-pre-line text-[13px] leading-relaxed text-[var(--os-ink)]">{draft}</p>
                  <Icon
                    icon={I.edit}
                    size={13}
                    className="pointer-events-none absolute right-3 top-3 text-[var(--os-ink-subtle)] opacity-0 transition-opacity group-hover/draft:opacity-100"
                  />
                </div>
              )}
            </div>
            {editLogged && !editing && (
              <p className="mt-1.5 text-[11px] text-[var(--os-ink-subtle)]">Edit logged - Petal will learn from this edit.</p>
            )}
          </section>
        )}

        {/* sources & reasoning - every Petal artifact carries provenance */}
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

/** Back-compat alias - older surfaces import { Detail }. */
export const Detail = TaskDetail;
