"use client";

// /os/tasks — the single work queue. One vocabulary (TASK_STATUS_ORDER + StatusPill),
// one list grouped by status (or by client), exactly ONE primary verb per row from
// taskStatusMeta[status].verb. "Flagged" is a filter chip, not a tab. Every count on
// this page derives from lib/fixtures at render time.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { StatusPill, DeadlineChip, SkillPetal } from "@/components/os/primitives";
import { TaskDetail } from "@/components/os/task-detail";
import { tasks, householdById, skillById, engagementById, taskById, type Task } from "@/lib/fixtures/firm";
import { demoStore, useDemoVersion, useLiveNeedsYou } from "@/lib/demo-store";
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

/* ── toolbar chip ── */
function Chip({
  on, onClick, icon, children,
}: {
  on: boolean;
  onClick: () => void;
  icon?: (typeof I)[keyof typeof I];
  children: React.ReactNode;
}) {
  return (
    <button
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
        on
          ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] font-medium text-[var(--os-ink)]"
          : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
      )}
    >
      {icon && <Icon icon={icon} size={13} />}
      {children}
    </button>
  );
}

/* ── one task row: SkillPetal · title · client · StatusPill · DeadlineChip · fee · flag · ONE verb ── */
function Row({
  t, narrow, active, onOpen, onVerb,
}: {
  t: Task;
  narrow: boolean;
  active: boolean;
  onOpen: () => void;
  onVerb: (t: Task, verb: string) => void;
}) {
  const skill = skillById(t.skillId);
  const verb = verbOf(t);
  return (
    <div className={cn("relative flex h-11 items-center px-8 transition-colors", active ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]")}>
      {/* full-row open target (keyboard-focusable) */}
      <button
        onClick={onOpen}
        aria-label={`Open ${t.title}`}
        className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]"
      />
      <div className="pointer-events-none relative flex w-full min-w-0 items-center gap-2.5">
        {skill && <SkillPetal category={skill.category} size={15} />}
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{t.title}</span>
        {t.flagged && <Icon icon={I.flag} size={13} className="shrink-0 text-[var(--os-warning)]" />}
        {!narrow && (
          <>
            <span className="hidden max-w-[150px] shrink-0 truncate text-[12px] text-[var(--os-ink-muted)] md:inline">{clientName(t)}</span>
            <StatusPill status={t.status} className="hidden shrink-0 lg:inline-flex" />
            {t.deadline && <DeadlineChip iso={t.deadline} className="hidden shrink-0 sm:inline-flex" />}
            {t.feeContext && (
              <span className="hidden max-w-[190px] shrink-0 truncate text-[11px] text-[var(--os-ink-subtle)] xl:inline">{t.feeContext}</span>
            )}
          </>
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

interface Group {
  key: string;
  status?: TaskStatus;
  client?: string;
  items: Task[];
}

function TasksPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const deepLink = params.get("task");

  const [selected, setSelected] = useState<string | null>(() => (deepLink && taskById(deepLink) ? deepLink : null));
  const [sort, setSort] = useState<SortKey>("deadline");
  const [groupByClient, setGroupByClient] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const { msg, show } = useToast();

  // ?task= deep link → open the panel (also when the param changes in place).
  useEffect(() => {
    if (deepLink && taskById(deepLink)) setSelected(deepLink);
  }, [deepLink]);

  const close = () => {
    setSelected(null);
    if (params.get("task")) router.replace("/os/tasks", { scroll: false });
  };

  // tasks resolved this demo session read as Done everywhere on this page
  const demoVersion = useDemoVersion();
  const liveTasks: Task[] = useMemo(
    () => tasks.map(t => (demoStore.isResolved(t.id) ? { ...t, status: "done" as TaskStatus } : t)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [demoVersion],
  );
  const needsYou = useLiveNeedsYou().length;

  const groups: Group[] = useMemo(() => {
    const list = liveTasks.filter(t => (!flaggedOnly || t.flagged) && (!blockedOnly || isBlocked(t)));
    const sorted = [...list].sort(sorters[sort]);
    if (groupByClient) {
      const names = [...new Set(sorted.map(clientName))].sort((a, b) => a.localeCompare(b));
      return names.map(n => ({ key: n, client: n, items: sorted.filter(t => clientName(t) === n) }));
    }
    return TASK_STATUS_ORDER
      .map(s => ({ key: s as string, status: s, items: sorted.filter(t => t.status === s) }))
      .filter(g => g.items.length > 0);
  }, [liveTasks, sort, groupByClient, flaggedOnly, blockedOnly]);

  const item = selected ? taskById(selected) ?? null : null;
  const approvable = liveTasks.filter(t => t.status === "ready_to_approve");

  function onVerb(t: Task, verb: string) {
    if (verb === "Decide" || verb === "View run") setSelected(t.id);
    else if (verb === "Approve & send") { demoStore.resolve(t.id); show("Approved & sent"); }
    else if (verb === "Approve") { demoStore.resolve(t.id); show("Approved"); }
    else if (verb === "Nudge") show("Nudge sent");
  }

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Icon icon={I.tasks} size={16} className="text-[var(--os-ink-muted)]" />
        <h1 className="os-display text-[14px] font-semibold text-[var(--os-ink)]">Tasks</h1>
      </div>

      {/* toolbar: sort · group · filter chips · bulk approve */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--os-border)] px-8 py-1.5">
        <label className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] px-2 text-[12px] text-[var(--os-ink-muted)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--os-accent)]">
          <Icon icon={I.sort} size={13} />
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="bg-transparent text-[12px] text-[var(--os-ink)] focus:outline-none"
          >
            <option value="deadline">Deadline</option>
            <option value="client">Client</option>
            <option value="status">Status</option>
          </select>
        </label>
        <Chip on={groupByClient} onClick={() => setGroupByClient(v => !v)} icon={I.clients}>
          Group by client
        </Chip>
        <Chip on={flaggedOnly} onClick={() => setFlaggedOnly(v => !v)} icon={I.flag}>
          Flagged
        </Chip>
        <Chip on={blockedOnly} onClick={() => setBlockedOnly(v => !v)} icon={I.alert}>
          Blocked
        </Chip>

        <div className="ml-auto flex items-center gap-1.5">
          {confirmBulk ? (
            <>
              <button
                onClick={() => { setConfirmBulk(false); approvable.forEach(t => demoStore.resolve(t.id)); show(`Approved all ${approvable.length}`); }}
                className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]"
              >
                <Icon icon={I.check} size={13} /> Confirm — approve all {approvable.length}
              </button>
              <button
                onClick={() => setConfirmBulk(false)}
                className="flex h-7 items-center rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmBulk(true)}
              disabled={approvable.length === 0}
              className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon icon={I.check} size={13} /> Approve all ({approvable.length})
            </button>
          )}
        </div>
      </div>

      {/* list + detail */}
      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "min-h-0 flex-col overflow-y-auto",
            item ? "hidden w-[360px] shrink-0 border-r border-[var(--os-border)] lg:flex" : "flex w-full",
          )}
        >
          {groups.length === 0 ? (
            <div className="grid flex-1 place-items-center px-6 py-16 text-center">
              <div>
                <p className="text-[13px] text-[var(--os-ink-muted)]">Nothing matches these filters.</p>
                <button
                  onClick={() => { setFlaggedOnly(false); setBlockedOnly(false); }}
                  className="mt-2 inline-flex h-7 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                >
                  Clear filters — show all {tasks.length} tasks
                </button>
              </div>
            </div>
          ) : (
            groups.map(g => (
              <div key={g.key}>
                <div className="sticky top-0 z-[1] flex items-center gap-2 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-8 py-1.5">
                  {g.status ? (
                    <StatusPill status={g.status} />
                  ) : (
                    <span className="text-[12px] font-medium text-[var(--os-ink)]">{g.client}</span>
                  )}
                  <span className="tabular-nums text-[12px] text-[var(--os-ink-subtle)]">{g.items.length}</span>
                </div>
                {g.items.map(t => (
                  <Row
                    key={t.id}
                    t={t}
                    narrow={!!item}
                    active={t.id === selected}
                    onOpen={() => setSelected(t.id)}
                    onVerb={onVerb}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* detail panel — also opened by ?task= deep links */}
        {item && (
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
