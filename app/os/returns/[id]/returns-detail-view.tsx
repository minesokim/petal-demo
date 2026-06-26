"use client";

// Return record - the per-engagement twin of the client record (/os/clients/[id]).
// Same shell: breadcrumb header + header strip + tabbed center + @Petal/Details rail,
// scoped to one engagement. Everything derives from lib/fixtures at render time.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { PetalLogo } from "@/components/petal-logo";
import { Icon, I } from "@/components/os/icon";
import { useAutogrow } from "@/lib/os/use-autogrow";
import { StageTag, StatusPill, DeadlineChip, SkillPetal, TrustTierTag, MemberAvatar, BookmarkFlag, FileGlyph } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { TaskDetail } from "@/components/os/task-detail";
import { ReviewModal } from "@/components/os/doc-gallery";
import { FileUploader } from "@/components/os/file-uploader";
import { RequestDocsButton } from "@/components/os/request-docs";
import { NotesThread } from "@/components/os/notes-thread";
import { usePetalChat, PetalAnswerView, StreamedText } from "@/components/os/petal-chat";
import { AssigneePicker } from "@/components/os/assignee-picker";
import { IntakeRecord } from "@/components/os/intake-record";
import { skillById, workpaperOf, type Task, type ExpectedDoc } from "@/lib/fixtures/firm";
import { assigneeOf, useAssignVersion } from "@/lib/assign-store";
import { engagementDeadline } from "@/lib/fixtures/derive";
import { useFirmData, useDerive } from "@/lib/client/firm-context";
import { stageMeta, taskStatusMeta, TASK_STATUS_ORDER, expectedDocMeta, fmtDate, money } from "@/lib/fixtures/vocab";

const docKind = (source: string) => {
  const m = source.toLowerCase().match(/\.(pdf|png|jpe?g|xlsx|docx)\b/);
  return m ? m[1].replace("jpeg", "jpg") : "pdf";
};

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const DOC_STATUS_ORDER: Record<ExpectedDoc["status"], number> = { needs_review: 0, requested: 1, have: 2, na: 3 };

const TABS = ["Overview", "Documents", "Tasks", "Workpaper"] as const;
type Tab = (typeof TABS)[number];
const tabFromParam = (p: string | null): Tab => TABS.find(t => t.toLowerCase() === (p ?? "").toLowerCase()) ?? "Overview";

const verbOf = (t: Task) => {
  const v = taskStatusMeta[t.status].verb;
  return v === "Approve" && t.draftText ? "Approve & send" : v;
};

function FormChip({ form }: { form: string }) {
  return <span className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{form}</span>;
}

const FOCUS_G = "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]";
const first = (name: string) => name.split(" ")[0];
const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);

/* ── Linear project-panel card - title + chevron, optional right action, padded body ── */
function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] p-4", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1 text-[13px] font-semibold text-[var(--os-ink)]">
            {title}<Icon icon={I.chevronDown} size={12} className="text-[var(--os-ink-subtle)]" />
          </h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
/* ── Linear-style card - small header + padded/flush body. Used in the Details rail. ── */
function LCard({ title, action, flush, children }: { title: string; action?: React.ReactNode; flush?: boolean; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-card)]">
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-2.5">
        <span className="text-[12.5px] font-semibold text-[var(--os-ink)]">{title}</span>
        {action}
      </div>
      <div className={cn(flush ? "" : "px-3.5 pb-3.5")}>{children}</div>
    </div>
  );
}
/** Quiet section header: title + optional count, with a subtle right action. */
function SectionHead({ title, count, action }: { title: string; count?: number | string; action?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <h3 className="flex items-baseline gap-2 text-[13px] font-semibold text-[var(--os-ink)]">
        {title}
        {count !== undefined && <span className="text-[12px] font-normal tabular-nums text-[var(--os-ink)]">{count}</span>}
      </h3>
      {action}
    </div>
  );
}
/** Subtle "View all →" affordance for a section header. */
function ViewAll({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("group/va inline-flex items-center gap-0.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", FOCUS_G)}>
      View all <Icon icon={I.chevronRight} size={12} className="transition-transform group-hover/va:translate-x-0.5" />
    </button>
  );
}
/** Stat line inside a card (Linear "On track · 1"). */
function StatLine({ dot, label, value }: { dot?: string; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-[13px]">
      {dot && <span className={cn("size-2 shrink-0 rounded-full", dot)} />}
      <span className="min-w-0 flex-1 truncate text-[var(--os-ink)]">{label}</span>
      <span className="shrink-0 tabular-nums text-[var(--os-ink-muted)]">{value}</span>
    </div>
  );
}
/** Segmented stacked progress bar (ClickUp / monday "battery" idiom). */
function SegBar({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--os-selected)]">
      {total > 0 && segments.map((s, i) => s.value > 0 && (
        <div key={i} className={cn("h-full", s.color, i > 0 && "border-l-2 border-[var(--os-surface)]")} style={{ width: `${(s.value / total) * 100}%` }} />
      ))}
    </div>
  );
}
function LRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[78px_1fr] items-center gap-2 px-0.5 py-1.5">
      <span className="text-[12px] text-[var(--os-ink-muted)]">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-[var(--os-ink)]">{children}</span>
    </div>
  );
}
function StatRow({ dot, label, value }: { dot: string; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2 px-0.5 py-1.5 text-[13px]">
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
      <span className="min-w-0 flex-1 truncate text-[var(--os-ink)]">{label}</span>
      <span className="shrink-0 tabular-nums text-[var(--os-ink-muted)]">{value}</span>
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

function ReturnRecordInner({ id }: { id: string }) {
  const { tasks, skillRuns, skills } = useFirmData();
  const { engagementById, householdById, entityById, docsOfEngagement, docsOf } = useDerive();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const e = engagementById(id);

  const [tab, setTab] = useState<Tab>(() => tabFromParam(tabParam));
  const [panel, setPanel] = useState<"Ask Petal" | "Details" | "Notes">(() => {
    const p = searchParams.get("panel");
    return p === "Notes" || p === "Details" ? p : "Ask Petal";
  });
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [queuedSkills, setQueuedSkills] = useState<Set<string>>(new Set());
  const [openDoc, setOpenDoc] = useState<ExpectedDoc | null>(null);
  const [taskOpen, setTaskOpen] = useState<string | null>(null);
  const [wpRun, setWpRun] = useState<string | null>(null);
  const { msg, show } = useToast();
  useAssignVersion();

  const chat = usePetalChat(e?.householdId);
  // Petal's opening read types out; suggestion chips fade in once it finishes.
  const [openingReady, setOpeningReady] = useState(false);
  useEffect(() => { setOpeningReady(false); }, [e?.id]);
  const [chatInput, setChatInput] = useState("");
  const chatTaRef = useAutogrow(chatInput, 220);
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
  const title = entity?.name ?? hh.name;

  const petalAnswer =
    `${title} · ${e.form} (${e.taxYear}) is ${stageMeta[e.stage].label} - docs ${docs.label}. ` +
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
      {/* Breadcrumb header - Clients › household › form + year */}
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
                        <Icon icon={I.check} size={14} className="shrink-0 text-emerald-600" /> Queued - lands in Tasks
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
            {/* ── Overview ── Linear cards (twin of the client record) ── */}
            {tab === "Overview" && (
              <div className="mx-auto max-w-[760px] space-y-4">
                {e.blockedBy && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-[var(--os-border)] border-l-[3px] border-l-amber-400 bg-[var(--os-card)] px-4 py-3 shadow-[0_1px_2px_rgba(17,17,26,0.04)]">
                    <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                    <p className="min-w-0 text-[13px] leading-snug text-[var(--os-ink)]">
                      <span className="font-medium text-amber-700">Blocked</span>
                      <span className="text-[var(--os-ink-muted)]"> · {e.blockedBy}</span>
                    </p>
                  </div>
                )}

                {/* Catch me up */}
                <Card>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]">
                    <PetalMark className="size-3" /> Catch me up
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-[var(--os-ink)]">{petalAnswer}</p>
                </Card>

                {/* Progress - documents segmented bar + legend */}
                <Card title="Progress" action={<ViewAll onClick={() => setTab("Documents")} />}>
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <span className="os-display text-[22px] font-semibold leading-none tabular-nums text-[var(--os-ink)]">{pct}%</span>
                    <span className="text-[12px] text-[var(--os-ink-muted)]">{docs.inHand} of {docs.denom} received</span>
                  </div>
                  <SegBar segments={[{ value: docs.have, color: "bg-emerald-500" }, { value: docs.needsReview, color: "bg-amber-500" }]} />
                  <div className="mt-3 border-t border-[var(--os-border)] pt-1">
                    <StatLine dot="bg-emerald-500" label="Received" value={docs.have} />
                    {docs.needsReview > 0 && <StatLine dot="bg-amber-500" label="Needs review" value={docs.needsReview} />}
                    <StatLine dot="bg-[var(--os-border-strong)]" label="Requested" value={docs.requested} />
                  </div>
                </Card>

                {/* Needs you · Return facts */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card title="Needs you" action={openTasks.length > 0 ? <ViewAll onClick={() => setTab("Tasks")} /> : undefined}>
                    {openTasks.length === 0 ? (
                      <p className="text-[12.5px] text-[var(--os-ink-subtle)]">All clear - nothing waiting on you.</p>
                    ) : (
                      <div className="-mx-2 -mb-1">
                        {openTasks.slice(0, 4).map(t => {
                          const sk = skillById(t.skillId);
                          return (
                            <button key={t.id} onClick={() => setTaskOpen(t.id)} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--os-hover)]", FOCUS_G)}>
                              {sk && <SkillPetal category={sk.category} size={15} />}
                              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{t.title}</span>
                              <StatusPill status={t.status} className="hidden shrink-0 sm:inline-flex" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  <Card title="Return">
                    <div className="-mt-1">
                      <StatLine label="Form" value={e.form} />
                      <StatLine label="Tax year" value={e.taxYear} />
                      <StatLine label="Fee" value={money(e.fee)} />
                      <StatLine label="Deposit" value={e.depositPaid ? "Paid" : "Not collected"} />
                      {finished && e.refund != null && <StatLine label="Refund" value={money(e.refund)} />}
                    </div>
                    {finished && (
                      <p className="mt-2 border-t border-[var(--os-border)] pt-2 text-[12px] tabular-nums text-[var(--os-ink-muted)]">
                        {e.eFiledOn && <>E-filed {fmtDate(e.eFiledOn)}</>}
                        {e.acceptedOn && <> · Accepted {fmtDate(e.acceptedOn)}</>}
                      </p>
                    )}
                  </Card>
                </div>

                {/* Relationships */}
                <Card title="Relationships">
                  <div className="-mx-2 -mb-1">
                    <Link href={`/os/clients/${hh.id}`} className={cn("group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]", FOCUS_G)}>
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(hh.name)}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{hh.name}</span>
                      <span className="shrink-0 text-[11px] text-[var(--os-ink-subtle)]">Household</span>
                      <Icon icon={I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                    {k1Target && (
                      <Link href={`/os/returns/${k1Target.id}`} className={cn("group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]", FOCUS_G)}>
                        <Icon icon={I.link} size={13} className="ml-1.5 mr-1 shrink-0 text-[var(--os-ink-subtle)]" />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">K-1 flows to {entityById(k1Target.entityId)?.name ?? householdById(k1Target.householdId)?.name} · {k1Target.form}</span>
                        <Icon icon={I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)] opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    )}
                  </div>
                </Card>

                {/* Latest run */}
                {run && (
                  <section>
                    <SectionHead title="Latest run" />
                    <ProvenancePanel runId={run.id} defaultOpen />
                  </section>
                )}

                {/* Organizer — intake folded into the return flow */}
                <IntakeRecord householdId={e.householdId} engagementId={e.id} />
              </div>
            )}

            {/* ── Documents ── uploader + clean file cards (twin of the client record) ── */}
            {tab === "Documents" && (
              <div className="mx-auto max-w-[760px] space-y-8">
                <section>
                  <SectionHead title="Upload documents" action={<RequestDocsButton householdId={e.householdId} engagementId={e.id} onToast={show} />} />
                  <FileUploader
                    hint="PDF, PNG, JPG, XLSX or DOCX, up to 50 MB"
                    onDragFileStart={(ev, name) => ev.dataTransfer.setData("text/petal-doc", name)}
                  />
                  <p className="mt-2 flex items-center gap-1.5 px-0.5 text-[11.5px] text-[var(--os-ink-subtle)]">
                    <PetalMark className="size-3 shrink-0" /> Drag any file onto the @Petal panel to have Petal review it.
                  </p>
                </section>

                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <FormChip form={e.form} />
                    <h3 className="text-[13px] font-semibold text-[var(--os-ink)]">{entity?.name ?? hh.name}</h3>
                    <span className="text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{e.taxYear}</span>
                    <span className={cn("ml-auto text-[12px] tabular-nums", docs.inHand >= docs.denom ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{docs.label} received</span>
                  </div>
                  {docRows.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[var(--os-border-strong)] px-3.5 py-4 text-[13px] text-[var(--os-ink-muted)]">
                      No checklist yet - import last year&apos;s return and Petal builds it.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {docRows.map(d => {
                        const inHand = d.status === "have" || d.status === "needs_review";
                        return (
                          <div
                            key={d.id}
                            draggable={inHand}
                            onDragStart={ev => { if (inHand) { ev.dataTransfer.effectAllowed = "copy"; ev.dataTransfer.setData("text/petal-doc", d.source); } }}
                            onClick={() => { if (inHand) setOpenDoc(d); }}
                            role={inHand ? "button" : undefined}
                            tabIndex={inHand ? 0 : undefined}
                            onKeyDown={ev => { if (inHand && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); setOpenDoc(d); } }}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                              inHand
                                ? "cursor-grab border-[var(--os-border)] bg-[var(--os-surface)] hover:border-[var(--os-border-strong)] active:cursor-grabbing"
                                : "border-dashed border-[var(--os-border)]",
                              FOCUS,
                            )}
                          >
                            <FileGlyph kind={docKind(d.source)} size={34} className={cn(!inHand && "opacity-45")} />
                            <div className="min-w-0 flex-1">
                              <div className={cn("truncate text-[13.5px] font-medium", inHand ? "text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>{d.source}</div>
                              <div className="mt-0.5 truncate text-[12px] text-[var(--os-ink-subtle)]">
                                {d.when ? `${d.receivedVia ?? "Received"} · ${d.when}` : d.priorYearValue ? `Last year ${d.priorYearValue}` : "Not yet received"}
                              </div>
                            </div>
                            {d.status === "have" ? (
                              <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[var(--os-success)]"><Icon icon={I.check} size={14} /> Filed</span>
                            ) : d.status === "needs_review" ? (
                              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-medium text-amber-700"><span className="size-1.5 rounded-full bg-amber-500" /> Needs review</span>
                            ) : (
                              <span className="shrink-0 text-[12px] text-[var(--os-ink-subtle)]">{expectedDocMeta[d.status].label}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ── Tasks ── grouped by status, breathing-room cards (twin of the client record) ── */}
            {tab === "Tasks" && (
              related.length === 0 ? (
                <div className="grid place-items-center gap-1.5 rounded-xl border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
                  <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
                  <p className="text-[13px] text-[var(--os-ink-muted)]">Nothing queued - Petal surfaces work here as it comes up.</p>
                </div>
              ) : (
                <div className="mx-auto max-w-[760px] space-y-6">
                  {TASK_STATUS_ORDER.map(status => {
                    const group = related.filter(t => t.status === status);
                    if (group.length === 0) return null;
                    const meta = taskStatusMeta[status];
                    return (
                      <section key={status}>
                        <div className="mb-2.5 flex items-center gap-2 px-0.5">
                          <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
                          <span className="text-[12.5px] font-medium text-[var(--os-ink)]">{meta.label}</span>
                          <span className="text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{group.length}</span>
                        </div>
                        <div className="space-y-2.5">
                          {group.map(t => {
                            const skill = skillById(t.skillId);
                            const verb = verbOf(t);
                            return (
                              <div
                                key={t.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setTaskOpen(t.id)}
                                onKeyDown={ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setTaskOpen(t.id); } }}
                                className={cn("group cursor-pointer rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] p-3.5 transition-all hover:border-[var(--os-border-strong)] hover:shadow-[0_1px_3px_rgba(17,17,26,0.05)]", FOCUS)}
                              >
                                <div className="flex items-start gap-3">
                                  {skill && (
                                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--os-bg-subtle)]">
                                      <SkillPetal category={skill.category} size={26} />
                                    </span>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                      <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-snug text-[var(--os-ink)]">{t.title}</span>
                                      {t.flagged && <BookmarkFlag size={13} />}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--os-ink-muted)]">
                                      {skill && <span>{skill.name}</span>}
                                      {t.deadline && (<><span className="text-[var(--os-border-strong)]">·</span><DeadlineChip iso={t.deadline} /></>)}
                                      {t.estimatedMin > 0 && (<><span className="text-[var(--os-border-strong)]">·</span><span className="tabular-nums">~{t.estimatedMin} min</span></>)}
                                    </div>
                                  </div>
                                  {verb && (
                                    <button
                                      onClick={ev => { ev.stopPropagation(); onTaskVerb(t, verb); }}
                                      className={cn("h-7 shrink-0 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]", FOCUS)}
                                    >
                                      {verb}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )
            )}

            {/* ── Workpaper ── Linear card (twin of the client record) ── */}
            {tab === "Workpaper" && (
              !wp ? (
                <div className="grid place-items-center gap-1.5 rounded-xl border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
                  <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
                  <p className="text-[13px] text-[var(--os-ink-muted)]">No workpaper yet - it builds as Petal prepares the return.</p>
                </div>
              ) : (
                <div className="mx-auto max-w-[760px]">
                  <Card title={`Workpaper · ${entity?.name ?? hh.name} ${e.form}`}>
                    <div className="overflow-x-auto">
                      <div className="min-w-[520px]">
                        <div className="grid grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.4fr)_84px] items-center gap-x-4 border-b border-[var(--os-border)] pb-1.5">
                          {["Line", "Amount", "Source document", "Run"].map(c => <div key={c} className="os-label">{c}</div>)}
                        </div>
                        {wp.rows.map((row, i) => (
                          <div key={i} className="grid grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.4fr)_84px] items-center gap-x-4 border-b border-[var(--os-border)] py-2 text-[13px] last:border-0">
                            <span className="truncate text-[var(--os-ink)]">{row.line}</span>
                            <span className="font-medium tabular-nums text-[var(--os-ink)]">{row.amount}</span>
                            <span className="truncate text-[var(--os-ink-muted)]">{row.sourceDoc}{row.page ? <span className="text-[var(--os-ink-subtle)]"> · {row.page}</span> : null}</span>
                            {row.runId ? (
                              <button onClick={() => setWpRun(r => (r === `${wp.id}-${i}` ? null : `${wp.id}-${i}`))} aria-expanded={wpRun === `${wp.id}-${i}`} className={cn("text-left text-[12px] font-medium text-[var(--os-link)] hover:underline", FOCUS)}>{wpRun === `${wp.id}-${i}` ? "Hide run" : "View run"}</button>
                            ) : <span className="text-[12px] text-[var(--os-ink-subtle)]">-</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    {wp.rows.map((row, i) => row.runId && wpRun === `${wp.id}-${i}` ? <ProvenancePanel key={i} runId={row.runId} defaultOpen className="mt-2" /> : null)}
                    <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
                      <PetalMark className="size-3 shrink-0" /> Trace any line back to the run, the workpaper, and the source document.
                    </p>
                  </Card>
                </div>
              )
            )}

          </div>
        </div>

        {/* Right rail: Ask Petal (assistant) · Details (properties) · Notes - twin of the client record */}
        <motion.aside
          key={e.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden w-[360px] shrink-0 flex-col border-l border-[var(--os-border)] lg:flex"
        >
          <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-3">
            {(["Ask Petal", "Details", "Notes"] as const).map(p => (
              <button key={p} onClick={() => setPanel(p)} className={cn("relative px-2.5 py-2.5 text-[13px] transition-colors", panel === p ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]", FOCUS)}>
                {p}
                {panel === p && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
              </button>
            ))}
          </div>

          {panel === "Ask Petal" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                {/* Petal's opening read - plain assistant prose */}
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Petal</div>
                  <StreamedText key={e.id} text={petalAnswer} className="text-[13.5px] leading-relaxed text-[var(--os-ink)]" onDone={() => setOpeningReady(true)} />
                  {openTasks.length > 0 && openingReady && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} onClick={() => setTab("Tasks")} className={cn("mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--os-link)] hover:underline", FOCUS)}>
                      Open the {openTasks.length === 1 ? "task" : "tasks"} <Icon icon={I.chevronRight} size={11} />
                    </motion.button>
                  )}
                </div>

                {/* conversation */}
                {chat.messages.map(m =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl bg-[var(--os-selected)] px-3.5 py-2 text-[13px] leading-relaxed text-[var(--os-ink)]">{m.text}</div>
                    </div>
                  ) : (
                    <div key={m.id}>
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalLogo key={m.thinking ? "load" : "done"} loading={m.thinking} className="size-3.5 shrink-0 text-[var(--os-primary)]" /> Petal</div>
                      <PetalAnswerView answer={m.answer} thinking={m.thinking} liveSteps={m.liveSteps} streamingText={m.streamingText} traceTitle={m.traceTitle} compact stream={m.id === [...chat.messages].reverse().find(x => x.role === "petal")?.id} onSuggest={q => sendChat(q)} />
                    </div>
                  ),
                )}

                {/* suggested prompts - fade in once the opening read finishes typing */}
                {chat.messages.length === 0 && openingReady && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="flex flex-wrap gap-1.5 pt-0.5">
                    {[`What's blocking ${first(title)}?`, "What's next?", "Summarize open items"].map(s => (
                      <button key={s} onClick={() => sendChat(s)} className={cn("inline-flex items-center gap-1.5 rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] px-3 py-1.5 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                        <PetalMark className="size-3 shrink-0 text-[var(--os-ink-subtle)]" /> {s}
                      </button>
                    ))}
                  </motion.div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* composer - clean rounded box (ChatGPT idiom) */}
              <div className="px-3 pb-3">
                <div className="rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] px-3 py-2.5 shadow-[0_1px_2px_rgba(17,17,26,0.04)] transition-colors focus-within:border-[var(--os-border-strong)]">
                  <textarea
                    ref={chatTaRef}
                    value={chatInput}
                    onChange={ev => setChatInput(ev.target.value)}
                    onKeyDown={ev => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); sendChat(); } }}
                    rows={1}
                    placeholder="Ask Petal…"
                    className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
                  />
                  <div className="mt-1 flex items-center gap-1">
                    <button className={cn("grid size-7 place-items-center rounded-full text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)} aria-label="Attach"><Icon icon={I.attach} size={15} /></button>
                    <button onClick={() => sendChat()} disabled={!chatInput.trim()} className={cn("ml-auto grid size-7 place-items-center rounded-full bg-[var(--os-primary)] text-[var(--os-primary-fg)] transition-opacity disabled:opacity-25", FOCUS)} aria-label="Send"><Icon icon={I.send} size={14} /></button>
                  </div>
                </div>
                <p className="mt-1.5 text-center text-[10.5px] text-[var(--os-ink-subtle)]">Petal can make mistakes. Verify important details.</p>
              </div>
            </div>
          )}

          {panel === "Details" && (
            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--os-surface)] p-3">
              {/* Properties */}
              <LCard title="Properties">
                <div className="space-y-0.5">
                  <LRow label="Form"><FormChip form={e.form} /> {entity?.name ?? hh.name}</LRow>
                  <LRow label="Type">{entity?.type ?? "-"}</LRow>
                  <LRow label="Tax year"><span className="tabular-nums">{e.taxYear}</span></LRow>
                  <LRow label="Stage"><StageTag stage={e.stage} /></LRow>
                  <LRow label="Deadline">{finished ? "Filed" : <span className="tabular-nums">{fmtDate(dl.iso)}{dl.extended ? " (ext)" : ""}</span>}</LRow>
                  <LRow label="Fee"><span className="tabular-nums">{money(e.fee)}</span></LRow>
                  <LRow label="Deposit">{e.depositPaid ? "Paid" : "Not collected"}</LRow>
                  {finished && e.refund != null && <LRow label="Refund"><span className="tabular-nums text-[var(--os-success)]">{money(e.refund)}</span></LRow>}
                  <LRow label="Preparer"><AssigneePicker householdId={hh.id} className="-ml-1" /></LRow>
                </div>
              </LCard>

              {/* Progress - documents */}
              <LCard title="Progress">
                <div className="mb-1 flex items-center gap-2 px-0.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
                    <div className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums text-[var(--os-ink-muted)]">{docs.label}</span>
                </div>
                <div className="mt-1.5 border-t border-[var(--os-border)] pt-1">
                  <StatRow dot="bg-emerald-500" label="Received" value={docs.have} />
                  {docs.needsReview > 0 && <StatRow dot="bg-amber-500" label="Needs review" value={docs.needsReview} />}
                  <StatRow dot="bg-[var(--os-border-strong)]" label="Requested" value={docs.requested} />
                </div>
              </LCard>

              {/* Household */}
              <LCard title="Household" flush>
                <Link href={`/os/clients/${hh.id}`} className={cn("flex items-center gap-2.5 border-t border-[var(--os-border)] px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(hh.name)}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{hh.name}</span>
                  <Icon icon={I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
                </Link>
              </LCard>
            </div>
          )}

          {panel === "Notes" && <NotesThread scopeId={e.id} scopeLabel={`${title} · ${e.form}`} onToast={show} />}
        </motion.aside>
      </div>

      {/* document review modal (shared with /os/documents) */}
      <AnimatePresence>{openDoc && <ReviewModal doc={openDoc} onClose={() => setOpenDoc(null)} />}</AnimatePresence>

      {/* task detail modal (shared with /os/tasks) */}
      <AnimatePresence>
        {taskItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={() => setTaskOpen(null)} className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-4 backdrop-blur-[6px] sm:p-6">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }} transition={{ duration: 0.16, ease: "easeOut" }} onClick={ev => ev.stopPropagation()} className="flex h-[82vh] w-full max-w-[920px] overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl">
              <TaskDetail task={taskItem} onClose={() => setTaskOpen(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast msg={msg} />
    </div>
  );
}

export function ReturnsDetailView({ id }: { id: string }) {
  return (
    <Suspense fallback={null}>
      <ReturnRecordInner id={id} />
    </Suspense>
  );
}
