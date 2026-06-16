"use client";

// Return record — the per-engagement twin of the client record (/os/clients/[id]).
// Same shell: breadcrumb header + header strip + tabbed center + @Petal/Details rail,
// scoped to one engagement. Everything derives from lib/fixtures at render time.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { StageTag, DeadlineChip, StatusPill, SkillPetal, TrustTierTag, MemberAvatar, BookmarkFlag } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { TaskDetail } from "@/components/os/task-detail";
import { DocRow, ReviewModal, EngagementDocsHeader } from "@/components/os/doc-gallery";
import { usePetalChat, PetalAnswerView } from "@/components/os/petal-chat";
import { AssigneePicker } from "@/components/os/assignee-picker";
import {
  engagementById, householdById, entityById, docsOfEngagement, tasks, skillRuns, skillById,
  workpaperOf, skills, FIRM_PROFILE, type Task, type ExpectedDoc,
} from "@/lib/fixtures/firm";
import { assigneeOf, useAssignVersion } from "@/lib/assign-store";
import { docsOf, engagementDeadline } from "@/lib/fixtures/derive";
import { stageMeta, taskStatusMeta, TASK_STATUS_ORDER, fmtDate, money, type Stage } from "@/lib/fixtures/vocab";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const DOC_STATUS_ORDER: Record<ExpectedDoc["status"], number> = { needs_review: 0, requested: 1, have: 2, na: 3 };

const TABS = ["Overview", "Documents", "Tasks", "Workpaper", "Compliance"] as const;
type Tab = (typeof TABS)[number];
const tabFromParam = (p: string | null): Tab => TABS.find(t => t.toLowerCase() === (p ?? "").toLowerCase()) ?? "Overview";

const verbOf = (t: Task) => {
  const v = taskStatusMeta[t.status].verb;
  return v === "Approve" && t.draftText ? "Approve & send" : v;
};

function FormChip({ form }: { form: string }) {
  return <span className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{form}</span>;
}

function Attr({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <span className="text-[12px] text-[var(--os-ink-muted)]">{label}</span>
      <span className="max-w-[60%] text-right text-[13px] text-[var(--os-ink)]">{children}</span>
    </div>
  );
}

/* ── quiet toast ── */
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = (m: string) => { setMsg(m); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(null), 2400); };
  return { msg, show };
}
function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div initial={{ opacity: 0, y: 6, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 6, x: "-50%" }} transition={{ duration: 0.16, ease: "easeOut" }} className="fixed bottom-5 left-1/2 z-50 rounded-md bg-[var(--os-primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--os-primary-fg)] shadow-sm">
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── e-file / 8879 status grammar (return-scoped) ── */
const efileStatus = (s: Stage): { label: string; dot: string } =>
  s === "accepted" ? { label: "Accepted", dot: "bg-emerald-500" }
  : s === "e_filed" ? { label: "Transmitted", dot: "bg-blue-500" }
  : s === "pay_and_sign" ? { label: "Awaiting signature", dot: "bg-amber-500" }
  : { label: "Not started", dot: "bg-[var(--os-border-strong)]" };
const authStatus = (s: Stage): { label: string; dot: string } =>
  s === "accepted" || s === "e_filed" ? { label: "Signed", dot: "bg-emerald-500" }
  : s === "pay_and_sign" ? { label: "Out for signature", dot: "bg-amber-500" }
  : { label: "Not yet generated", dot: "bg-[var(--os-border-strong)]" };

function ReturnRecordInner() {
  const params = useParams();
  const id = String(params.id);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const e = engagementById(id);

  const [tab, setTab] = useState<Tab>(() => tabFromParam(tabParam));
  const [panel, setPanel] = useState<"@Petal" | "Details">("@Petal");
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [queuedSkills, setQueuedSkills] = useState<Set<string>>(new Set());
  const [openDoc, setOpenDoc] = useState<ExpectedDoc | null>(null);
  const [taskOpen, setTaskOpen] = useState<string | null>(null);
  const [wpRun, setWpRun] = useState<string | null>(null);
  const { msg, show } = useToast();
  useAssignVersion();

  const chat = usePetalChat(e?.householdId);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [chat.messages]);
  const sendChat = (text?: string) => { const q = (text ?? chatInput).trim(); if (!q) return; chat.send(q); setChatInput(""); };

  useEffect(() => { if (tabParam) setTab(tabFromParam(tabParam)); }, [tabParam]);

  const related = useMemo(
    () => (e ? tasks.filter(t => t.engagementId === e.id).sort((a, b) => TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status)) : []),
    [e],
  );
  const taskItem = taskOpen ? related.find(t => t.id === taskOpen) ?? null : null;

  if (!e) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <p className="text-[13px] text-[var(--os-ink-muted)]">No return matches that link.</p>
          <Link href="/os/clients" className={cn("mt-3 inline-flex h-8 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>Back to Clients</Link>
        </div>
      </div>
    );
  }

  const hh = householdById(e.householdId)!;
  const entity = entityById(e.entityId);
  const docs = docsOf(e.id);
  const docRows = [...docsOfEngagement(e.id)].sort((a, b) => DOC_STATUS_ORDER[a.status] - DOC_STATUS_ORDER[b.status]);
  const run = skillRuns.find(r => r.engagementId === e.id);
  const wp = workpaperOf(e.id);
  const finished = e.stage === "e_filed" || e.stage === "accepted";
  const dl = engagementDeadline(e);
  const k1Target = e.k1FlowsTo ? engagementById(e.k1FlowsTo) : undefined;
  const pct = docs.denom > 0 ? Math.round((docs.inHand / docs.denom) * 100) : 0;
  const openTasks = related.filter(t => t.status !== "done");
  const ef = efileStatus(e.stage);
  const auth = authStatus(e.stage);
  const title = entity?.name ?? hh.name;

  const petalAnswer =
    `${title} · ${e.form} (${e.taxYear}) is ${stageMeta[e.stage].label} — docs ${docs.label}. ` +
    `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"}` +
    (finished ? `; filed.` : `; deadline ${fmtDate(dl.iso)}${dl.extended ? " (extended)" : ""}.`);

  const tabCount: Partial<Record<Tab, number>> = {
    Documents: docRows.length,
    Tasks: related.length,
    Workpaper: wp ? wp.rows.length : 0,
  };

  function onTaskVerb(t: Task, verb: string) {
    if (verb === "Decide" || verb === "View run") setTaskOpen(t.id);
    else if (verb === "Approve & send") show("Approved & sent");
    else if (verb === "Approve") show("Approved");
    else if (verb === "Nudge") show("Nudge sent");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb header — Clients › household › form + year */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-4 py-3 sm:px-8">
        <Link href="/os/clients" className={cn("shrink-0 text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", FOCUS)}>Clients</Link>
        <Icon icon={I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
        <Link href={`/os/clients/${hh.id}`} className={cn("shrink-0 truncate text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", FOCUS)}>{hh.name}</Link>
        <Icon icon={I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
        <FormChip form={e.form} />
        <span className="truncate text-[13px] font-semibold text-[var(--os-ink)]">{title} · {e.taxYear}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Link href={`/os/clients/${hh.id}`} className={cn("flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] px-2.5 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
            <Icon icon={I.clients} size={13} /> Open client
          </Link>
          <div className="relative">
            <button onClick={() => setRunMenuOpen(o => !o)} aria-expanded={runMenuOpen} className={cn("flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>
              <PetalMark className="size-3.5" /> Run skill
            </button>
            {runMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRunMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-[300px] rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-md">
                  <div className="os-label px-2.5 pb-1 pt-1.5">Run a skill for this return</div>
                  {skills.map(s =>
                    queuedSkills.has(s.id) ? (
                      <div key={s.id} className="flex h-8 items-center gap-2 rounded-md px-2.5 text-[12px] font-medium text-[var(--os-ink)]">
                        <Icon icon={I.check} size={14} className="shrink-0 text-emerald-600" /> Queued — lands in Tasks
                        <span className="ml-auto truncate text-[11px] font-normal text-[var(--os-ink-subtle)]">{s.name}</span>
                      </div>
                    ) : (
                      <button key={s.id} onClick={() => setQueuedSkills(prev => new Set(prev).add(s.id))} className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                        <SkillPetal category={s.category} size={14} />
                        <span className="min-w-0 flex-1 truncate">{s.name}</span>
                        <TrustTierTag tier={s.trust} />
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Header strip — Stage · Deadline · Docs · Fee · Deposit */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-b border-[var(--os-border)] px-4 py-2 text-[12px] text-[var(--os-ink-muted)] sm:px-8">
        <StageTag stage={e.stage} />
        {finished
          ? e.acceptedOn && <span className="tabular-nums">Accepted {fmtDate(e.acceptedOn)}</span>
          : <DeadlineChip iso={dl.iso} extended={dl.extended} />}
        <span>Docs <span className="font-medium tabular-nums text-[var(--os-ink)]">{docs.label}</span></span>
        <span>Fee <span className="font-medium tabular-nums text-[var(--os-ink)]">{money(e.fee)}</span></span>
        <span>Deposit <span className={cn("font-medium", e.depositPaid ? "text-[var(--os-ink)]" : "text-[var(--os-warning)]")}>{e.depositPaid ? "Paid" : "Not collected"}</span></span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Center: tabs + content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-1 border-b border-[var(--os-border)] px-4 sm:px-8">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn("relative shrink-0 whitespace-nowrap px-2.5 py-2 text-[13px] transition-colors", tab === t ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]", FOCUS)}>
                {t}
                {tabCount[t] !== undefined && tabCount[t]! > 0 && <span className="ml-1 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{tabCount[t]}</span>}
                {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
            {/* ── Overview ── */}
            {tab === "Overview" && (
              <div className="space-y-6">
                {e.blockedBy && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
                    <Icon icon={I.alert} size={15} className="mt-px shrink-0 text-amber-700" />
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-amber-800">Blocked</div>
                      <p className="text-[13px] leading-relaxed text-amber-900">{e.blockedBy}</p>
                    </div>
                  </div>
                )}

                <section>
                  <div className="os-label mb-2">Return</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {([["Form", e.form], ["Tax year", String(e.taxYear)], ["Fee", money(e.fee)], ["Deposit", e.depositPaid ? "Paid" : "Not collected"]] as const).map(([label, val]) => (
                      <div key={label} className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-3">
                        <div className="text-[11px] text-[var(--os-ink-muted)]">{label}</div>
                        <div className="os-display mt-1 text-[15px] font-semibold tabular-nums text-[var(--os-ink)]">{val}</div>
                      </div>
                    ))}
                  </div>
                  {finished && (
                    <p className="mt-2 text-[12px] tabular-nums text-[var(--os-ink-muted)]">
                      {e.eFiledOn && <>E-filed {fmtDate(e.eFiledOn)}</>}
                      {e.acceptedOn && <> · Accepted {fmtDate(e.acceptedOn)}</>}
                      {e.refund != null && <> · Refund <span className="font-medium text-[var(--os-success)]">{money(e.refund)}</span></>}
                    </p>
                  )}
                </section>

                {/* docs progress */}
                <section>
                  <div className="os-label mb-2">Documents</div>
                  <div className="flex items-center gap-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3.5 py-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
                      <div className="h-full rounded-full bg-[var(--os-ink-muted)]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className={cn("shrink-0 text-[12px] tabular-nums", docs.inHand >= docs.denom ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{docs.label} docs</span>
                    <button onClick={() => setTab("Documents")} className={cn("shrink-0 text-[12px] font-medium text-[var(--os-accent)] hover:underline", FOCUS)}>View all</button>
                  </div>
                </section>

                {run && (
                  <section>
                    <div className="os-label mb-2">Latest run</div>
                    <ProvenancePanel runId={run.id} defaultOpen />
                  </section>
                )}

                {/* household + K-1 links */}
                <section>
                  <div className="os-label mb-2">Relationships</div>
                  <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                    <Link href={`/os/clients/${hh.id}`} className={cn("flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                      <span className="text-[12px] text-[var(--os-ink-muted)]">Household record</span>
                      <span className="flex items-center gap-1 text-[13px] text-[var(--os-ink)]">{hh.name} <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" /></span>
                    </Link>
                    {k1Target && (
                      <Link href={`/os/returns/${k1Target.id}`} className={cn("flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                        <span className="text-[12px] text-[var(--os-ink-muted)]">K-1 flows to</span>
                        <span className="flex items-center gap-1 text-[13px] text-[var(--os-ink)]">{entityById(k1Target.entityId)?.name ?? householdById(k1Target.householdId)?.name} · {k1Target.form} <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" /></span>
                      </Link>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* ── Documents ── */}
            {tab === "Documents" && (
              docRows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--os-border-strong)] px-3.5 py-4 text-[13px] text-[var(--os-ink-muted)]">No checklist yet — import last year&apos;s return and Petal builds it.</p>
              ) : (
                <div>
                  <EngagementDocsHeader engagementId={e.id} />
                  <div className="mt-3 overflow-hidden rounded-lg border border-[var(--os-border)]">
                    {docRows.map(d => <DocRow key={d.id} doc={d} onOpen={setOpenDoc} />)}
                  </div>
                </div>
              )
            )}

            {/* ── Tasks ── */}
            {tab === "Tasks" && (
              related.length === 0 ? (
                <div className="grid place-items-center gap-1.5 rounded-lg border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
                  <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
                  <p className="text-[13px] text-[var(--os-ink-muted)]">Nothing queued — Petal surfaces work here as it comes up.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                  {related.map(t => {
                    const skill = skillById(t.skillId);
                    const verb = verbOf(t);
                    return (
                      <div key={t.id} className="relative flex h-11 items-center px-3.5 transition-colors hover:bg-[var(--os-hover)]">
                        <button onClick={() => setTaskOpen(t.id)} aria-label={`Open ${t.title}`} className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]" />
                        <div className="pointer-events-none relative flex w-full min-w-0 items-center gap-2.5">
                          {skill && <SkillPetal category={skill.category} size={15} />}
                          <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{t.title}</span>
                          {t.flagged && <BookmarkFlag size={13} />}
                          <StatusPill status={t.status} className="hidden shrink-0 sm:inline-flex" />
                          {verb && (
                            <button onClick={() => onTaskVerb(t, verb)} className="pointer-events-auto h-6 shrink-0 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[11.5px] font-medium text-[var(--os-ink)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]">{verb}</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── Workpaper ── */}
            {tab === "Workpaper" && (
              !wp ? (
                <div className="grid place-items-center gap-1.5 rounded-lg border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
                  <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
                  <p className="text-[13px] text-[var(--os-ink-muted)]">No workpaper yet — it builds as Petal prepares the return.</p>
                </div>
              ) : (
                <section>
                  <div className="overflow-x-auto rounded-lg border border-[var(--os-border)]">
                    <div className="min-w-[520px]">
                      <div className="grid grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.4fr)_84px] items-center gap-x-4 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2">
                        {["Line", "Amount", "Source document", "Run"].map(c => <div key={c} className="os-label">{c}</div>)}
                      </div>
                      {wp.rows.map((row, i) => (
                        <div key={i} className="grid grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.4fr)_84px] items-center gap-x-4 border-b border-[var(--os-border)] px-3.5 py-2 text-[13px] last:border-b-0">
                          <span className="truncate text-[var(--os-ink)]">{row.line}</span>
                          <span className="font-medium tabular-nums text-[var(--os-ink)]">{row.amount}</span>
                          <span className="truncate text-[var(--os-ink-muted)]">{row.sourceDoc}{row.page ? <span className="text-[var(--os-ink-subtle)]"> · {row.page}</span> : null}</span>
                          {row.runId ? (
                            <button onClick={() => setWpRun(r => (r === `${wp.id}-${i}` ? null : `${wp.id}-${i}`))} aria-expanded={wpRun === `${wp.id}-${i}`} className={cn("text-left text-[12px] font-medium text-[var(--os-accent)] hover:underline", FOCUS)}>{wpRun === `${wp.id}-${i}` ? "Hide run" : "View run"}</button>
                          ) : <span className="text-[12px] text-[var(--os-ink-subtle)]">—</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {wp.rows.map((row, i) => row.runId && wpRun === `${wp.id}-${i}` ? <ProvenancePanel key={i} runId={row.runId} defaultOpen className="mt-2" /> : null)}
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
                    <PetalMark className="size-3 shrink-0" /> Trace any line on the return back to the run, the workpaper, and the source document.
                  </p>
                </section>
              )
            )}

            {/* ── Compliance ── */}
            {tab === "Compliance" && (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-3">
                    <div className="flex min-w-0 flex-[2] items-center gap-2">
                      <FormChip form={e.form} />
                      <span className="min-w-0 truncate text-[13px] text-[var(--os-ink)]">{entity?.name}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{e.taxYear}</span>
                    </div>
                    <div className="flex flex-1 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                      <span className={cn("size-1.5 shrink-0 rounded-full", auth.dot)} /> <span className="truncate">8879 · {auth.label}</span>
                    </div>
                    <div className="flex flex-1 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                      <span className={cn("size-1.5 shrink-0 rounded-full", ef.dot)} /> <span className="truncate">E-file · {ef.label}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--os-border)] p-3.5">
                  <div className="os-label mb-2">Preparer & authorizations</div>
                  <div className="divide-y divide-[var(--os-border)]">
                    {([
                      ["ERO / signing preparer", `${FIRM_PROFILE.owner.name}, ${FIRM_PROFILE.owner.credential}`, true],
                      ["Engagement letter", `Signed · ${hh.since} season`, true],
                      ["Form 8821 (transcript access)", hh.has8821 ? "On file" : "Not on file", hh.has8821],
                    ] as const).map(([label, value, ok]) => (
                      <div key={label} className="flex items-center gap-3 py-2 text-[13px]">
                        <span className="min-w-0 flex-1 text-[var(--os-ink-muted)]">{label}</span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-[var(--os-ink)]"><span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-[var(--os-border-strong)]")} /> {value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="flex items-start gap-1.5 px-0.5 text-[12px] text-[var(--os-ink-subtle)]">
                  <PetalMark className="mt-0.5 size-3 shrink-0" /> Petal never transmits this return until its 8879 is signed and you&apos;ve approved it.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right rail: @Petal + Details */}
        <aside className="hidden w-[360px] shrink-0 flex-col border-l border-[var(--os-border)] lg:flex">
          <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-3">
            {(["@Petal", "Details"] as const).map(p => (
              <button key={p} onClick={() => setPanel(p)} className={cn("relative px-2.5 py-2.5 text-[13px] transition-colors", panel === p ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]", FOCUS)}>
                {p}
                {panel === p && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
              </button>
            ))}
          </div>

          {panel === "@Petal" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                <div className="flex gap-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]">AV</span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-1.5"><span className="text-[13px] font-medium text-[var(--os-ink)]">Antonio</span><span className="text-[11px] text-[var(--os-ink-subtle)]">9:32 AM</span></div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-accent)]">@Petal</span> where does this return stand?</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-ink)] text-[var(--os-primary-fg)]"><PetalMark className="size-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5"><span className="text-[13px] font-medium text-[var(--os-ink)]">Petal</span><span className="text-[11px] text-[var(--os-ink-subtle)]">just now</span></div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink)]">{petalAnswer}</p>
                    {openTasks.length > 0 && (
                      <button onClick={() => setTab("Tasks")} className={cn("mt-1.5 inline-flex items-center gap-1 text-[12px] text-[var(--os-accent)] hover:underline", FOCUS)}>Open the {openTasks.length === 1 ? "task" : "tasks"} <Icon icon={I.chevronRight} size={11} /></button>
                    )}
                  </div>
                </div>

                {chat.messages.map(m =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]">AV</span>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5"><span className="text-[13px] font-medium text-[var(--os-ink)]">Antonio</span><span className="text-[11px] text-[var(--os-ink-subtle)]">just now</span></div>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-accent)]">@Petal</span> {m.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-ink)] text-[var(--os-primary-fg)]"><PetalMark className="size-3.5" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5"><span className="text-[13px] font-medium text-[var(--os-ink)]">Petal</span><span className="text-[11px] text-[var(--os-ink-subtle)]">just now</span></div>
                        <div className="mt-1"><PetalAnswerView answer={m.answer} thinking={m.thinking} compact stream={m.id === [...chat.messages].reverse().find(x => x.role === "petal")?.id} onSuggest={q => sendChat(q)} /></div>
                      </div>
                    </div>
                  ),
                )}
                <div ref={chatBottomRef} />
              </div>
              <div className="border-t border-[var(--os-border)] p-3">
                <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-2 transition-colors focus-within:border-[var(--os-border-strong)]">
                  <input value={chatInput} onChange={ev => setChatInput(ev.target.value)} onKeyDown={ev => { if (ev.key === "Enter") sendChat(); }} placeholder="Ask Petal about this return" className="w-full bg-transparent text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]" />
                  <div className="mt-2 flex items-center gap-0.5">
                    <button className={cn("grid size-6 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", FOCUS)} aria-label="Attach"><Icon icon={I.attach} size={14} /></button>
                    <button onClick={() => sendChat()} disabled={!chatInput.trim()} className={cn("ml-auto grid size-6 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)] disabled:opacity-30", FOCUS)} aria-label="Send"><Icon icon={I.send} size={13} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {panel === "Details" && (
            <div className="flex-1 overflow-y-auto pb-4">
              <div className="divide-y divide-[var(--os-border)] border-b border-[var(--os-border)]">
                <Attr label="Form">{e.form}</Attr>
                <Attr label="Entity">{entity?.name ?? hh.name}</Attr>
                <Attr label="Type">{entity?.type ?? "—"}</Attr>
                <Attr label="Tax year"><span className="tabular-nums">{e.taxYear}</span></Attr>
                <Attr label="Stage"><StageTag stage={e.stage} /></Attr>
                <Attr label="Deadline">{finished ? "Filed" : <span className="tabular-nums">{fmtDate(dl.iso)}{dl.extended ? " (ext)" : ""}</span>}</Attr>
                <Attr label="Docs"><span className="tabular-nums">{docs.label}</span></Attr>
                <Attr label="Fee"><span className="tabular-nums">{money(e.fee)}</span></Attr>
                <Attr label="Deposit">{e.depositPaid ? "Paid" : "Not collected"}</Attr>
                {finished && e.refund != null && <Attr label="Refund"><span className="tabular-nums text-[var(--os-success)]">{money(e.refund)}</span></Attr>}
              </div>
              <div className="flex items-center justify-between px-3 py-3">
                <span className="text-[12px] text-[var(--os-ink-muted)]">Lead preparer</span>
                <AssigneePicker householdId={hh.id} align="right" className="-mr-1.5" />
              </div>
              <div className="os-label px-3 pb-2 pt-1">Household</div>
              <Link href={`/os/clients/${hh.id}`} className={cn("flex items-center justify-between border-y border-[var(--os-border)] px-3 py-2.5 transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                <span className="flex items-center gap-2 text-[13px] text-[var(--os-ink)]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{hh.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                  {hh.name}
                </span>
                <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
              </Link>
            </div>
          )}
        </aside>
      </div>

      {/* document review modal (shared with /os/documents) */}
      <AnimatePresence>{openDoc && <ReviewModal doc={openDoc} onClose={() => setOpenDoc(null)} />}</AnimatePresence>

      {/* task detail modal (shared with /os/tasks) */}
      <AnimatePresence>
        {taskItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={() => setTaskOpen(null)} className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-4 sm:p-6">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }} transition={{ duration: 0.16, ease: "easeOut" }} onClick={ev => ev.stopPropagation()} className="flex h-[82vh] w-full max-w-[920px] overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl">
              <TaskDetail task={taskItem} onClose={() => setTaskOpen(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast msg={msg} />
    </div>
  );
}

export default function ReturnRecordPage() {
  return (
    <Suspense fallback={null}>
      <ReturnRecordInner />
    </Suspense>
  );
}
