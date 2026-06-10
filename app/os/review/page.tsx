"use client";

// Review mode — the full-screen approval queue. Everything "needs you" lands here,
// one item at a time: the artifact on the left, sources & facts on the right,
// Approve / Edit / Skip on real keyboard handlers (A / E / S, Esc exits).
// Queue + counts derive from lib/fixtures; session state is useState only.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { StatusPill, DeadlineChip, SkillPetal } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { needsYouTasks } from "@/lib/fixtures/derive";
import { demoStore } from "@/lib/demo-store";
import { householdById, skillById, type Task } from "@/lib/fixtures/firm";
import { NEEDS_YOU_STATUSES, MINUTES_RETURNED } from "@/lib/fixtures/vocab";

const BTN =
  "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";
const BTN_PRIMARY = cn(BTN, "bg-[var(--os-primary)] text-[var(--os-primary-fg)] hover:opacity-90");
const BTN_SECONDARY = cn(BTN, "border border-[var(--os-border)] bg-[var(--os-surface)] text-[var(--os-ink)] hover:bg-[var(--os-hover)]");
const BTN_GHOST = cn(BTN, "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]");

function Kbd({ children, onDark }: { children: ReactNode; onDark?: boolean }) {
  return (
    <kbd
      className={cn(
        "inline-grid h-4 min-w-4 place-items-center rounded border px-0.5 font-sans text-[10px] font-medium",
        onDark ? "border-white/25 text-white/80" : "border-[var(--os-border-strong)] text-[var(--os-ink-subtle)]",
      )}
    >
      {children}
    </kbd>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="os-label mb-0.5">{label}</div>
      <div className="text-[12px] leading-relaxed text-[var(--os-ink)]">{children}</div>
    </div>
  );
}

/** The drafted-text artifact: a quiet document card, PetalMark as the authorship signal. */
function DraftCard({
  task,
  editing,
  draft,
  onDraftChange,
  textareaRef,
}: {
  task: Task;
  editing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const skill = skillById(task.skillId);
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-3 py-2">
        <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
        <span className="text-[12px] font-medium text-[var(--os-ink)]">Petal drafted</span>
        {skill && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--os-ink-muted)]">
            <SkillPetal category={skill.category} size={12} /> {skill.name}
          </span>
        )}
      </div>
      {editing ? (
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => onDraftChange(e.target.value)}
            rows={8}
            aria-label="Edit draft"
            className="w-full resize-y rounded-md border border-[var(--os-border-strong)] bg-white px-2.5 py-2 text-[13px] leading-relaxed text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
          />
        </div>
      ) : (
        <p className="whitespace-pre-wrap px-3.5 py-3 text-[13px] leading-relaxed text-[var(--os-ink)]">{task.draftText}</p>
      )}
    </div>
  );
}

/** The decision artifact: proposed actions A/B/C with the recommendation called out. */
function DecisionCard({ task }: { task: Task }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-3 py-2">
        <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
        <span className="text-[12px] font-medium text-[var(--os-ink)]">Proposed actions</span>
      </div>
      {task.proposedActions?.map(a => {
        const rec = a.key === task.recommendedAction;
        return (
          <div
            key={a.key}
            className={cn("flex gap-3 border-b border-[var(--os-border)] px-3 py-2.5 last:border-b-0", rec && "bg-white")}
          >
            <span
              className={cn(
                "mt-px grid size-5 shrink-0 place-items-center rounded border text-[11px] font-semibold",
                rec
                  ? "border-[var(--os-primary)] bg-[var(--os-primary)] text-[var(--os-primary-fg)]"
                  : "border-[var(--os-border-strong)] text-[var(--os-ink-muted)]",
              )}
            >
              {a.key}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[var(--os-ink)]">
                {a.label}
                {rec && (
                  <span className="rounded-full border border-[var(--os-border)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--os-ink-muted)]">
                    Petal recommends
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{a.detail}</p>
            </div>
          </div>
        );
      })}
      {task.recommendation && (
        <p className="border-t border-[var(--os-border)] px-3 py-2 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">
          {task.recommendation}
        </p>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();

  // Queue: everything that needs you, decisions first. THE same number as Today + the
  // Tasks badge. Frozen at mount (items resolved this session don't reshuffle the deck).
  const queue = useMemo(
    () =>
      [...needsYouTasks()]
        .filter(t => !demoStore.isResolved(t.id))
        .sort((a, b) => NEEDS_YOU_STATUSES.indexOf(a.status) - NEEDS_YOU_STATUSES.indexOf(b.status)),
    [],
  );
  const n = queue.length;

  const [idx, setIdx] = useState(0);
  const [approved, setApproved] = useState(0);
  const [edited, setEdited] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false); // quiet "edit logged" beat before auto-advance

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const done = idx >= n;
  const task = done ? null : queue[idx];
  const household = task ? householdById(task.householdId) : undefined;
  const skill = task ? skillById(task.skillId) : undefined;
  const hrs = (((approved + edited) * MINUTES_RETURNED.draft) / 60).toFixed(1);
  const progress = n === 0 ? 100 : Math.min((idx / n) * 100, 100);

  const advance = () => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setEditing(false);
    setSaved(false);
    setIdx(i => Math.min(i + 1, n));
  };

  const approve = () => {
    if (!task || editing || saved) return;
    demoStore.resolve(task.id); // the badge + Today decrement live
    setApproved(c => c + 1);
    advance();
  };

  const skip = () => {
    if (!task || editing || saved) return;
    advance();
  };

  const startEdit = () => {
    if (!task?.draftText || saved) return;
    setDraft(task.draftText);
    setEditing(true);
  };

  const saveEdit = () => {
    if (task) demoStore.resolve(task.id); // an edited send is handled too
    setEdited(c => c + 1);
    setEditing(false);
    setSaved(true);
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      setSaved(false);
      setIdx(i => Math.min(i + 1, n));
    }, 1200);
  };

  // Real keyboard handlers — window keydown, cleanup on unmount, ignored while the textarea has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const inField = !!t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable);
      if (e.key === "Escape") {
        e.preventDefault();
        if (editing || inField) {
          setEditing(false);
          return;
        }
        router.push("/os/today");
        return;
      }
      if (inField || editing || done) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "a") {
        e.preventDefault();
        approve();
      } else if (k === "e") {
        e.preventDefault();
        startEdit();
      } else if (k === "s") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Clear any pending auto-advance on unmount.
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  // Focus the editor as it opens.
  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const approveLabel =
    task?.status === "needs_decision" && task.recommendedAction
      ? `Approve recommendation (${task.recommendedAction})`
      : "Approve";

  return (
    <div className="flex h-full flex-col bg-[var(--os-shell)]">
      {/* ── Header: title · position · Esc hint · close ── */}
      <header className="shrink-0">
        <div className="mx-auto flex h-12 w-full max-w-[860px] items-center gap-3 px-4">
          <h1 className="os-display text-[14px] font-semibold text-[var(--os-ink)]">Review</h1>
          {!done && (
            <span className="tabular-nums text-[12px] text-[var(--os-ink-muted)]">
              {idx + 1} of {n}
            </span>
          )}
          <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-[var(--os-ink-subtle)] sm:inline-flex">
            <Kbd>Esc</Kbd> to close
          </span>
          <button
            onClick={() => router.push("/os/today")}
            aria-label="Close review"
            className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
          >
            <Icon icon={I.close} size={14} />
          </button>
        </div>
        {/* thin progress bar */}
        <div className="h-[2px] w-full bg-[var(--os-border)]">
          <div
            className="h-full bg-[var(--os-ink)] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Body ── */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[860px] px-4 py-6">
          <AnimatePresence mode="wait">
            {task ? (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.17, ease: "easeOut" }}
              >
                {/* item header */}
                <div className="mb-4">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                    <span className="os-label">{task.kind}</span>
                    <StatusPill status={task.status} />
                    {task.flagged && <Icon icon={I.flag} size={12} className="text-[var(--os-warning)]" />}
                  </div>
                  <h2 className="os-display text-[20px] font-semibold leading-[26px] text-[var(--os-ink)]">
                    {task.title}
                  </h2>
                  <p className="mt-1.5 max-w-[64ch] text-[13px] leading-relaxed text-[var(--os-ink-muted)]">
                    {task.why}
                  </p>
                </div>

                <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
                  {/* main: the artifact */}
                  <div className="min-w-0 space-y-3">
                    {task.status === "needs_decision" && task.proposedActions?.length ? (
                      <DecisionCard task={task} />
                    ) : null}
                    {task.draftText ? (
                      <DraftCard
                        task={task}
                        editing={editing}
                        draft={draft}
                        onDraftChange={setDraft}
                        textareaRef={textareaRef}
                      />
                    ) : null}
                    {saved && (
                      <p className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                        <Icon icon={I.check} size={13} className="shrink-0 text-[var(--os-success)]" />
                        Edit logged — Petal will learn from this edit
                      </p>
                    )}
                  </div>

                  {/* right rail: provenance + facts (stacks below on small screens) */}
                  <aside className="min-w-0 space-y-3">
                    {task.runId && <ProvenancePanel runId={task.runId} defaultOpen />}
                    <div className="space-y-2.5 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-3 py-2.5">
                      <Fact label="Client">
                        <Link
                          href={`/os/clients/${task.householdId}`}
                          className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                        >
                          {household?.name ?? task.householdId}
                        </Link>
                      </Fact>
                      {task.deadline && (
                        <Fact label="Deadline">
                          <DeadlineChip iso={task.deadline} />
                        </Fact>
                      )}
                      {task.feeContext && <Fact label="Fee">{task.feeContext}</Fact>}
                      {!task.runId && skill && (
                        <Fact label="Skill">
                          <span className="inline-flex items-center gap-1.5">
                            <SkillPetal category={skill.category} size={13} /> {skill.name}
                          </span>
                        </Fact>
                      )}
                    </div>
                  </aside>
                </div>
              </motion.div>
            ) : (
              /* ── End card: the queue is empty ── */
              <motion.div
                key="end"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.17, ease: "easeOut" }}
                className="mx-auto max-w-[480px] pt-16 text-center"
              >
                <PetalMark className="mx-auto size-6 text-[var(--os-ink-muted)]" />
                <h2 className="os-display mt-4 text-[20px] font-semibold leading-[26px] text-[var(--os-ink)]">
                  Queue clear
                </h2>
                <p className="mt-2 tabular-nums text-[13px] text-[var(--os-ink-muted)]">
                  {approved} approved · {edited} edited · ~{hrs} hrs returned
                </p>
                {approved + edited === 0 && (
                  <p className="mt-1 text-[12px] text-[var(--os-ink-subtle)]">
                    Petal will queue the next drafts and decisions here as they land.
                  </p>
                )}
                <button onClick={() => router.push("/os/today")} className={cn(BTN_PRIMARY, "mt-5")}>
                  Back to Today
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Actions bar ── */}
      {!done && (
        <footer className="shrink-0 border-t border-[var(--os-border)] bg-[var(--os-shell)]">
          <div className="mx-auto flex w-full max-w-[860px] flex-wrap items-center gap-2 px-4 py-3">
            {editing ? (
              <>
                <button onClick={saveEdit} className={BTN_PRIMARY}>
                  Save edit
                </button>
                <button onClick={() => setEditing(false)} className={BTN_GHOST}>
                  Cancel
                </button>
                <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-[var(--os-ink-subtle)] sm:inline-flex">
                  <Kbd>Esc</Kbd> cancels the edit
                </span>
              </>
            ) : (
              <>
                <button onClick={approve} disabled={saved} className={BTN_PRIMARY}>
                  {approveLabel} <Kbd onDark>A</Kbd>
                </button>
                <button onClick={startEdit} disabled={!task?.draftText || saved} className={BTN_SECONDARY}>
                  Edit <Kbd>E</Kbd>
                </button>
                <button onClick={skip} disabled={saved} className={BTN_GHOST}>
                  Skip <Kbd>S</Kbd>
                </button>
              </>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
