"use client";

// Review mode - a focused, three-zone task BROWSER over every task. Filters + Mine/Firm
// scope mirror the Tasks page. Center artifact + Petal copilot. Approve (A) / Skip (S)
// on needs-you items; ← / → / Enter to move through the rest. Esc exits.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { PetalLogo } from "@/components/petal-logo";
import { Icon, I } from "@/components/os/icon";
import { StatusPill, DeadlineChip, SkillPetal, BookmarkFlag, ScopeToggle, Segmented, type Scope } from "@/components/os/primitives";
import { AssigneePicker } from "@/components/os/assignee-picker";
import { ProvenancePanel } from "@/components/os/provenance";
import { demoStore } from "@/lib/demo-store";
import { tasks, householdById, skillById, engagementById, CURRENT_USER_ID, type Task } from "@/lib/fixtures/firm";
import { assigneeOf, useAssignVersion } from "@/lib/assign-store";
import { NEEDS_YOU_STATUSES, TASK_STATUS_ORDER, MINUTES_RETURNED, taskStatusMeta } from "@/lib/fixtures/vocab";

const BTN =
  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
const BTN_PRIMARY = cn(BTN, "bg-[var(--os-primary)] text-[var(--os-primary-fg)] shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-[var(--os-primary-hover)]");
const BTN_SECONDARY = cn(BTN, "border border-[var(--os-border-strong)] bg-[var(--os-surface)] text-[var(--os-ink)] shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-[var(--os-hover)]");
const BTN_GHOST = cn(BTN, "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]");
const LINK_BTN = "inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

type SortKey = "status" | "deadline" | "client";
const clientName = (t: Task) => householdById(t.householdId)?.name ?? "";
const isBlocked = (t: Task) => !!(t.engagementId && engagementById(t.engagementId)?.blockedBy);
const sorters: Record<SortKey, (a: Task, b: Task) => number> = {
  status: (a, b) => TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status),
  deadline: (a, b) => (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31"),
  client: (a, b) => clientName(a).localeCompare(clientName(b)),
};

function Kbd({ children, onDark }: { children: ReactNode; onDark?: boolean }) {
  return (
    <kbd className={cn("inline-grid h-4 min-w-4 place-items-center rounded border px-0.5 font-sans text-[10px] font-medium", onDark ? "border-white/25 text-white/80" : "border-[var(--os-border-strong)] text-[var(--os-ink-subtle)]")}>
      {children}
    </kbd>
  );
}

/** filters popover row */
function ToggleRow({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon?: (typeof I)[keyof typeof I]; children: ReactNode }) {
  return (
    <button role="menuitemcheckbox" aria-checked={on} onClick={onClick} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[12.5px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]">
      {icon && <Icon icon={icon} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />}
      <span className="flex-1">{children}</span>
      <span className={cn("grid size-4 shrink-0 place-items-center rounded-[4px] border", on ? "border-[var(--os-primary)] bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "border-[var(--os-border-strong)]")}>
        {on && <Icon icon={I.check} size={11} />}
      </span>
    </button>
  );
}

/** Drafted artifact - editable in place (Edit in the header + click-to-edit body),
 *  mirroring the regular task view. `value`/`onChange` are owned by the parent so the
 *  edited text survives Ask-Petal redrafts. */
function DraftCard({ task, value, onChange }: { task: Task; value: string; onChange: (v: string) => void }) {
  const skill = skillById(task.skillId);
  const [editing, setEditing] = useState(false);
  const [editLogged, setEditLogged] = useState(false);
  const preEdit = useRef(value);

  const startEdit = () => { preEdit.current = value; setEditing(true); };
  const save = () => { setEditing(false); setEditLogged(true); };
  const cancel = () => { onChange(preEdit.current); setEditing(false); };

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)]">
        <div className="flex items-center gap-2 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2">
          <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
          <span className="text-[12px] font-medium text-[var(--os-ink-muted)]">Petal drafted</span>
          {skill && <span className="text-[11px] text-[var(--os-ink-subtle)]">· {skill.name}</span>}
          {!editing && (
            <button onClick={startEdit} className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]">
              <Icon icon={I.edit} size={12} /> Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="p-2.5">
            <textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              rows={6}
              autoFocus
              aria-label="Edit draft"
              className="w-full resize-y rounded-md border border-[var(--os-border-strong)] bg-white p-2.5 text-[13.5px] leading-relaxed text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            />
            <div className="mt-2 flex items-center gap-1.5">
              <button onClick={save} className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]">
                <Icon icon={I.check} size={14} /> Save edit
              </button>
              <button onClick={cancel} className="flex h-7 items-center rounded-md px-2.5 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={startEdit}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startEdit(); } }}
            title="Click to edit"
            className="group/draft relative cursor-text px-4 py-3.5 transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]"
          >
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--os-ink)]">{value}</p>
            <Icon icon={I.edit} size={13} className="pointer-events-none absolute right-3 top-3 text-[var(--os-ink-subtle)] opacity-0 transition-opacity group-hover/draft:opacity-100" />
          </div>
        )}
      </div>
      {editLogged && !editing && (
        <p className="mt-1.5 text-[11px] text-[var(--os-ink-subtle)]">Edit logged - Petal will learn from this edit.</p>
      )}
    </div>
  );
}

/** The interactive artifact - selectable A/B/C, "Something else" redirect, recommendation,
 * and the drafted result. Mirrors the Tasks detail panel. Keyed by task.id so it resets. */
type Chosen = "A" | "B" | "C" | "other" | undefined;
function ReviewArtifact({ task, chosen, onChosen }: { task: Task; chosen: Chosen; onChosen: (c: Chosen) => void }) {
  const household = householdById(task.householdId);
  const [otherText, setOtherText] = useState("");
  const [redrafting, setRedrafting] = useState(false);
  const [redrafted, setRedrafted] = useState(false);
  const [draft, setDraft] = useState(task.draftText ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const hasDecision = task.status === "needs_decision" && !!task.proposedActions?.length;

  function askPetalRedraft() {
    const note = otherText.trim();
    if (!note || redrafting) return;
    setRedrafting(true);
    timer.current = setTimeout(() => {
      setDraft(`Updated per your direction - "${note}".\n\nI've revised the response accordingly and flagged the open item for follow-up. Review below and approve when you're ready.`);
      setRedrafting(false);
      setRedrafted(true);
    }, 1100);
  }

  return (
    <div className="space-y-3">
      {hasDecision && (
        <div>
          <div className="os-label mb-2">Proposed actions</div>
          <div className="space-y-2">
            {task.proposedActions!.map(a => {
              const isRec = task.recommendedAction === a.key;
              const isChosen = chosen === a.key;
              return (
                <button
                  key={a.key}
                  onClick={() => onChosen(a.key as Chosen)}
                  aria-pressed={isChosen}
                  className={cn(
                    "relative w-full rounded-md border border-[var(--os-border)] px-3.5 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
                    isChosen ? "bg-[var(--os-card)]" : "hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]",
                  )}
                >
                  {isChosen && (
                    <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-[var(--os-ink-subtle)]" />
                  )}
                  <div className="relative flex items-center gap-2.5">
                    <span className={cn("grid size-[17px] shrink-0 place-items-center rounded-full text-[9px] font-semibold leading-none transition-colors", isChosen ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>{a.key}</span>
                    <span className="min-w-0 flex-1 text-[13px] font-medium text-[var(--os-ink)]">{a.label}</span>
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

          {/* Something else - the open-ended escape */}
          <div className="mt-2">
            {chosen !== "other" ? (
              <button onClick={() => onChosen("other")} className="flex w-full items-center gap-2 rounded-lg px-3.5 py-2.5 text-left text-[12.5px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                <CornerDownRight className="size-3.5 shrink-0 text-[var(--os-ink-subtle)]" />
                Something else - tell Petal what to do instead
              </button>
            ) : (
              <div className="rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="mb-1.5 flex items-center gap-1.5 px-0.5">
                  <CornerDownRight className="size-3.5 shrink-0 text-[var(--os-ink-subtle)]" />
                  <span className="text-[12px] font-medium text-[var(--os-ink)]">Something else</span>
                  <button onClick={() => { onChosen(task.recommendedAction as Chosen); setOtherText(""); }} className="ml-auto rounded px-1 text-[11px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]">Cancel</button>
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
                  <button onClick={askPetalRedraft} disabled={!otherText.trim() || redrafting} className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.98] disabled:opacity-50">
                    <PetalLogo loading={redrafting} bloom={false} className="size-3" /> {redrafting ? "Redrafting…" : "Ask Petal"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {task.recommendation && !hasDecision && (
        <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">
          <PetalMark className="mt-0.5 size-3 shrink-0" /><span>{task.recommendation}</span>
        </p>
      )}

      {(task.draftText || redrafted) && <DraftCard task={task} value={draft} onChange={setDraft} />}

      {!hasDecision && !task.draftText && !redrafted && (
        <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] p-4 text-[13px] leading-relaxed text-[var(--os-ink)]">{task.why}</div>
      )}
    </div>
  );
}

// ── Petal copilot ─────────────────────────────────────────────
type ChatMsg = { role: "you" | "petal"; text: string };

function petalAnswer(task: Task, householdName: string): string {
  const rec = task.proposedActions?.find(a => a.key === task.recommendedAction);
  if (rec) return `For ${householdName}, I'd take ${task.recommendedAction} - ${rec.label.toLowerCase()}. ${task.recommendation ?? rec.detail} I can redraft to a different option or pull the underlying sources if you want to double-check.`;
  return `${task.recommendation ?? task.why} If you'd like a different angle, tell me what to change and I'll revise the draft.`;
}

function PetalPanel({ task, household }: { task: Task; household?: { name: string } }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]); setInput(""); setThinking(false);
    if (timer.current) clearTimeout(timer.current);
  }, [task.id]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, thinking]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setMessages(m => [...m, { role: "you", text: q }]);
    setInput("");
    setThinking(true);
    timer.current = setTimeout(() => {
      setMessages(m => [...m, { role: "petal", text: petalAnswer(task, household?.name ?? "this client") }]);
      setThinking(false);
    }, 900);
  };

  const suggestions = task.proposedActions?.length
    ? ["Why this recommendation?", "Compare the options", "Suggest a different approach"]
    : task.draftText
      ? ["What should I check before sending?", "Make it more concise", "Pull the sources"]
      : ["Summarize this for me", "What should I do next?", "Pull the sources"];

  const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--os-surface)]">
      {/* conversation / read */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Petal's opening read - plain assistant prose */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Petal</div>
          <p className="text-[13.5px] leading-relaxed text-[var(--os-ink)]">{task.recommendation ?? task.why}</p>
        </div>

        {/* the conversation */}
        {messages.map((m, i) => (
          m.role === "you" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-[var(--os-selected)] px-3.5 py-2 text-[13px] leading-relaxed text-[var(--os-ink)]">{m.text}</div>
            </div>
          ) : (
            <div key={i}>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Petal</div>
              <p className="text-[13.5px] leading-relaxed text-[var(--os-ink)]">{m.text}</p>
            </div>
          )
        ))}
        {thinking && (
          <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--os-ink-muted)]">
            <PetalLogo loading className="size-3.5 shrink-0 text-[var(--os-primary)]" /> Petal is thinking…
          </div>
        )}

        {/* suggested prompts - pill chips before any conversation */}
        {messages.length === 0 && !thinking && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)} className={cn("inline-flex items-center gap-1.5 rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] px-3 py-1.5 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                <PetalMark className="size-3 shrink-0 text-[var(--os-ink-subtle)]" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* composer - clean rounded box (ChatGPT idiom) */}
      <div className="px-3 pb-3">
        <div className="rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] px-3 py-2.5 shadow-[0_1px_2px_rgba(17,17,26,0.04)] transition-colors focus-within:border-[var(--os-border-strong)]">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1}
            placeholder="Ask Petal…"
            className="max-h-28 w-full resize-none bg-transparent text-[13px] leading-relaxed text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
          />
          <div className="mt-1 flex items-center gap-1">
            <button className={cn("grid size-7 place-items-center rounded-full text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)} aria-label="Attach"><Icon icon={I.attach} size={15} /></button>
            <button onClick={() => send(input)} disabled={!input.trim() || thinking} aria-label="Send" className={cn("ml-auto grid size-7 place-items-center rounded-full bg-[var(--os-primary)] text-[var(--os-primary-fg)] transition-opacity disabled:opacity-25", FOCUS)}>
              <Icon icon={I.send} size={14} />
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10.5px] text-[var(--os-ink-subtle)]">Petal can make mistakes. Verify important details.</p>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();

  const [scope, setScope] = useState<Scope>("firm");
  const [sort, setSort] = useState<SortKey>("status");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const [idx, setIdx] = useState(0);
  const [approved, setApproved] = useState(0);
  const [chosen, setChosen] = useState<Chosen>(undefined);
  const assignVersion = useAssignVersion();

  // every task, filtered + sorted like the Tasks page
  const queue = useMemo(() => {
    const list = tasks.filter(t =>
      (!flaggedOnly || t.flagged) &&
      (!blockedOnly || isBlocked(t)) &&
      (scope === "firm" || assigneeOf(t.householdId) === CURRENT_USER_ID),
    );
    return [...list].sort(sorters[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, sort, flaggedOnly, blockedOnly, assignVersion]);
  const n = queue.length;

  // changing a filter restarts the deck
  useEffect(() => { setIdx(0); }, [scope, sort, flaggedOnly, blockedOnly]);

  const activeFilters = (flaggedOnly ? 1 : 0) + (blockedOnly ? 1 : 0) + (sort !== "status" ? 1 : 0);

  const done = idx >= n;
  const task = done ? null : queue[idx];
  const actionable = !!task && NEEDS_YOU_STATUSES.includes(task.status);
  const household = task ? householdById(task.householdId) : undefined;
  const hrs = ((approved * MINUTES_RETURNED.draft) / 60).toFixed(1);
  const progress = n === 0 ? 100 : Math.min((idx / n) * 100, 100);

  // reset the chosen option each time the item changes
  useEffect(() => { setChosen(task?.recommendedAction); }, [task?.id, task?.recommendedAction]);

  const advance = () => setIdx(i => Math.min(i + 1, n));
  const back = () => setIdx(i => Math.max(0, i - 1));
  const jumpTo = (i: number) => setIdx(i);
  const approve = () => { if (!task || !actionable) return; demoStore.resolve(task.id); setApproved(c => c + 1); advance(); };
  const skip = () => { if (!task) return; advance(); };

  // close filters on outside click
  useEffect(() => {
    if (!filtersOpen) return;
    const onDown = (e: MouseEvent) => { if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [filtersOpen]);

  // keyboard - A approve · S skip · ← → / Enter navigate · Esc exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const inField = !!el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT" || el.isContentEditable);
      if (e.key === "Escape") { e.preventDefault(); if (filtersOpen) { setFiltersOpen(false); return; } if (inField) { (el as HTMLElement)?.blur?.(); return; } router.push("/os/today"); return; }
      if (inField || done) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "arrowright") { e.preventDefault(); advance(); }
      else if (k === "arrowleft") { e.preventDefault(); back(); }
      else if (k === "enter") { e.preventDefault(); actionable ? approve() : advance(); }
      else if (k === "a" && actionable) { e.preventDefault(); approve(); }
      else if (k === "s") { e.preventDefault(); skip(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const approveLabel =
    task?.status === "needs_decision"
      ? (chosen === "other" ? "Approve - your direction" : chosen ? `Approve ${chosen}` : "Decide")
      : "Approve & send";

  return (
    <div className="flex h-full flex-col bg-[var(--os-canvas)]">
      {/* ── Header ── */}
      <header className="shrink-0">
        <div className="flex h-12 w-full items-center gap-3 px-5">
          <div className="flex items-center gap-2">
            <PetalMark className="size-4 text-[var(--os-ink-muted)]" />
            <h1 className="os-display text-[14px] font-semibold text-[var(--os-ink)]">Review mode</h1>
          </div>
          {!done && <span className="tabular-nums text-[12px] text-[var(--os-ink-muted)]">{idx + 1} of {n}</span>}

          <div className="ml-auto flex items-center gap-1.5">
            <ScopeToggle scope={scope} onChange={setScope} />
            <div className="relative" ref={filtersRef}>
              <button
                onClick={() => setFiltersOpen(o => !o)}
                aria-expanded={filtersOpen}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
                  activeFilters > 0 || filtersOpen
                    ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] text-[var(--os-ink)]"
                    : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:border-[var(--os-border-strong)] hover:text-[var(--os-ink)]",
                )}
              >
                <SlidersHorizontal className="size-3.5 text-[var(--os-ink-subtle)]" /> Filters
                {activeFilters > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--os-primary)] px-1 text-[10px] font-semibold tabular-nums text-[var(--os-primary-fg)]">{activeFilters}</span>}
                <Icon icon={I.chevronDown} size={12} className={cn("text-[var(--os-ink-subtle)] transition-transform", filtersOpen && "rotate-180")} />
              </button>
              {filtersOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[236px] rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-2 shadow-[0_10px_34px_rgba(17,17,26,0.13)]">
                  <div className="os-label px-2 pb-1.5 pt-0.5">Sort by</div>
                  <div className="px-1.5 pb-2">
                    <Segmented value={sort} onChange={v => setSort(v as SortKey)} options={[{ value: "status", label: "Status" }, { value: "deadline", label: "Deadline" }, { value: "client", label: "Client" }]} />
                  </div>
                  <div className="os-label px-2 pb-1 pt-0.5">Filter</div>
                  <ToggleRow on={flaggedOnly} onClick={() => setFlaggedOnly(v => !v)} icon={I.flag}>Flagged</ToggleRow>
                  <ToggleRow on={blockedOnly} onClick={() => setBlockedOnly(v => !v)} icon={I.alert}>Blocked</ToggleRow>
                  {activeFilters > 0 && (
                    <>
                      <div className="my-1.5 h-px bg-[var(--os-border)]" />
                      <button onClick={() => { setFlaggedOnly(false); setBlockedOnly(false); setSort("status"); }} className="flex w-full items-center justify-center rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">Clear filters</button>
                    </>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => router.push("/os/today")} aria-label="Close review" className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]">
              <Icon icon={I.close} size={14} />
            </button>
          </div>
        </div>
        <div className="h-[2px] w-full bg-[var(--os-border)]">
          <div className="h-full bg-[var(--os-ink)] transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1">
        {/* left: queue */}
        <aside className="hidden w-[256px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)] bg-[var(--os-bg-subtle)] py-3 lg:flex">
          <div className="os-label mb-1 px-4">Queue · {n}</div>
          <div className="px-2">
            {queue.map((q, i) => {
              const qhh = householdById(q.householdId);
              const active = i === idx;
              const resolved = demoStore.isResolved(q.id);
              return (
                <button key={q.id} onClick={() => jumpTo(i)} className={cn("flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors", active ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]")}>
                  {resolved ? (
                    <Icon icon={I.check} size={13} className="mt-0.5 shrink-0 text-[var(--os-success)]" />
                  ) : (
                    <span className={cn("mt-[5px] size-1.5 shrink-0 rounded-full", taskStatusMeta[q.status].dot)} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[12px] font-medium leading-snug", resolved ? "text-[var(--os-ink-subtle)] line-through" : active ? "text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>{q.title}</span>
                    <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">{qhh?.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* center: artifact + actions */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[680px] px-6 py-7">
              <AnimatePresence mode="wait">
                {task ? (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.17, ease: "easeOut" }}>
                    <div className="mb-5">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                        <span className="os-label">{task.kind}</span>
                        <StatusPill status={task.status} />
                        {task.deadline && <DeadlineChip iso={task.deadline} />}
                        {task.flagged && <BookmarkFlag size={13} />}
                      </div>
                      <h2 className="os-display text-[22px] font-semibold leading-[28px] text-[var(--os-ink)]">{task.title}</h2>
                      <Link href={`/os/clients/${task.householdId}`} className="mt-1 inline-block text-[12.5px] text-[var(--os-ink-muted)] hover:text-[var(--os-link)] hover:underline">{household?.name}</Link>
                    </div>

                    <ReviewArtifact key={task.id} task={task} chosen={chosen} onChosen={setChosen} />

                    {/* sources & reasoning - every Petal artifact carries provenance */}
                    {task.runId && (
                      <section className="mt-6">
                        <ProvenancePanel runId={task.runId} defaultOpen />
                      </section>
                    )}

                    {/* deep links - jump to the notice (if any) and the client record */}
                    <section className="mt-5 flex flex-wrap items-center gap-1.5 pb-2">
                      {task.noticeId && (
                        <Link href={`/os/notices/${task.noticeId}`} className={LINK_BTN}>
                          <Icon icon={I.file} size={13} /> View notice <Icon icon={I.chevronRight} size={11} />
                        </Link>
                      )}
                      <Link href={`/os/clients/${task.householdId}`} className={LINK_BTN}>
                        <Icon icon={I.clients} size={13} /> Open client <Icon icon={I.chevronRight} size={11} />
                      </Link>
                    </section>
                  </motion.div>
                ) : (
                  <motion.div key="end" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.17, ease: "easeOut" }} className="mx-auto max-w-[420px] pt-16 text-center">
                    <PetalLogo className="mx-auto size-7 text-[var(--os-primary)]" />
                    <h2 className="os-display mt-4 text-[20px] font-semibold leading-[26px] text-[var(--os-ink)]">{n === 0 ? "No tasks match" : "Queue clear"}</h2>
                    <p className="mt-2 tabular-nums text-[13px] text-[var(--os-ink-muted)]">{approved} approved · ~{hrs} hrs returned</p>
                    <button onClick={() => router.push("/os/today")} className={cn(BTN_PRIMARY, "mt-5")}>Back to Today</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* action bar - Approve (A) / Skip (S) on needs-you; Next / Back otherwise */}
          {!done && (
            <footer className="shrink-0 border-t border-[var(--os-border)] bg-[var(--os-canvas)]">
              <div className="mx-auto flex w-full max-w-[680px] flex-wrap items-center gap-2 px-6 py-3">
                {actionable ? (
                  <>
                    <button onClick={approve} className={BTN_PRIMARY}>{approveLabel} <Kbd onDark>A</Kbd></button>
                    <button onClick={skip} className={BTN_GHOST}>Skip <Kbd>S</Kbd></button>
                  </>
                ) : (
                  <>
                    <button onClick={advance} className={BTN_PRIMARY}>Next <Kbd onDark>→</Kbd></button>
                    {task && taskStatusMeta[task.status].verb === "View run" && task.runId && (
                      <Link href={`/os/activity?run=${task.runId}`} className={BTN_SECONDARY}>View run</Link>
                    )}
                    <button onClick={back} disabled={idx === 0} className={BTN_GHOST}>Back <Kbd>←</Kbd></button>
                  </>
                )}
                {task && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--os-ink-subtle)]">Assignee</span>
                    <AssigneePicker householdId={task.householdId} align="right" placement="up" />
                  </div>
                )}
              </div>
            </footer>
          )}
        </main>

        {/* right: Petal copilot */}
        {task && (
          <aside className="hidden w-[400px] shrink-0 border-l border-[var(--os-border)] bg-[var(--os-surface)] xl:block">
            <PetalPanel key={task.id} task={task} household={household} />
          </aside>
        )}
      </div>
    </div>
  );
}
