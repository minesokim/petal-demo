"use client";

// Client record — the deepest /os surface. Header strip + 9 explicit tabs +
// "Run skill" menu + "View as client" portal preview + @Petal right rail.
// Every number on this page derives from lib/fixtures at render time; the
// Park exemplar must tie (Ready to Prep · 32/34 · $1,900 · $1,140) everywhere.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { StatusPill, StageTag, DeadlineChip, SkillPetal, TrustTierTag } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { TaskDetail } from "@/components/os/task-detail";
import { DocRow, ReviewModal, EngagementDocsHeader } from "@/components/os/doc-gallery";
import { ThreadConversation } from "@/components/os/thread-conversation";
import { usePetalChat, PetalAnswerView } from "@/components/os/petal-chat";
import {
  householdById, entitiesOf, engagementsOf, peopleOf, tasksOf, threadsOf, noticesOf,
  positionsOf, docsOfEngagement, workpaperOf, engagementById, entityById, skills, skillById, FIRM_PROFILE,
  type Task, type ExpectedDoc, type Channel, type HouseholdKind, type Notice,
} from "@/lib/fixtures/firm";
import {
  householdStage, householdDeadline, householdFee, docsOfHousehold, docsOf, invoiceOf,
  invoiceStatusMeta, engagementDeadline, activityFeed, transcriptWatchCount, clientHealth,
  noticeCountdown,
} from "@/lib/fixtures/derive";
import { stageMeta, taskStatusMeta, healthMeta, fmtDate, money, type Stage } from "@/lib/fixtures/vocab";

/* ── constants / small helpers (presentation only — no data) ── */
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

// Notices are a firm-wide deadline queue — they live in the sidebar, not as a per-client tab.
const TABS = ["Activity", "Returns", "Documents", "Tasks", "Messages", "Billing", "Positions", "Compliance", "Notes"] as const;
type Tab = (typeof TABS)[number];
// 5 primary tabs shown inline; the rest live behind a "More" dropdown (Attio pattern).
const PRIMARY_TABS: Tab[] = ["Activity", "Returns", "Documents", "Tasks", "Messages"];
const MORE_TABS: Tab[] = ["Billing", "Positions", "Compliance", "Notes"];
const tabFromParam = (p: string | null): Tab =>
  TABS.find(t => t.toLowerCase() === (p ?? "").toLowerCase()) ?? "Activity";

const kindLabel: Record<HouseholdKind, string> = {
  individual: "Individual",
  business: "Business",
  mixed: "Individual + business",
};

/* UI colors for channels live here, not in fixtures (matches the Inbox). */
const channelDot: Record<Channel, string> = {
  email: "bg-blue-500",
  sms: "bg-emerald-500",
  portal: "bg-violet-500",
  call: "bg-yellow-500",
};

/* The portal preview speaks to the client — stageMeta stages, said in client words. */
const clientStageWords: Record<Stage, string> = {
  collecting_docs: "We're collecting your documents",
  ready_to_prep: "Everything's in — preparation is next",
  in_preparation: "Your return is being prepared",
  in_review: "Your return is ready for review",
  pay_and_sign: "Waiting on your signature",
  e_filed: "Filed with the IRS",
  accepted: "Accepted by the IRS",
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);
const DOC_STATUS_ORDER: Record<ExpectedDoc["status"], number> = { needs_review: 0, requested: 1, have: 2, na: 3 };

/** The one primary verb — same derivation as the Tasks page. */
const verbOf = (t: Task) => {
  const v = taskStatusMeta[t.status].verb;
  return v === "Approve" && t.draftText ? "Approve & send" : v;
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

function Attr({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <span className="text-[12px] text-[var(--os-ink-muted)]">{label}</span>
      <span className="max-w-[60%] text-right text-[13px] text-[var(--os-ink)]">{children}</span>
    </div>
  );
}

function FormChip({ form }: { form: string }) {
  return (
    <span className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">
      {form}
    </span>
  );
}

/* ── notice status grammar (same dots + words as /os/notices) ── */
function NoticeStatus({ n }: { n: Notice }) {
  if (n.status === "resolved") {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
        <span className="truncate">Resolved by {n.resolvedBy}{n.resolvedOn ? ` · ${fmtDate(n.resolvedOn)}` : ""}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
      <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
      <span className="truncate">Response drafted — awaiting your approval</span>
    </span>
  );
}

function ClientRecordInner() {
  const params = useParams();
  const id = String(params.id);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const h = householdById(id);

  const [tab, setTab] = useState<Tab>(() => tabFromParam(tabParam));
  const [panel, setPanel] = useState<"@Petal" | "Details">("@Petal");
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  // close the More menu on an outside click (robust — no overlay div to race the open)
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);
  const [queuedSkills, setQueuedSkills] = useState<Set<string>>(new Set());
  const [viewAsClient, setViewAsClient] = useState(false);
  const [msgThread, setMsgThread] = useState<string | null>(null);
  const [openDoc, setOpenDoc] = useState<ExpectedDoc | null>(null);
  const [taskOpen, setTaskOpen] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [wpRun, setWpRun] = useState<string | null>(null);
  const { msg, show } = useToast();

  // interactive @Petal rail — scoped to this household (scripted demo bank)
  const chat = usePetalChat(h?.id);
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages]);
  const sendChat = (text?: string) => {
    const q = (text ?? chatInput).trim();
    if (!q) return;
    chat.send(q);
    setChatInput("");
  };

  // ?tab= preselect — also when the param changes in place (deep links from health/positions).
  useEffect(() => {
    if (tabParam) setTab(tabFromParam(tabParam));
  }, [tabParam]);

  /* every fact below derives from fixtures at render time */
  const engs = useMemo(() => (h ? engagementsOf(h.id) : []), [h]);
  const ents = h ? entitiesOf(h.id) : [];
  const ppl = h ? peopleOf(h.id) : [];
  const hhTasks = h ? tasksOf(h.id) : [];
  const hhThreads = h ? threadsOf(h.id) : [];
  const hhNotices = h ? noticesOf(h.id) : [];
  const hhPositions = h ? positionsOf(h.id) : [];

  if (!h) return <div className="p-8 text-[13px] text-[var(--os-ink-muted)]">Client not found</div>;

  const stage = householdStage(h.id);
  const deadline = householdDeadline(h.id);
  const docs = docsOfHousehold(h.id);
  const fee = householdFee(h.id);
  const invoice = invoiceOf(h.id);
  const health = clientHealth(h.id);
  const feed = activityFeed({ householdId: h.id });
  const openTasks = hhTasks.filter(t => t.status !== "done");

  // The canned @Petal answer — composed from the SAME derivations as the header strip.
  const petalAnswer =
    `${h.name} is ${stageMeta[stage].label} — docs ${docs.label}. ` +
    `${openTasks.length} open task${openTasks.length === 1 ? "" : "s"}` +
    (deadline ? `; next deadline ${fmtDate(deadline.iso)}.` : `; no live deadlines.`);

  // Skills that apply to this household (Books needs books; Transcript Watch needs an 8821).
  const applicableSkills = skills.filter(
    s => (s.id !== "sk-books" || h.hasBooks) && (s.id !== "sk-transcript" || h.has8821),
  );

  // K-1 relationship graph, from entities[].owners + engagements[].k1FlowsTo.
  const k1Links = engs
    .filter(e => e.k1FlowsTo)
    .map(e => {
      const target = engagementById(e.k1FlowsTo!);
      const src = entityById(e.entityId);
      const tgt = target ? entityById(target.entityId) : undefined;
      const pct = src?.owners?.reduce((s, o) => s + o.pct, 0);
      return target && src && tgt
        ? { key: e.id, line: `${tgt.name} (${target.form}) ← K-1 ← ${src.name} (${e.form}${pct ? `, ${pct}%` : ""})` }
        : null;
    })
    .filter((x): x is { key: string; line: string } => x !== null);

  const workpapers = engs
    .map(e => ({ eng: e, wp: workpaperOf(e.id) }))
    .filter((x): x is { eng: (typeof engs)[number]; wp: NonNullable<ReturnType<typeof workpaperOf>> } => !!x.wp);

  const taskItem = taskOpen ? hhTasks.find(t => t.id === taskOpen) ?? null : null;

  const tabCount: Partial<Record<Tab, number>> = {
    Returns: engs.length,
    Tasks: hhTasks.length,
    Messages: hhThreads.length,
    Positions: hhPositions.length,
  };

  function onTaskVerb(t: Task, verb: string) {
    if (verb === "Decide" || verb === "View run") setTaskOpen(t.id);
    else if (verb === "Approve & send") show("Approved & sent");
    else if (verb === "Approve") show("Approved");
    else if (verb === "Nudge") show("Nudge sent");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb header (Assembly composition, preserved) */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-4 py-3 sm:px-8">
        <Link href="/os/clients" className={cn("text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", FOCUS)}>Clients</Link>
        <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-medium text-[var(--os-ink-muted)]">{initials(h.name)}</span>
        <span className="truncate text-[13px] font-semibold text-[var(--os-ink)]">{h.name}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => setViewAsClient(v => !v)}
            aria-pressed={viewAsClient}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] transition-colors",
              viewAsClient
                ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] font-medium text-[var(--os-ink)]"
                : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
              FOCUS,
            )}
          >
            <Icon icon={I.eye} size={13} /> View as client
          </button>
          <div className="relative">
            <button
              onClick={() => setRunMenuOpen(o => !o)}
              aria-expanded={runMenuOpen}
              className={cn("flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}
            >
              <PetalMark className="size-3.5" /> Run skill
            </button>
            {runMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRunMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-[300px] rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-md">
                  <div className="os-label px-2.5 pb-1 pt-1.5">Run a skill for {h.name}</div>
                  {applicableSkills.map(s =>
                    queuedSkills.has(s.id) ? (
                      <div key={s.id} className="flex h-8 items-center gap-2 rounded-md px-2.5 text-[12px] font-medium text-[var(--os-ink)]">
                        <Icon icon={I.check} size={14} className="shrink-0 text-emerald-600" />
                        Queued — lands in Tasks
                        <span className="ml-auto truncate text-[11px] font-normal text-[var(--os-ink-subtle)]">{s.name}</span>
                      </div>
                    ) : (
                      <button
                        key={s.id}
                        onClick={() => setQueuedSkills(prev => new Set(prev).add(s.id))}
                        className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}
                      >
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

      {/* Header strip — all derived; Park reads Ready to Prep · Ext Sep 15 · 32/34 · $1,900 · $1,140 */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-b border-[var(--os-border)] px-4 py-2 text-[12px] text-[var(--os-ink-muted)] sm:px-8">
        <StageTag stage={stage} />
        {deadline && <DeadlineChip iso={deadline.iso} extended={deadline.extended} />}
        <span>Docs <span className="font-medium tabular-nums text-[var(--os-ink)]">{docs.label}</span></span>
        <span>Fee <span className="font-medium tabular-nums text-[var(--os-ink)]">{money(fee)}</span></span>
        <span>Balance <span className="font-medium tabular-nums text-[var(--os-ink)]">{money(invoice.balance)}</span></span>
      </div>

      {viewAsClient ? (
        /* ── Read-only portal preview — what this client sees ── */
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--os-bg-subtle)]">
          <div className="mx-auto w-full max-w-[560px] px-4 py-6 sm:py-8">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3.5 py-2.5 text-[12px] text-[var(--os-ink-muted)]">
              <Icon icon={I.eye} size={14} className="shrink-0" />
              <span>Viewing as <span className="font-medium text-[var(--os-ink)]">{h.name}</span> — read-only</span>
              <button onClick={() => setViewAsClient(false)} className={cn("ml-auto shrink-0 text-[12px] font-medium text-[var(--os-accent)] hover:underline", FOCUS)}>
                Back to the record
              </button>
            </div>

            <div className="space-y-3">
              {/* their documents */}
              <section className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
                <h3 className="text-[13px] font-semibold text-[var(--os-ink)]">Your documents</h3>
                <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">
                  <span className="font-medium tabular-nums text-[var(--os-ink)]">{docs.inHand} of {docs.denom}</span> received
                  {docs.requested > 0 ? ` — ${docs.requested} still to send` : " — all set"}
                </p>
                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
                  <div className="h-full rounded-full bg-[var(--os-ink)]" style={{ width: `${docs.denom > 0 ? Math.round((docs.inHand / docs.denom) * 100) : 100}%` }} />
                </div>
              </section>

              {/* their returns, in client words */}
              <section className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
                <h3 className="text-[13px] font-semibold text-[var(--os-ink)]">Your returns</h3>
                <div className="mt-2 divide-y divide-[var(--os-border)]">
                  {engs.map(e => (
                    <div key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <FormChip form={e.form} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-[var(--os-ink)]">{entityById(e.entityId)?.name} · {e.taxYear}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                          <span className={cn("size-1.5 shrink-0 rounded-full", stageMeta[e.stage].dot)} />
                          {clientStageWords[e.stage]}
                        </div>
                      </div>
                      {e.refund && (e.stage === "accepted" || e.stage === "e_filed") && (
                        <span className="shrink-0 text-[12px] font-medium tabular-nums text-[var(--os-success)]">{money(e.refund)} refund</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* their balance */}
              <section className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
                <h3 className="text-[13px] font-semibold text-[var(--os-ink)]">Your balance</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[20px] font-semibold tabular-nums text-[var(--os-ink)]">{money(invoice.balance)}</span>
                  <span className="text-[12px] text-[var(--os-ink-muted)]">{invoice.due}</span>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Center: tabs + content */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* 6 primary tabs inline + a "More" dropdown for the rest (Attio pattern).
                No overflow-x clipping here — it would hide the absolutely-positioned dropdown. */}
            <div className="flex flex-wrap items-center gap-1 border-b border-[var(--os-border)] px-4 sm:px-8">
              {PRIMARY_TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "relative shrink-0 whitespace-nowrap px-2.5 py-2 text-[13px] transition-colors",
                    tab === t ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
                    FOCUS,
                  )}
                >
                  {t}
                  {tabCount[t] !== undefined && tabCount[t]! > 0 && (
                    <span className="ml-1 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{tabCount[t]}</span>
                  )}
                  {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
                </button>
              ))}

              {/* More ▾ — overflow tabs (ref-based outside-click close) */}
              <div ref={moreRef} className="relative shrink-0">
                <button
                  onClick={() => setMoreOpen(o => !o)}
                  aria-expanded={moreOpen}
                  className={cn(
                    "relative flex items-center gap-1 whitespace-nowrap px-2.5 py-2 text-[13px] transition-colors",
                    MORE_TABS.includes(tab) ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
                    FOCUS,
                  )}
                >
                  {MORE_TABS.includes(tab) ? tab : "More"}
                  <Icon icon={I.chevronDown} size={12} className="text-[var(--os-ink-subtle)]" />
                  {MORE_TABS.includes(tab) && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full z-30 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-[0_8px_28px_-8px_rgba(17,17,26,0.18)]">
                    {MORE_TABS.map(t => (
                      <button
                        key={t}
                        onClick={() => { setTab(t); setMoreOpen(false); }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--os-hover)]",
                          tab === t ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]",
                          FOCUS,
                        )}
                      >
                        <span className="flex-1">{t}</span>
                        {tabCount[t] !== undefined && tabCount[t]! > 0 && (
                          <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{tabCount[t]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {tab === "Messages" ? (
              hhThreads.length === 0 ? (
                <div className="grid flex-1 place-items-center px-6 text-center text-[13px] text-[var(--os-ink-muted)]">
                  <p>No messages with {h.name} yet. Start one from the Inbox, or let a skill draft the first touch.</p>
                </div>
              ) : (() => {
                const sel = hhThreads.find(t => t.id === msgThread) ?? hhThreads[0];
                return (
                  <div className="flex min-h-0 flex-1 flex-col">
                    {hhThreads.length > 1 && (
                      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--os-border)] px-4 py-1.5 sm:px-5">
                        {hhThreads.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setMsgThread(t.id)}
                            className={cn(
                              "flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[12px] transition-colors",
                              t.id === sel.id ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]",
                              FOCUS,
                            )}
                          >
                            <span className={cn("size-1.5 shrink-0 rounded-full", channelDot[t.channel])} />
                            <span className="max-w-[180px] truncate">{t.subject}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <ThreadConversation key={sel.id} thread={sel} />
                  </div>
                );
              })()
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8">
                {/* ── Activity ── */}
                {tab === "Activity" && (
                  <>
                    <div className="mb-4 rounded-lg bg-[var(--os-bg-subtle)] p-3.5">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Catch me up</div>
                      <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{h.catchUp}</p>
                    </div>
                    {feed.length === 0 ? (
                      <p className="py-8 text-center text-[13px] text-[var(--os-ink-muted)]">Nothing logged this week. Run a skill to put {h.name} in motion.</p>
                    ) : (
                      <div className="space-y-3">
                        {feed.map(a => {
                          const expanded = expandedEvents.has(a.id);
                          return (
                            <div key={a.id} className="flex gap-2.5">
                              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", a.actor === "Petal" ? "bg-emerald-500" : "bg-[var(--os-border-strong)]")} />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">Jun {a.day} · {a.at}</span>
                                  <span className="text-[13px] leading-snug">
                                    <span className="font-medium text-[var(--os-ink)]">{a.actor}</span>{" "}
                                    <span className="text-[var(--os-ink-muted)]">{a.label}</span>
                                  </span>
                                  {a.runId && (
                                    <button
                                      onClick={() =>
                                        setExpandedEvents(prev => {
                                          const next = new Set(prev);
                                          if (next.has(a.id)) next.delete(a.id); else next.add(a.id);
                                          return next;
                                        })
                                      }
                                      aria-expanded={expanded}
                                      className={cn("shrink-0 text-[11px] font-medium text-[var(--os-accent)] hover:underline", FOCUS)}
                                    >
                                      {expanded ? "Hide run" : "View run"}
                                    </button>
                                  )}
                                </div>
                                {a.runId && expanded && <ProvenancePanel runId={a.runId} defaultOpen className="mt-2" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* ── Returns ── */}
                {tab === "Returns" && (
                  <div className="space-y-6">
                    {/* per-client summary — ported from the firm-wide returns board strip */}
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-4 py-3">
                      {([
                        ["Returns", String(engs.length)],
                        ["Next deadline", deadline ? fmtDate(deadline.iso) : "—"],
                        ["Fees", money(householdFee(h.id))],
                        ["Blocked", money(engs.filter(e => e.blockedBy).reduce((s, e) => s + e.fee, 0))],
                      ] as const).map(([label, value], i) => (
                        <div key={label}>
                          <div className="text-[11px] text-[var(--os-ink-muted)]">{label}</div>
                          <div className={cn("os-display mt-0.5 text-[17px] font-semibold tabular-nums", i === 3 && value !== "$0" ? "text-[var(--os-warning)]" : "text-[var(--os-ink)]")}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                      {engs.map(e => {
                        const d = engagementDeadline(e);
                        const dc = docsOf(e.id);
                        const pct = dc.denom > 0 ? Math.round((dc.inHand / dc.denom) * 100) : 0;
                        const runTask = hhTasks.find(t => t.engagementId === e.id && t.status === "running");
                        const runSkill = runTask ? skillById(runTask.skillId) : undefined;
                        return (
                          <Link
                            key={e.id}
                            href={`/os/returns/${e.id}`}
                            className={cn("block px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]", FOCUS, "focus-visible:-outline-offset-2")}
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <FormChip form={e.form} />
                              <span className="min-w-0 truncate text-[13px] font-medium text-[var(--os-ink)]">{entityById(e.entityId)?.name} · {e.taxYear}</span>
                              <StageTag stage={e.stage} />
                              <DeadlineChip iso={d.iso} extended={d.extended} />
                              {runSkill && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--os-ink-muted)]" title={`${runSkill.name} — running`}>
                                  <SkillPetal category={runSkill.category} size={13} /> running
                                </span>
                              )}
                              <span className="ml-auto text-[13px] font-medium tabular-nums text-[var(--os-ink)]">{money(e.fee)}</span>
                              <Icon icon={I.chevronRight} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />
                            </div>
                            {/* docs progress mini-bar (ported from the board card) */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
                                <div className="h-full rounded-full bg-[var(--os-ink-muted)]" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--os-ink-muted)]">Docs {dc.label}</span>
                            </div>
                            {e.blockedBy && (
                              <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--os-warning)]">
                                <Icon icon={I.alert} size={12} className="shrink-0" /> Blocked by {e.blockedBy}
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>

                    {/* relationship graph — entity owners + K-1 flow */}
                    {k1Links.length > 0 && (
                      <section>
                        <div className="os-label mb-2">Relationship graph</div>
                        <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                          {k1Links.map(l => (
                            <div key={l.key} className="flex items-center gap-2.5 px-3.5 py-2.5">
                              <Icon icon={I.link} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
                              <span className="text-[13px] text-[var(--os-ink)]">{l.line}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* workpapers — the audit trail behind the return */}
                    {workpapers.map(({ eng, wp }) => (
                      <section key={wp.id}>
                        <div className="os-label mb-2">Workpaper — {entityById(eng.entityId)?.name} {eng.form}</div>
                        <div className="overflow-x-auto rounded-lg border border-[var(--os-border)]">
                          <div className="min-w-[520px]">
                            <div className="grid grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.4fr)_84px] items-center gap-x-4 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-2">
                              {["Line", "Amount", "Source document", "Run"].map(c => <div key={c} className="os-label">{c}</div>)}
                            </div>
                            {wp.rows.map((row, i) => (
                              <div key={i} className="grid grid-cols-[minmax(0,1.2fr)_100px_minmax(0,1.4fr)_84px] items-center gap-x-4 border-b border-[var(--os-border)] px-3.5 py-2 text-[13px] last:border-b-0">
                                <span className="truncate text-[var(--os-ink)]">{row.line}</span>
                                <span className="font-medium tabular-nums text-[var(--os-ink)]">{row.amount}</span>
                                <span className="truncate text-[var(--os-ink-muted)]">
                                  {row.sourceDoc}{row.page ? <span className="text-[var(--os-ink-subtle)]"> · {row.page}</span> : null}
                                </span>
                                {row.runId ? (
                                  <button
                                    onClick={() => setWpRun(r => (r === `${wp.id}-${i}` ? null : `${wp.id}-${i}`))}
                                    aria-expanded={wpRun === `${wp.id}-${i}`}
                                    className={cn("text-left text-[12px] font-medium text-[var(--os-accent)] hover:underline", FOCUS)}
                                  >
                                    {wpRun === `${wp.id}-${i}` ? "Hide run" : "View run"}
                                  </button>
                                ) : (
                                  <span className="text-[12px] text-[var(--os-ink-subtle)]">—</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {wp.rows.map((row, i) =>
                          row.runId && wpRun === `${wp.id}-${i}` ? <ProvenancePanel key={i} runId={row.runId} defaultOpen className="mt-2" /> : null,
                        )}
                        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
                          <PetalMark className="size-3 shrink-0" />
                          Trace any line on the return back to the run, the workpaper, and the source document.
                        </p>
                      </section>
                    ))}
                  </div>
                )}

                {/* ── Documents ── */}
                {tab === "Documents" && (
                  <div className="space-y-7">
                    {engs.map(e => {
                      const rows = [...docsOfEngagement(e.id)].sort((a, b) => DOC_STATUS_ORDER[a.status] - DOC_STATUS_ORDER[b.status]);
                      if (rows.length === 0) {
                        return (
                          <section key={e.id}>
                            <div className="mb-2 flex items-center gap-2">
                              <FormChip form={e.form} />
                              <span className="text-[13px] font-medium text-[var(--os-ink)]">{entityById(e.entityId)?.name}</span>
                            </div>
                            <p className="rounded-lg border border-dashed border-[var(--os-border-strong)] px-3.5 py-4 text-[13px] text-[var(--os-ink-muted)]">
                              No checklist yet — import last year&apos;s return and Petal builds it.
                            </p>
                          </section>
                        );
                      }
                      return (
                        <section key={e.id}>
                          <div className="mb-2 flex items-center gap-2">
                            <FormChip form={e.form} />
                            <span className="text-[13px] font-medium text-[var(--os-ink)]">{entityById(e.entityId)?.name}</span>
                            <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{e.taxYear}</span>
                          </div>
                          <EngagementDocsHeader engagementId={e.id} />
                          <div className="mt-3 overflow-hidden rounded-lg border border-[var(--os-border)]">
                            {rows.map(d => <DocRow key={d.id} doc={d} onOpen={setOpenDoc} />)}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}

                {/* ── Tasks ── */}
                {tab === "Tasks" && (
                  hhTasks.length === 0 ? (
                    <div className="grid place-items-center gap-1.5 rounded-lg border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
                      <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
                      <p className="text-[13px] text-[var(--os-ink-muted)]">No tasks for {h.name}. Run a skill from the header to queue one.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                      {hhTasks.map(t => {
                        const skill = skillById(t.skillId);
                        const verb = verbOf(t);
                        return (
                          <div key={t.id} className="relative flex h-11 items-center px-3.5 transition-colors hover:bg-[var(--os-hover)]">
                            <button
                              onClick={() => setTaskOpen(t.id)}
                              aria-label={`Open ${t.title}`}
                              className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]"
                            />
                            <div className="pointer-events-none relative flex w-full min-w-0 items-center gap-2.5">
                              {skill && <SkillPetal category={skill.category} size={15} />}
                              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{t.title}</span>
                              {t.flagged && <Icon icon={I.flag} size={13} className="shrink-0 text-[var(--os-warning)]" />}
                              <StatusPill status={t.status} className="hidden shrink-0 sm:inline-flex" />
                              {verb && (
                                <button
                                  onClick={() => onTaskVerb(t, verb)}
                                  className="pointer-events-auto h-6 shrink-0 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[11.5px] font-medium text-[var(--os-ink)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
                                >
                                  {verb}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* ── Billing ── */}
                {tab === "Billing" && (
                  <div className="space-y-7">
                    {/* invoice summary — all from invoiceOf */}
                    <section>
                      <div className="mb-2.5 flex items-center justify-between">
                        <h3 className="text-[14px] font-semibold text-[var(--os-ink)]">Invoice</h3>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--os-ink-muted)]">
                          <span className={cn("size-1.5 rounded-full", invoiceStatusMeta[invoice.status].dot)} />
                          {invoiceStatusMeta[invoice.status].label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                        {([["Invoiced", invoice.invoiced], ["Collected", invoice.collected], ["Balance", invoice.balance]] as const).map(([label, n]) => (
                          <div key={label} className="px-3.5 py-3">
                            <div className="os-label">{label}</div>
                            <div className="mt-1 text-[15px] font-semibold tabular-nums text-[var(--os-ink)]">{money(n)}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[12px] text-[var(--os-ink-muted)]">
                        <span className="tabular-nums">{invoice.number}</span>
                        <span>Issued {invoice.issued}</span>
                        <span>{invoice.due}</span>
                        <span>{invoice.serviceTier} tier</span>
                      </div>
                    </section>

                    {(invoice.blockedByDocs || invoice.chaseTaskId) && (
                      <section className="flex flex-wrap items-center gap-1.5">
                        {invoice.chaseTaskId && (
                          <Link
                            href={`/os/tasks?task=${invoice.chaseTaskId}`}
                            className={cn("flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}
                          >
                            <PetalMark className="size-3.5" /> Chase with Petal
                          </Link>
                        )}
                        {invoice.blockedByDocs && (
                          <button
                            onClick={() => setTab("Documents")}
                            className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100", FOCUS)}
                          >
                            Fee blocked by missing docs <Icon icon={I.chevronRight} size={11} />
                          </button>
                        )}
                      </section>
                    )}

                    {/* payment method (prior idiom) */}
                    <section>
                      <div className="mb-2.5 flex items-center justify-between">
                        <h3 className="text-[14px] font-semibold text-[var(--os-ink)]">Payment method</h3>
                        <button className={cn("grid size-6 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><Icon icon={I.plus} size={15} /></button>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-[var(--os-border)] px-3.5 py-3">
                        <span className="grid h-6 w-9 shrink-0 place-items-center rounded bg-[var(--os-ink)] text-[8px] font-bold tracking-wide text-[var(--os-primary-fg)]">VISA</span>
                        <span className="text-[13px] tabular-nums text-[var(--os-ink)]">•••• {String(1000 + (h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 9000))}</span>
                        <span className="rounded-full bg-[var(--os-selected)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)]">Default</span>
                        <span className="ml-auto text-[12px] text-[var(--os-ink-subtle)]">On file for deposits</span>
                      </div>
                    </section>
                  </div>
                )}

                {/* ── Positions ── */}
                {tab === "Positions" && (
                  hhPositions.length === 0 ? (
                    <div className="grid place-items-center gap-1.5 rounded-lg border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
                      <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
                      <p className="text-[13px] text-[var(--os-ink-muted)]">No documented positions for {h.name}. Positions land here as returns are prepared.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {hhPositions.map(p => {
                        const eng = engagementById(p.engagementId);
                        return (
                          <div key={p.id} className="rounded-lg border border-[var(--os-border)] p-3.5">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              {eng && <FormChip form={eng.form} />}
                              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--os-ink)]">{p.issue}</span>
                              {p.status === "open" ? (
                                <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[var(--os-ink-muted)]">
                                  <span className="size-1.5 rounded-full bg-amber-500" /> Open
                                </span>
                              ) : (
                                <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                                  <span className="size-1.5 rounded-full bg-emerald-500" /> Resolved by {p.resolvedBy}{p.resolvedOn ? ` · ${fmtDate(p.resolvedOn)}` : ""}
                                </span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--os-ink-muted)]">
                              <span className="inline-flex items-center rounded-full border border-[var(--os-border)] px-2 py-0.5 text-[11px] font-medium">{p.authorityLevel}</span>
                              <span className="tabular-nums">Confidence {Math.round(p.confidence * 100)}%</span>
                            </div>
                            <div className="mt-2.5">
                              <div className="os-label mb-1">Documentation</div>
                              <ul className="space-y-0.5">
                                {p.documentation.map((d, i) => (
                                  <li key={i} className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink)]">
                                    <Icon icon={I.file} size={12} className="shrink-0 text-[var(--os-ink-subtle)]" /> {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}

                {/* ── Compliance ── */}
                {tab === "Compliance" && (() => {
                  // e-file authorization + transmission status, derived per engagement from stage
                  const efileStatus = (s: Stage): { label: string; dot: string } =>
                    s === "accepted" ? { label: "Accepted", dot: "bg-emerald-500" }
                    : s === "e_filed" ? { label: "Transmitted", dot: "bg-blue-500" }
                    : s === "pay_and_sign" ? { label: "Awaiting signature", dot: "bg-amber-500" }
                    : { label: "Not started", dot: "bg-[var(--os-border-strong)]" };
                  const authStatus = (s: Stage): { label: string; dot: string } =>
                    s === "accepted" || s === "e_filed" ? { label: "Signed", dot: "bg-emerald-500" }
                    : s === "pay_and_sign" ? { label: "Out for signature", dot: "bg-amber-500" }
                    : { label: "Not yet generated", dot: "bg-[var(--os-border-strong)]" };
                  return (
                    <div className="space-y-4">
                      {/* firm-level credentials */}
                      <div className="rounded-lg border border-[var(--os-border)] p-3.5">
                        <div className="os-label mb-2">Preparer & authorizations</div>
                        <div className="divide-y divide-[var(--os-border)]">
                          {([
                            ["ERO / signing preparer", `${FIRM_PROFILE.owner.name}, ${FIRM_PROFILE.owner.credential}`, true],
                            ["PTIN & EFIN", "On file", true],
                            ["Engagement letter", `Signed · ${h.since} season`, true],
                            ["§7216 consent to disclose", "On file", true],
                            ["Form 8821 (transcript access)", h.has8821 ? "On file — transcripts monitored" : "Not on file", h.has8821],
                            ["WISP (data security plan)", "On file", true],
                          ] as const).map(([label, value, ok]) => (
                            <div key={label} className="flex items-center gap-3 py-2 text-[13px]">
                              <span className="min-w-0 flex-1 text-[var(--os-ink-muted)]">{label}</span>
                              <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-[var(--os-ink)]">
                                <span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-[var(--os-border-strong)]")} />
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* per-engagement e-file compliance */}
                      <div>
                        <div className="os-label mb-2 px-0.5">E-file authorization by return</div>
                        <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
                          {engs.map((e, i) => {
                            const auth = authStatus(e.stage);
                            const ef = efileStatus(e.stage);
                            const ent = entityById(e.entityId);
                            return (
                              <div key={e.id} className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3.5 py-3", i > 0 && "border-t border-[var(--os-border)]")}>
                                <div className="flex min-w-0 flex-[2] items-center gap-2">
                                  <FormChip form={e.form} />
                                  <span className="min-w-0 truncate text-[13px] text-[var(--os-ink)]">{ent?.name}</span>
                                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{e.taxYear}</span>
                                </div>
                                <div className="flex flex-1 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                                  <span className={cn("size-1.5 shrink-0 rounded-full", auth.dot)} />
                                  <span className="truncate">8879 · {auth.label}</span>
                                </div>
                                <div className="flex flex-1 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                                  <span className={cn("size-1.5 shrink-0 rounded-full", ef.dot)} />
                                  <span className="truncate">E-file · {ef.label}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="mt-2 flex items-start gap-1.5 px-0.5 text-[12px] text-[var(--os-ink-subtle)]">
                          <PetalMark className="mt-0.5 size-3 shrink-0" />
                          Petal never transmits a return until its 8879 is signed and you've approved it — every authorization is logged in the activity record.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Notes ── */}
                {tab === "Notes" && (
                  <textarea
                    placeholder={`Private notes about ${h.name}…`}
                    aria-label={`Private notes about ${h.name}`}
                    className={cn("h-full min-h-[220px] w-full resize-none rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-3 text-[13px] leading-relaxed text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)] focus:border-[var(--os-border-strong)]", FOCUS)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right rail: @Petal chat + Details (Assembly composition, preserved) */}
          <aside className="hidden w-[360px] shrink-0 flex-col border-l border-[var(--os-border)] lg:flex">
            <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-3">
              {(["@Petal", "Details"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPanel(p)}
                  className={cn("relative px-2.5 py-2.5 text-[13px] transition-colors", panel === p ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]", FOCUS)}
                >
                  {p}
                  {panel === p && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
                </button>
              ))}
            </div>

            {panel === "@Petal" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                  {/* the question */}
                  <div className="flex gap-2.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9px] font-semibold text-[var(--os-ink-muted)]">AV</span>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5"><span className="text-[13px] font-medium text-[var(--os-ink)]">Antonio</span><span className="text-[11px] text-[var(--os-ink-subtle)]">9:32 AM</span></div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-accent)]">@Petal</span> where does {h.name} stand?</p>
                    </div>
                  </div>
                  {/* the answer — composed from the same derivations as the header strip */}
                  <div className="flex gap-2.5">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-ink)] text-[var(--os-primary-fg)]"><PetalMark className="size-3.5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5"><span className="text-[13px] font-medium text-[var(--os-ink)]">Petal</span><span className="text-[11px] text-[var(--os-ink-subtle)]">just now</span></div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink)]">{petalAnswer}</p>
                      {openTasks.length > 0 && (
                        <button
                          onClick={() => setTab("Tasks")}
                          className={cn("mt-1.5 inline-flex items-center gap-1 text-[12px] text-[var(--os-accent)] hover:underline", FOCUS)}
                        >
                          Open the {openTasks.length === 1 ? "task" : "tasks"} <Icon icon={I.chevronRight} size={11} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* live conversation — typed questions matched against the demo bank */}
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
                          <div className="mt-1">
                            <PetalAnswerView
                              answer={m.answer}
                              thinking={m.thinking}
                              compact
                              stream={m.id === [...chat.messages].reverse().find(x => x.role === "petal")?.id}
                              onSuggest={q => sendChat(q)}
                            />
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                  <div ref={chatBottomRef} />
                </div>
                {/* composer */}
                <div className="border-t border-[var(--os-border)] p-3">
                  <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-2 transition-colors focus-within:border-[var(--os-border-strong)]">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                      placeholder={`Ask Petal about ${h.name}`}
                      className="w-full bg-transparent text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
                    />
                    <div className="mt-2 flex items-center gap-0.5">
                      <button className={cn("grid size-6 place-items-center rounded text-[14px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", FOCUS)}>@</button>
                      <button className={cn("grid size-6 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", FOCUS)} aria-label="Attach"><Icon icon={I.attach} size={14} /></button>
                      <button
                        onClick={() => sendChat()}
                        disabled={!chatInput.trim()}
                        className={cn("ml-auto grid size-6 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)] disabled:opacity-30", FOCUS)}
                        aria-label="Send"
                      >
                        <Icon icon={I.send} size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {panel === "Details" && (
              <div className="flex-1 overflow-y-auto pb-4">
                <div className="divide-y divide-[var(--os-border)] border-b border-[var(--os-border)]">
                  <Attr label="Type">{kindLabel[h.kind]}</Attr>
                  <Attr label="Stage"><StageTag stage={stage} /></Attr>
                  <Attr label="Service">{h.serviceTier}</Attr>
                  <Attr label="Entities"><span className="tabular-nums">{ents.length}</span></Attr>
                  <Attr label="Returns"><span className="tabular-nums">{engs.length}</span></Attr>
                  <Attr label="Docs"><span className="tabular-nums">{docs.label}</span></Attr>
                  <Attr label="Total fee"><span className="tabular-nums">{money(fee)}</span></Attr>
                  <Attr label="Balance"><span className="tabular-nums">{money(invoice.balance)}</span></Attr>
                  <Attr label="Health"><span className={healthMeta[health.health].text}>{healthMeta[health.health].label}</span></Attr>
                  <Attr label="8821 on file">{h.has8821 ? "Yes — transcripts watched" : "No"}</Attr>
                  <Attr label="Client since"><span className="tabular-nums">{h.since}</span></Attr>
                </div>

                <div className="os-label px-3 pb-2 pt-4">People</div>
                <div className="divide-y divide-[var(--os-border)] border-y border-[var(--os-border)]">
                  {ppl.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 px-3 py-2">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(p.name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-[var(--os-ink)]">{p.name}</div>
                        <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{p.email}</div>
                      </div>
                      <span className="shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{p.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* document review modal (shared with /os/documents) */}
      <AnimatePresence>{openDoc && <ReviewModal doc={openDoc} onClose={() => setOpenDoc(null)} />}</AnimatePresence>

      {/* task detail modal (shared with /os/tasks) */}
      <AnimatePresence>
        {taskItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={() => setTaskOpen(null)} className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.16, ease: "easeOut" }} onClick={e => e.stopPropagation()}
              className="flex h-[82vh] w-full max-w-[920px] overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
            >
              <TaskDetail task={taskItem} onClose={() => setTaskOpen(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast msg={msg} />
    </div>
  );
}

export default function ClientRecordPage() {
  return (
    <Suspense fallback={null}>
      <ClientRecordInner />
    </Suspense>
  );
}
