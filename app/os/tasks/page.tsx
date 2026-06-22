"use client";

// /os/tasks - the single work queue. One vocabulary (TASK_STATUS_ORDER + StatusPill),
// one list grouped by status (or by client), exactly ONE primary verb per row from
// taskStatusMeta[status].verb. "Flagged" is a filter chip, not a tab. Every count on
// this page derives from lib/fixtures at render time.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { StatusPill, StatusHeading, DeadlineChip, SkillIcon, MemberAvatar, ScopeToggle, Segmented, BookmarkFlag, type Scope } from "@/components/os/primitives";
import { TaskDetail } from "@/components/os/task-detail";
import { RecurringButton } from "@/components/os/recurring";
import { tasks, households, householdById, skillById, engagementById, engagementsOf, entityById, taskById, firmMembers, isCurrentUser, CURRENT_USER_ID, type Task } from "@/lib/fixtures/firm";
import { demoStore, useLiveNeedsYou, useAllTasks } from "@/lib/demo-store";
import { assigneeOf, useAssignVersion } from "@/lib/assign-store";
import { TASK_STATUS_ORDER, taskStatusMeta, type TaskStatus } from "@/lib/fixtures/vocab";

/* ── derivations on the canonical shapes ── */
const clientName = (t: Task) => householdById(t.householdId)?.name ?? "";
const isBlocked = (t: Task) => !!(t.engagementId && engagementById(t.engagementId)?.blockedBy);
/** The one primary verb. "Approve" becomes "Approve & send" when a draft exists. */
const verbOf = (t: Task) => {
  const v = taskStatusMeta[t.status].verb;
  return v === "Approve" && t.draftText ? "Approve & send" : v;
};

type SortKey = "deadline" | "client" | "status";
const sorters: Record<SortKey, (a: Task, b: Task) => number> = {
  deadline: (a, b) => (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31"),
  client: (a, b) => clientName(a).localeCompare(clientName(b)),
  status: (a, b) => TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status),
};

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

/* ── filters popover row (checkbox menu item) ── */
function ToggleRow({
  on, onClick, icon, children,
}: {
  on: boolean;
  onClick: () => void;
  icon?: (typeof I)[keyof typeof I];
  children: React.ReactNode;
}) {
  return (
    <button
      role="menuitemcheckbox"
      aria-checked={on}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[12.5px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
    >
      {icon && <Icon icon={icon} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />}
      <span className="flex-1">{children}</span>
      <span className={cn("grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors", on ? "border-[var(--os-primary)] bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "border-[var(--os-border-strong)]")}>
        {on && <Icon icon={I.check} size={11} />}
      </span>
    </button>
  );
}

/* ── one task row: SkillPetal · title · client · StatusPill · DeadlineChip · fee · flag · ONE verb ── */
function Row({
  t, narrow, active, showStatus, onOpen, onVerb, onHand, picked, anyPicked, onPick,
}: {
  t: Task;
  narrow: boolean;
  active: boolean;
  showStatus?: boolean;
  onOpen: () => void;
  onVerb: (t: Task, verb: string) => void;
  onHand?: (t: Task) => void;
  picked?: boolean;
  anyPicked?: boolean;
  onPick?: (id: string) => void;
}) {
  const skill = skillById(t.skillId);
  const verb = verbOf(t);
  const isHumanTodo = t.origin === "human" && t.status === "todo";
  return (
    <div className={cn("group/row relative flex h-14 items-center px-8 transition-colors", active ? "bg-[var(--os-selected)]" : picked ? "bg-[var(--os-accent-soft)]/50" : "hover:bg-[var(--os-hover)]")}>
      {/* full-row open target (keyboard-focusable) */}
      <button
        onClick={onOpen}
        aria-label={`Open ${t.title}`}
        className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]"
      />
      <div className="pointer-events-none relative flex w-full min-w-0 items-center gap-2.5">
        {/* bulk-select checkbox — reveals on hover, stays when anything is picked */}
        {onPick && (
          <button
            onClick={e => { e.stopPropagation(); onPick(t.id); }}
            aria-label={picked ? "Deselect" : "Select"}
            className={cn(
              "pointer-events-auto grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
              picked ? "border-[var(--os-primary)] bg-[var(--os-primary)] text-[var(--os-primary-fg)] opacity-100" : "border-[var(--os-border-strong)] text-transparent hover:border-[var(--os-ink-subtle)]",
              !picked && (anyPicked ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"),
            )}
          >
            <Icon icon={I.check} size={12} />
          </button>
        )}
        {/* origin glyph: your to-do (pencil) · handed to Petal (mark) · Petal-native (skill) */}
        {t.origin === "human"
          ? t.status === "todo"
            ? <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--os-selected)]"><Icon icon={I.edit} size={11} className="text-[var(--os-ink-muted)]" /></span>
            : <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-[var(--os-bg-subtle)] ring-1 ring-[var(--os-border)]"><PetalMark className="size-3" /></span>
          : skill && <SkillIcon category={skill.category} size={15} />}
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{t.title}</span>
        {t.flagged && <BookmarkFlag size={13} />}
        {!narrow && (
          <>
            <span className="hidden max-w-[150px] shrink-0 truncate text-[12px] text-[var(--os-ink-muted)] md:inline">{clientName(t)}</span>
            {showStatus && <StatusPill status={t.status} className="hidden shrink-0 lg:inline-flex" />}
            {t.deadline && <DeadlineChip iso={t.deadline} className="hidden shrink-0 sm:inline-flex" />}
            <MemberAvatar memberId={t.assigneeId ?? assigneeOf(t.householdId)} size={20} className="hidden shrink-0 sm:grid" />
          </>
        )}
        {isHumanTodo && onHand && (
          <button
            onClick={() => onHand(t)}
            className="pointer-events-auto inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[11.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
          >
            <PetalMark className="size-3" /> Hand to Petal
          </button>
        )}
        {verb && (
          <button
            onClick={() => onVerb(t, verb)}
            className="pointer-events-auto h-6 shrink-0 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[11.5px] font-medium text-[var(--os-ink)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
          >
            {verb}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── board (kanban) - one lane per status, cards stacked ── */
function BoardCard({ t, active, onOpen, onVerb }: { t: Task; active: boolean; onOpen: () => void; onVerb: (t: Task, verb: string) => void }) {
  const skill = skillById(t.skillId);
  const verb = verbOf(t);
  return (
    <div
      className={cn(
        "group/card relative rounded-xl border bg-[var(--os-card)] p-3 transition-all",
        active
          ? "border-[var(--os-border-strong)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          : "border-[var(--os-border)] hover:border-[var(--os-border-strong)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.05)]",
      )}
    >
      <button onClick={onOpen} aria-label={`Open ${t.title}`} className="absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]" />
      <div className="pointer-events-none relative">
        <div className="flex items-start gap-2">
          {skill && <SkillIcon category={skill.category} size={14} className="mt-px" />}
          <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-[var(--os-ink)] line-clamp-2">{t.title}</span>
          {t.flagged && <BookmarkFlag size={12} className="mt-0.5" />}
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--os-ink-muted)]">
          <span className="min-w-0 flex-1 truncate">{clientName(t)}</span>
          {t.deadline && <DeadlineChip iso={t.deadline} className="shrink-0" />}
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <MemberAvatar memberId={assigneeOf(t.householdId)} size={18} />
          {verb && (
            <button
              onClick={() => onVerb(t, verb)}
              className="pointer-events-auto h-6 shrink-0 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[11px] font-medium text-[var(--os-ink)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              {verb}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Board({ columns, selected, onOpen, onVerb, onAdd }: { columns: { status: TaskStatus; items: Task[] }[]; selected: string | null; onOpen: (id: string) => void; onVerb: (t: Task, verb: string) => void; onAdd?: () => void }) {
  return (
    <div className="flex gap-3 px-8 py-4">
      {columns.map(col => (
        <div key={col.status} className="flex w-[272px] shrink-0 flex-col rounded-2xl border border-[var(--os-border)] bg-[var(--os-bg-subtle)] p-2">
          <div className="group/col mb-2 flex items-center gap-2 px-1.5 pt-1">
            <StatusHeading status={col.status} />
            <span className="tabular-nums text-[12.5px] text-[var(--os-ink-subtle)]">{col.items.length}</span>
            <Icon icon={I.chevronDown} size={13} className="text-[var(--os-ink-subtle)]" />
            <button onClick={onAdd} aria-label="Add task" className="ml-auto grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] opacity-0 transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] group-hover/col:opacity-100">
              <Icon icon={I.plus} size={15} />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {col.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--os-border)] px-3 py-6 text-center text-[11.5px] text-[var(--os-ink-subtle)]">Nothing here</div>
            ) : (
              col.items.map(t => (
                <BoardCard key={t.id} t={t} active={t.id === selected} onOpen={() => onOpen(t.id)} onVerb={onVerb} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface Group {
  key: string;
  status?: TaskStatus;
  client?: string;
  items: Task[];
}

const firstName = (n: string) => n.split(" ")[0];
const pillCls = (on: boolean) =>
  cn(
    "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium transition-colors",
    on
      ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] text-[var(--os-ink)]"
      : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
  );

/* ── New task — capture human-originated work; optionally hand it to Petal ── */
function NewTaskModal({ onClose, onToast }: { onClose: () => void; onToast: (m: string) => void }) {
  const [title, setTitle] = useState("");
  const [householdId, setHouseholdId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [assignee, setAssignee] = useState("petal");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");
  const engs = householdId ? engagementsOf(householdId) : [];
  const toPetal = assignee === "petal";
  const fieldCls = "w-full rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-1.5 text-[13px] text-[var(--os-ink)] transition-colors focus:border-[var(--os-border-strong)] focus:outline-none";

  const create = () => {
    const t = title.trim();
    if (!t) return;
    const id = demoStore.newId();
    demoStore.createTask({
      id, householdId, engagementId: engagementId || undefined, status: "todo",
      kind: "Task", title: t, why: notes.trim(), skillId: "",
      deadline: due || undefined, origin: "human", assigneeId: toPetal ? undefined : assignee,
    });
    if (toPetal) demoStore.handToPetal(id, `Drafted per your request: "${t}". Review below and approve when ready.`);
    onToast(toPetal ? "Handed to Petal - drafting…" : "Task created");
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[6px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[460px] overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[0_16px_48px_rgba(17,17,26,0.2)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--os-border)] px-4 py-3">
          <h2 className="text-[14px] font-semibold text-[var(--os-ink)]">New task</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={16} /></button>
        </div>

        <div className="space-y-3 px-4 py-3.5">
          <div>
            <label className="os-label mb-1 block">Title</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") create(); }} placeholder="e.g. Call Maria about the missing 1099" className={fieldCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="os-label mb-1 block">Client</label>
              <select value={householdId} onChange={e => { setHouseholdId(e.target.value); setEngagementId(""); }} className={fieldCls}>
                <option value="">None</option>
                {households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="os-label mb-1 block">Return</label>
              <select value={engagementId} onChange={e => setEngagementId(e.target.value)} disabled={!engs.length} className={cn(fieldCls, !engs.length && "opacity-50")}>
                <option value="">{engs.length ? "None" : "—"}</option>
                {engs.map(en => <option key={en.id} value={en.id}>{(entityById(en.entityId)?.name ?? en.form)} · {en.taxYear}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="os-label mb-1.5 block">Assignee</label>
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
            {toPetal && <p className="mt-1.5 text-[11px] text-[var(--os-ink-subtle)]">Petal drafts it, then it returns to your queue to approve.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="os-label mb-1 block">Due date</label>
              <input type="date" value={due} onChange={e => setDue(e.target.value)} className={fieldCls} />
            </div>
          </div>
          <div>
            <label className="os-label mb-1 block">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Context Petal or your teammate should know…" className={cn(fieldCls, "resize-none")} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 border-t border-[var(--os-border)] px-4 py-3">
          <button onClick={onClose} className="h-8 rounded-md px-3 text-[12.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">Cancel</button>
          <button onClick={create} disabled={!title.trim()} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-40">
            {toPetal ? <><PetalMark className="size-3.5" /> Hand to Petal</> : "Create task"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TasksPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const deepLink = params.get("task");

  const [selected, setSelected] = useState<string | null>(() => (deepLink && taskById(deepLink) ? deepLink : null));
  const [view, setView] = useState<"list" | "board">("list");
  const [scope, setScope] = useState<Scope>("firm");
  const [sort, setSort] = useState<SortKey>("deadline");
  const [groupByClient, setGroupByClient] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleGroup = (key: string) => setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const filtersRef = useRef<HTMLDivElement>(null);
  const { msg, show } = useToast();

  // ?task= deep link → open the panel (also when the param changes in place).
  useEffect(() => {
    if (deepLink && taskById(deepLink)) setSelected(deepLink);
  }, [deepLink]);

  // close the filters popover on outside click / Escape
  useEffect(() => {
    if (!filtersOpen) return;
    const onDown = (e: MouseEvent) => { if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setFiltersOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFiltersOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [filtersOpen]);

  // active-filter count for the toolbar badge (sort counts only when non-default)
  const activeFilters =
    (flaggedOnly ? 1 : 0) +
    (blockedOnly ? 1 : 0) +
    (view === "list" && groupByClient ? 1 : 0) +
    (view === "list" && sort !== "deadline" ? 1 : 0);

  const close = () => {
    setSelected(null);
    if (params.get("task")) router.replace("/os/tasks", { scroll: false });
  };

  // the live queue — canonical + created this session, with approvals / done / hand-to-Petal applied
  const assignVersion = useAssignVersion(); // re-filter when a client is reassigned
  const liveTasks: Task[] = useAllTasks();
  const needsYou = useLiveNeedsYou().length;

  const groups: Group[] = useMemo(() => {
    const list = liveTasks.filter(t =>
      (!flaggedOnly || t.flagged) &&
      (!blockedOnly || isBlocked(t)) &&
      (scope === "firm" || assigneeOf(t.householdId) === CURRENT_USER_ID),
    );
    const sorted = [...list].sort(sorters[sort]);
    if (groupByClient) {
      const names = [...new Set(sorted.map(clientName))].sort((a, b) => a.localeCompare(b));
      return names.map(n => ({ key: n, client: n, items: sorted.filter(t => clientName(t) === n) }));
    }
    return TASK_STATUS_ORDER
      .map(s => ({ key: s as string, status: s, items: sorted.filter(t => t.status === s) }))
      .filter(g => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTasks, sort, groupByClient, flaggedOnly, blockedOnly, scope, assignVersion]);

  // board lanes - always by status, same filters as the list (board ignores group-by-client)
  const columns = useMemo(() => {
    const list = liveTasks.filter(t =>
      (!flaggedOnly || t.flagged) &&
      (!blockedOnly || isBlocked(t)) &&
      (scope === "firm" || assigneeOf(t.householdId) === CURRENT_USER_ID),
    );
    return TASK_STATUS_ORDER.map(s => ({ status: s, items: list.filter(t => t.status === s).sort(sorters.deadline) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTasks, flaggedOnly, blockedOnly, scope, assignVersion]);

  const item = selected ? demoStore.byId(selected) : null;

  function onVerb(t: Task, verb: string) {
    if (verb === "Decide" || verb === "View run") setSelected(t.id);
    else if (verb === "Approve & send") { demoStore.resolve(t.id); show("Approved & sent"); }
    else if (verb === "Approve") { demoStore.resolve(t.id); show("Approved"); }
    else if (verb === "Mark done") { demoStore.setStatus(t.id, "done"); show("Marked done"); }
    else if (verb === "Nudge") show("Nudge sent");
  }

  // hand a human to-do to Petal: it drafts, then returns to the queue as an approval
  function onHand(t: Task) {
    demoStore.handToPetal(t.id, `Drafted per your request: "${t.title}". Review below and approve when ready.`);
    show("Handed to Petal - drafting…");
  }

  // ── bulk selection ──
  const togglePick = (id: string) => setPicked(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clearPick = () => setPicked(new Set());
  const pickedTasks = liveTasks.filter(t => picked.has(t.id));
  const approvable = pickedTasks.filter(t => t.status === "needs_decision" || t.status === "ready_to_approve");
  const nudgeable = pickedTasks.filter(t => t.status === "waiting_client");
  const bulkApprove = () => { approvable.forEach(t => demoStore.resolve(t.id)); show(`Approved ${approvable.length}`); clearPick(); };
  const bulkNudge = () => { show(`Nudged ${nudgeable.length} client${nudgeable.length === 1 ? "" : "s"}`); clearPick(); };
  const bulkDone = () => { pickedTasks.forEach(t => demoStore.setStatus(t.id, "done")); show(`Marked ${pickedTasks.length} done`); clearPick(); };

  return (
    <div className="flex h-full flex-col">
      {/* header - title left, Review mode right */}
      <div className="flex items-center justify-between gap-6 border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <h1 className="os-display text-[24px] font-semibold text-[var(--os-ink)]">Tasks</h1>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setNewTaskOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[12.5px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]"
          >
            <Icon icon={I.plus} size={14} /> New task
          </button>
          <Link
            href="/os/review"
            className="group inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-all hover:bg-[var(--os-primary-hover)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]"
          >
            <PetalMark className="size-3.5 transition-transform duration-500 ease-out group-hover:rotate-[72deg]" />
            Review mode
            {needsYou ? <span className="grid h-4 min-w-4 place-items-center rounded bg-white/20 px-1 text-[11px] tabular-nums">{needsYou}</span> : null}
          </Link>
        </div>
      </div>

      {/* toolbar: scope (Mine/Firm) · filters … list/board on the right */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--os-border)] px-8 py-1.5">
        <ScopeToggle scope={scope} onChange={setScope} />
        {/* filters - sort + group + flagged + blocked, collapsed into one popover */}
        <div className="relative" ref={filtersRef}>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            aria-expanded={filtersOpen}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
              activeFilters > 0 || filtersOpen
                ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] text-[var(--os-ink)]"
                : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
            )}
          >
            <SlidersHorizontal className="size-3.5 text-[var(--os-ink-subtle)]" />
            Filters
            {activeFilters > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--os-primary)] px-1 text-[10px] font-semibold tabular-nums text-[var(--os-primary-fg)]">{activeFilters}</span>}
            <Icon icon={I.chevronDown} size={12} className={cn("text-[var(--os-ink-subtle)] transition-transform", filtersOpen && "rotate-180")} />
          </button>

          {filtersOpen && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[236px] rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-2 shadow-[0_10px_34px_rgba(17,17,26,0.13)]">
              {view === "list" && (
                <>
                  <div className="os-label px-2 pb-1.5 pt-0.5">Sort by</div>
                  <div className="px-1.5 pb-2">
                    <Segmented
                      value={sort}
                      onChange={v => setSort(v as SortKey)}
                      options={[
                        { value: "deadline", label: "Deadline" },
                        { value: "client", label: "Client" },
                        { value: "status", label: "Status" },
                      ]}
                    />
                  </div>
                  <ToggleRow on={groupByClient} onClick={() => setGroupByClient(v => !v)}>Group by client</ToggleRow>
                  <div className="my-1.5 h-px bg-[var(--os-border)]" />
                </>
              )}
              <div className="os-label px-2 pb-1 pt-0.5">Filter</div>
              <ToggleRow on={flaggedOnly} onClick={() => setFlaggedOnly(v => !v)}>Flagged</ToggleRow>
              <ToggleRow on={blockedOnly} onClick={() => setBlockedOnly(v => !v)}>Blocked</ToggleRow>
              {activeFilters > 0 && (
                <>
                  <div className="my-1.5 h-px bg-[var(--os-border)]" />
                  <button
                    onClick={() => { setFlaggedOnly(false); setBlockedOnly(false); setGroupByClient(false); setSort("deadline"); }}
                    className="flex w-full items-center justify-center rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* recurring work — lives in the toolbar, not the header */}
        <RecurringButton onToast={show} />

        {/* far right: list / board view toggle */}
        <Segmented
          className="ml-auto"
          value={view}
          onChange={setView}
          options={[
            { value: "list", label: <span className="inline-flex items-center gap-1.5"><Icon icon={I.viewList} size={13} /> List</span> },
            { value: "board", label: <span className="inline-flex items-center gap-1.5"><Icon icon={I.viewBoard} size={13} /> Board</span> },
          ]}
        />
      </div>

      {/* list + detail */}
      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "min-h-0",
            view === "board"
              ? "flex-1 overflow-auto"
              : item
                ? "hidden w-[360px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)] lg:flex"
                : "flex w-full flex-col overflow-y-auto",
          )}
        >
          {view === "board" ? (
            <Board columns={columns} selected={selected} onOpen={setSelected} onVerb={onVerb} onAdd={() => setNewTaskOpen(true)} />
          ) : groups.length === 0 ? (
            <div className="grid flex-1 place-items-center px-6 py-16 text-center">
              {flaggedOnly || blockedOnly ? (
                <div>
                  <p className="text-[13px] text-[var(--os-ink-muted)]">Nothing matches these filters.</p>
                  <button
                    onClick={() => { setFlaggedOnly(false); setBlockedOnly(false); }}
                    className="mt-2 inline-flex h-7 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                  >
                    Clear filters - show all {liveTasks.length} tasks
                  </button>
                </div>
              ) : (
                <div className="max-w-[300px]">
                  <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-[var(--os-bg-subtle)] ring-1 ring-[var(--os-border)]"><PetalMark className="size-5" /></div>
                  <p className="text-[14px] font-medium text-[var(--os-ink)]">You&apos;re all caught up</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--os-ink-muted)]">No open work in {scope === "mine" ? "your" : "the firm’s"} queue. New tasks and Petal approvals land here as they come in.</p>
                  <button
                    onClick={() => setNewTaskOpen(true)}
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                  >
                    <Icon icon={I.plus} size={14} /> New task
                  </button>
                </div>
              )}
            </div>
          ) : (
            groups.map(g => (
              <div key={g.key}>
                <div className="sticky top-0 z-[1] bg-[var(--os-canvas)] px-5 pb-1 pt-2">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleGroup(g.key)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleGroup(g.key); } }}
                    className="group/grp flex w-full cursor-pointer items-center gap-2 rounded-xl bg-[var(--os-selected)] px-3.5 py-2.5 transition-colors hover:bg-[var(--os-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                  >
                    {g.status ? (
                      <StatusHeading status={g.status} />
                    ) : (
                      <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--os-ink)]">{g.client}</span>
                    )}
                    <span className="tabular-nums text-[12.5px] text-[var(--os-ink-subtle)]">{g.items.length}</span>
                    <Icon icon={I.chevronDown} size={13} className={cn("text-[var(--os-ink-subtle)] transition-transform", collapsed.has(g.key) && "-rotate-90")} />
                    <button
                      onClick={e => { e.stopPropagation(); setNewTaskOpen(true); }}
                      aria-label="Add task"
                      className="ml-auto grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] opacity-0 transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] group-hover/grp:opacity-100 focus-visible:opacity-100"
                    >
                      <Icon icon={I.plus} size={15} />
                    </button>
                  </div>
                </div>
                {!collapsed.has(g.key) && g.items.map(t => (
                  <Row
                    key={t.id}
                    t={t}
                    narrow={!!item}
                    active={t.id === selected}
                    showStatus={groupByClient}
                    onOpen={() => setSelected(t.id)}
                    onVerb={onVerb}
                    onHand={onHand}
                    picked={picked.has(t.id)}
                    anyPicked={picked.size > 0}
                    onPick={togglePick}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* LIST view - detail opens as a right side panel (also via ?task= deep links) */}
        {view === "list" && item && (
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="flex min-w-0 flex-1"
            >
              <TaskDetail task={item} onClose={close} />
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* BOARD view - detail opens as a centered modal over a blurred page */}
      <AnimatePresence>
        {view === "board" && item && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4 backdrop-blur-[6px]"
            onClick={close}
          >
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
              className="flex h-[82vh] w-full max-w-[640px] overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[0_16px_48px_rgba(17,17,26,0.2)]"
            >
              <TaskDetail task={item} onClose={close} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New task modal */}
      <AnimatePresence>
        {newTaskOpen && <NewTaskModal onClose={() => setNewTaskOpen(false)} onToast={show} />}
      </AnimatePresence>

      {/* bulk selection toolbar */}
      <AnimatePresence>
        {picked.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 10, x: "-50%" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-5 left-1/2 z-40 flex items-center gap-1 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 pl-2.5 shadow-[0_12px_40px_-8px_rgba(17,17,26,0.28)]"
          >
            <span className="pr-1 text-[12.5px] font-medium text-[var(--os-ink)] tabular-nums">{picked.size} selected</span>
            <span className="mx-0.5 h-5 w-px bg-[var(--os-border)]" />
            {approvable.length > 0 && (
              <button onClick={bulkApprove} className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]">
                <Icon icon={I.check} size={13} /> Approve {approvable.length}
              </button>
            )}
            {nudgeable.length > 0 && (
              <button onClick={bulkNudge} className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                <Icon icon={I.mail} size={13} /> Nudge {nudgeable.length}
              </button>
            )}
            <button onClick={bulkDone} className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
              <Icon icon={I.check} size={13} /> Mark done
            </button>
            <span className="mx-0.5 h-5 w-px bg-[var(--os-border)]" />
            <button onClick={clearPick} aria-label="Clear selection" className="grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
              <Icon icon={I.close} size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast msg={msg} />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageInner />
    </Suspense>
  );
}
