"use client";

// Client record - the deepest /os surface. Header strip + 9 explicit tabs +
// "Run skill" menu + "View as client" portal preview + @Petal right rail.
// Every number on this page derives from lib/fixtures at render time; the
// Park exemplar must tie (Ready to Prep · 32/34 · $1,900 · $1,140) everywhere.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Archive, Trash2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { PetalLogo } from "@/components/petal-logo";
import { ClientMemory } from "@/components/os/client-memory";
import { IntakeRecord } from "@/components/os/intake-record";
import { memoryStore, useMemory } from "@/lib/memory-store";
import { Icon, I } from "@/components/os/icon";
import { StatusPill, StageTag, DeadlineChip, SkillPetal, TrustTierTag, MemberAvatar, BookmarkFlag, FileGlyph, Segmented } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { Tip } from "@/components/os/tooltip";
import { RequestDocsButton } from "@/components/os/request-docs";
import { NotesThread } from "@/components/os/notes-thread";
import { TaskDetail } from "@/components/os/task-detail";
import { ReviewModal } from "@/components/os/doc-gallery";
import { FileUploader } from "@/components/os/file-uploader";
import { ThreadConversation } from "@/components/os/thread-conversation";
import { usePetalChat, PetalAnswerView, StreamedText } from "@/components/os/petal-chat";
import {
  householdById, entitiesOf, engagementsOf, peopleOf, tasksOf, threadsOf, noticesOf,
  positionsOf, docsOfEngagement, workpaperOf, engagementById, entityById, skills, skillById,
  type Task, type ExpectedDoc, type Channel, type HouseholdKind, type Notice,
} from "@/lib/fixtures/firm";
import { assigneeOf, useAssignVersion } from "@/lib/assign-store";
import { AssigneePicker } from "@/components/os/assignee-picker";
import {
  householdStage, householdDeadline, householdFee, docsOfHousehold, docsOf, invoiceOf,
  invoiceStatusMeta, engagementDeadline, activityFeed, transcriptWatchCount, clientHealth,
  noticeCountdown,
} from "@/lib/fixtures/derive";
import { stageMeta, taskStatusMeta, TASK_STATUS_ORDER, healthMeta, expectedDocMeta, fmtDate, money, type Stage } from "@/lib/fixtures/vocab";

/* ── constants / small helpers (presentation only - no data) ── */
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

// Notices are a firm-wide deadline queue - they live in the sidebar, not as a per-client tab.
const TABS = ["Overview", "Memory", "Activity", "Intake", "Documents", "Tasks", "Messages", "Billing", "Positions"] as const;
type Tab = (typeof TABS)[number];
// 6 primary tabs shown inline; the rest live behind a "More" dropdown (Attio pattern).
// Notes is NOT a content tab - it lives in the right rail next to Ask Petal / Details.
// Intake = readiness; the returns table + relationships + workpapers live on Overview.
const PRIMARY_TABS: Tab[] = ["Overview", "Intake", "Documents", "Tasks", "Messages"];
const MORE_TABS: Tab[] = ["Billing", "Memory", "Positions", "Activity"];
const tabFromParam = (p: string | null): Tab =>
  TABS.find(t => t.toLowerCase() === (p ?? "").toLowerCase()) ?? "Overview";

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

/* The portal preview speaks to the client - stageMeta stages, said in client words. */
const clientStageWords: Record<Stage, string> = {
  collecting_docs: "We're collecting your documents",
  ready_to_prep: "Everything's in - preparation is next",
  in_preparation: "Your return is being prepared",
  in_review: "Your return is ready for review",
  pay_and_sign: "Waiting on your signature",
  e_filed: "Filed with the IRS",
  accepted: "Accepted by the IRS",
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);
const first = (name: string) => name.split(" ")[0];
const DOC_STATUS_ORDER: Record<ExpectedDoc["status"], number> = { needs_review: 0, requested: 1, have: 2, na: 3 };
/** Best-effort file kind for the colored FileGlyph badge (tax docs default to PDF). */
const docKind = (source: string) => {
  const m = source.toLowerCase().match(/\.(pdf|png|jpe?g|xlsx|docx)\b/);
  return m ? m[1].replace("jpeg", "jpg") : "pdf";
};

/** The one primary verb - same derivation as the Tasks page. */
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

function FormChip({ form }: { form: string }) {
  return (
    <span className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">
      {form}
    </span>
  );
}

/* ── Linear-style card - small header + body. `flush` lets list content bleed to the
   edges with dividers; otherwise the body is padded. Used in the rail and every tab. ── */
function LCard({ title, action, flush, children }: { title: string; action?: React.ReactNode; flush?: boolean; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-card)]">
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-2.5">
        <span className="text-[12.5px] font-semibold text-[var(--os-ink)]">{title}</span>
        {action}
      </div>
      <div className={cn(flush ? "" : "px-3.5 pb-3.5", title ? "" : "pt-3.5")}>{children}</div>
    </div>
  );
}
const FOCUS_G = "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]";

/* ── Main-content language (airy, typographic - not boxes) ── */
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
/** Airy hover row - borderless, rounded highlight on hover (Linear list). */
const AROW = "group -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--os-hover)]";
function ARow({ onClick, href, children }: { onClick?: () => void; href?: string; children: React.ReactNode }) {
  if (href) return <Link href={href} className={cn(AROW, FOCUS_G)}>{children}</Link>;
  if (onClick) return <button onClick={onClick} className={cn(AROW, FOCUS_G)}>{children}</button>;
  return <div className={cn(AROW, "hover:bg-transparent")}>{children}</div>;
}

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
/** Stat line inside a card (Linear "On track · 1"). */
function StatLine({ icon, dot, label, value }: { icon?: React.ReactNode; dot?: string; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-[13px]">
      {icon ?? (dot && <span className={cn("size-2 shrink-0 rounded-full", dot)} />)}
      <span className="min-w-0 flex-1 truncate text-[var(--os-ink)]">{label}</span>
      <span className="shrink-0 tabular-nums text-[var(--os-ink-muted)]">{value}</span>
    </div>
  );
}
/** Segmented stacked progress bar (ClickUp / monday "battery" idiom). Colored segments
 *  fill left→right; the remainder shows as the track. */
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
      <span className="truncate">Response drafted - awaiting your approval</span>
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
  const [panel, setPanel] = useState<"Ask Petal" | "Details" | "Notes">(() => {
    const p = searchParams.get("panel");
    return p === "Notes" || p === "Details" ? p : "Ask Petal";
  });
  useAssignVersion(); // reflect reassignments in the returns list avatars
  useMemory(); // re-render Catch me up / memory affordances as memories change
  const [savedMem, setSavedMem] = useState<Set<number>>(() => new Set());
  const router = useRouter();
  const [runMenuOpen, setRunMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  // record-level overflow (⋯) menu - View as client · Copy link · Archive · Delete
  const [hdrMenuOpen, setHdrMenuOpen] = useState(false);
  const hdrMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hdrMenuOpen) return;
    const onDown = (e: MouseEvent) => { if (hdrMenuRef.current && !hdrMenuRef.current.contains(e.target as Node)) setHdrMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [hdrMenuOpen]);
  // close the More menu on an outside click (robust - no overlay div to race the open)
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

  // interactive @Petal rail - scoped to this household (scripted demo bank)
  const chat = usePetalChat(h?.id);
  // Petal's opening read types out; suggestion chips fade in once it finishes.
  const [openingReady, setOpeningReady] = useState(false);
  useEffect(() => { setOpeningReady(false); }, [h?.id]);
  const [chatInput, setChatInput] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages]);
  const sendChat = (text?: string) => {
    const q = (text ?? chatInput).trim();
    if (!q && attachments.length === 0) return;
    chat.send(q, attachments);
    setChatInput("");
    setAttachments([]);
  };
  // drag a document onto the rail → attach it to the composer (don't auto-send)
  const [petalDropOver, setPetalDropOver] = useState(false);
  const [progressTab, setProgressTab] = useState<"Documents" | "Returns">("Documents");
  const [ovTab, setOvTab] = useState<"Documents" | "Returns">("Documents");
  const attachDoc = (name: string) => { setPanel("Ask Petal"); setAttachments(prev => prev.includes(name) ? prev : [...prev, name]); };

  // ?tab= preselect - also when the param changes in place (deep links from health/positions).
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

  // The canned @Petal answer - composed from the SAME derivations as the header strip.
  const petalAnswer =
    `${h.name} is ${stageMeta[stage].label} - docs ${docs.label}. ` +
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
                        Queued - lands in Tasks
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

          {/* record-level overflow menu */}
          <div ref={hdrMenuRef} className="relative">
            <Tip label="More actions" side="bottom">
            <button
              onClick={() => setHdrMenuOpen(o => !o)}
              aria-label="More actions"
              aria-expanded={hdrMenuOpen}
              className={cn("grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}
            >
              <Icon icon={I.more} size={16} />
            </button>
            </Tip>
            {hdrMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 min-w-[184px] overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-[0_8px_28px_-8px_rgba(17,17,26,0.18)]">
                <button onClick={() => { setViewAsClient(true); setHdrMenuOpen(false); }} className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                  <Icon icon={I.eye} size={14} className="text-[var(--os-ink-muted)]" /> View as client
                </button>
                <button onClick={() => { show("Link copied"); setHdrMenuOpen(false); }} className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                  <Link2 className="size-3.5 text-[var(--os-ink-muted)]" /> Copy link
                </button>
                <div className="my-1 h-px bg-[var(--os-border)]" />
                <button onClick={() => { show(`Archived ${h.name}`); setHdrMenuOpen(false); }} className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                  <Archive className="size-3.5 text-[var(--os-ink-muted)]" /> Archive client
                </button>
                <button onClick={() => { setHdrMenuOpen(false); show(`Deleted ${h.name}`); router.push("/os/clients"); }} className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[var(--os-danger)] transition-colors hover:bg-red-50", FOCUS)}>
                  <Trash2 className="size-3.5" /> Delete client
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewAsClient ? (
        /* ── Read-only portal preview - what this client sees ── */
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--os-bg-subtle)]">
          <div className="mx-auto w-full max-w-[560px] px-4 py-6 sm:py-8">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3.5 py-2.5 text-[12px] text-[var(--os-ink-muted)]">
              <Icon icon={I.eye} size={14} className="shrink-0" />
              <span>Viewing as <span className="font-medium text-[var(--os-ink)]">{h.name}</span> - read-only</span>
              <button onClick={() => setViewAsClient(false)} className={cn("ml-auto shrink-0 text-[12px] font-medium text-[var(--os-link)] hover:underline", FOCUS)}>
                Back to the record
              </button>
            </div>

            <div className="space-y-3">
              {/* their documents */}
              <section className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
                <h3 className="text-[13px] font-semibold text-[var(--os-ink)]">Your documents</h3>
                <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">
                  <span className="font-medium tabular-nums text-[var(--os-ink)]">{docs.inHand} of {docs.denom}</span> received
                  {docs.requested > 0 ? ` - ${docs.requested} still to send` : " - all set"}
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
                No overflow-x clipping here - it would hide the absolutely-positioned dropdown. */}
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
                    <span className="ml-1 text-[11px] tabular-nums text-[var(--os-ink)]">{tabCount[t]}</span>
                  )}
                  {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
                </button>
              ))}

              {/* More ▾ - overflow tabs (ref-based outside-click close) */}
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
                          <span className="text-[11px] tabular-nums text-[var(--os-ink)]">{tabCount[t]}</span>
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
                {/* ── Overview ── Linear project-panel cards ── */}
                {tab === "Overview" && (() => {
                  const docsPct = docs.denom > 0 ? Math.round((docs.inHand / docs.denom) * 100) : 100;
                  const filed = engs.filter(e => e.stage === "e_filed" || e.stage === "accepted").length;
                  const inProg = engs.length - filed;
                  const blocked = engs.filter(e => e.blockedBy).length;
                  const returnsPct = engs.length ? Math.round((filed / engs.length) * 100) : 0;
                  return (
                  <div className="mx-auto max-w-[760px] space-y-4">
                    {/* Catch me up — prose + the memories Petal is drawing on */}
                    {(() => {
                      const mem = memoryStore.ofHousehold(h.id);
                      return (
                    <Card>
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]">
                        <PetalMark className="size-3" /> Catch me up
                      </div>
                      <p className="text-[13.5px] leading-relaxed text-[var(--os-ink)]">{h.catchUp}</p>
                      {mem.length > 0 && (
                        <div className="mt-3 border-t border-[var(--os-border)] pt-2.5">
                          <div className="os-label mb-1.5">Petal remembers</div>
                          <ul className="space-y-1">
                            {mem.slice(0, 3).map(x => (
                              <li key={x.id} className="flex items-start gap-2 text-[12.5px] leading-snug">
                                <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[var(--os-ink-subtle)]" />
                                <span className="text-[var(--os-ink)]">{x.text}</span>
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => setTab("Memory")} className={cn("mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--os-link)] hover:underline", FOCUS)}>
                            View all {mem.length} memories <Icon icon={I.chevronRight} size={11} />
                          </button>
                        </div>
                      )}
                    </Card>
                      );
                    })()}

                    {/* Returns - full table (second under Catch me up; Intake tab holds readiness) */}
                    <Card title="Returns" action={<span className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">{money(householdFee(h.id))} total</span>}>
                      <div className="-mt-1">
                        <div className="grid grid-cols-[minmax(0,1fr)_128px_100px_64px_72px] gap-x-3 border-b border-[var(--os-border)] px-2 pb-2 text-[10.5px] font-medium uppercase tracking-wide text-[var(--os-ink-subtle)]">
                          <div>Return</div>
                          <div>Stage</div>
                          <div>Deadline</div>
                          <div className="text-right">Docs</div>
                          <div className="text-right">Fee</div>
                        </div>
                        {engs.map(e => {
                          const d = engagementDeadline(e);
                          const dc = docsOf(e.id);
                          const complete = dc.inHand >= dc.denom;
                          return (
                            <Link key={e.id} href={`/os/returns/${e.id}`} className={cn("group grid grid-cols-[minmax(0,1fr)_128px_100px_64px_72px] items-center gap-x-3 border-b border-[var(--os-border)] px-2 py-3 transition-colors last:border-0 hover:bg-[var(--os-hover)]", FOCUS_G)}>
                              <div className="flex min-w-0 items-center gap-2">
                                <FormChip form={e.form} />
                                <div className="min-w-0">
                                  <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{entityById(e.entityId)?.name} · {e.taxYear}</div>
                                  {e.blockedBy && <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--os-warning)]"><Icon icon={I.alert} size={11} className="shrink-0" /> Blocked</div>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-[12.5px] text-[var(--os-ink-muted)]"><span className={cn("size-1.5 shrink-0 rounded-full", stageMeta[e.stage].dot)} /><span className="truncate">{stageMeta[e.stage].label}</span></div>
                              <div className="text-[12.5px] tabular-nums text-[var(--os-ink-muted)]">{d.extended ? "Ext · " : ""}{fmtDate(d.iso)}</div>
                              <div className={cn("text-right text-[12.5px] tabular-nums", complete ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{dc.label}</div>
                              <div className="text-right text-[13px] font-medium tabular-nums text-[var(--os-ink)]">{money(e.fee)}</div>
                            </Link>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Progress - segmented bar + legend stat rows */}
                    <Card title="Progress">
                      <Segmented
                        className="mb-3.5"
                        value={ovTab}
                        onChange={v => setOvTab(v as "Documents" | "Returns")}
                        options={[{ value: "Documents", label: "Documents" }, { value: "Returns", label: "Returns" }]}
                      />
                      <div className="mb-2.5 flex items-baseline justify-between">
                        <span className="os-display text-[22px] font-semibold leading-none tabular-nums text-[var(--os-ink)]">{ovTab === "Documents" ? docsPct : returnsPct}%</span>
                        <span className="text-[12px] text-[var(--os-ink-muted)]">{ovTab === "Documents" ? `${docs.inHand} of ${docs.denom} received` : `${filed} of ${engs.length} filed`}</span>
                      </div>
                      <SegBar
                        segments={ovTab === "Documents"
                          ? [{ value: docs.have, color: "bg-emerald-500" }, { value: docs.needsReview, color: "bg-amber-500" }]
                          : [{ value: filed, color: "bg-emerald-500" }, { value: inProg, color: "bg-blue-500" }]}
                      />
                      <div className="mt-3 border-t border-[var(--os-border)] pt-1">
                        {ovTab === "Documents" ? (
                          <>
                            <StatLine dot="bg-emerald-500" label="Received" value={docs.have} />
                            <StatLine dot="bg-amber-500" label="Needs review" value={docs.needsReview} />
                            <StatLine dot="bg-[var(--os-border-strong)]" label="Requested" value={docs.requested} />
                          </>
                        ) : (
                          <>
                            <StatLine dot="bg-emerald-500" label="Filed" value={filed} />
                            <StatLine dot="bg-blue-500" label="In preparation" value={inProg} />
                            {blocked > 0 && <StatLine dot="bg-red-500" label="Blocked" value={blocked} />}
                          </>
                        )}
                      </div>
                    </Card>

                    {/* Needs you */}
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

                    {/* relationships */}
                    {k1Links.length > 0 && (
                      <Card title="Relationships">
                        <div className="-mx-2 -mb-1">
                          {k1Links.map(l => (
                            <div key={l.key} className="flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] text-[var(--os-ink)]">
                              <Icon icon={I.link} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" /> {l.line}
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* workpapers */}
                    {workpapers.map(({ eng, wp }) => (
                      <Card key={wp.id} title={`Workpaper · ${entityById(eng.entityId)?.name} ${eng.form}`}>
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
                                  <button onClick={() => setWpRun(r => (r === `${wp.id}-${i}` ? null : `${wp.id}-${i}`))} aria-expanded={wpRun === `${wp.id}-${i}`} className={cn("text-left text-[12px] font-medium text-[var(--os-link)] hover:underline", FOCUS)}>
                                    {wpRun === `${wp.id}-${i}` ? "Hide run" : "View run"}
                                  </button>
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
                    ))}

                    {/* Recent activity */}
                    {feed.length > 0 && (
                      <Card title="Activity" action={<ViewAll onClick={() => setTab("Activity")} />}>
                        <div className="-mt-0.5 space-y-3">
                          {feed.slice(0, 4).map(a => (
                            <div key={a.id} className="flex items-start gap-2.5">
                              <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", a.actor === "Petal" ? "bg-[var(--os-selected)]" : "bg-[var(--os-selected)]")}>
                                {a.actor === "Petal" ? <PetalMark className="size-3 text-[var(--os-ink-muted)]" /> : <span className="size-1.5 rounded-full bg-[var(--os-border-strong)]" />}
                              </span>
                              <span className="min-w-0 flex-1 text-[13px] leading-snug">
                                <span className="font-medium text-[var(--os-ink)]">{a.actor}</span>{" "}
                                <span className="text-[var(--os-ink-muted)]">{a.label}</span>
                                <span className="ml-1.5 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">· Jun {a.day}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                  );
                })()}

                {/* ── Activity ── airy timeline ── */}
                {tab === "Activity" && (
                  <div className="mx-auto max-w-[680px]">
                    <div className="mb-6 rounded-xl bg-[var(--os-bg-subtle)] px-4 py-3.5">
                      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Catch me up</div>
                      <p className="text-[13.5px] leading-relaxed text-[var(--os-ink)]">{h.catchUp}</p>
                    </div>
                    {feed.length === 0 ? (
                      <p className="py-8 text-center text-[13px] text-[var(--os-ink-muted)]">Nothing logged this week. Run a skill to put {h.name} in motion.</p>
                    ) : (
                      <>
                        <SectionHead title="Timeline" />
                        {/* a true timeline - a hairline spine with dotted events */}
                        <div className="relative ml-1 mt-1 space-y-4 border-l border-[var(--os-border)] pl-5">
                          {feed.map(a => {
                            const expanded = expandedEvents.has(a.id);
                            return (
                              <div key={a.id} className="relative">
                                <span className={cn("absolute -left-[23px] top-[5px] size-1.5 rounded-full ring-4 ring-[var(--os-canvas)]", a.actor === "Petal" ? "bg-emerald-500" : "bg-[var(--os-border-strong)]")} />
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <span className="text-[13px] leading-snug">
                                    <span className="font-medium text-[var(--os-ink)]">{a.actor}</span>{" "}
                                    <span className="text-[var(--os-ink-muted)]">{a.label}</span>
                                  </span>
                                  <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">· Jun {a.day} · {a.at}</span>
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
                                      className={cn("text-[11px] font-medium text-[var(--os-link)] hover:underline", FOCUS)}
                                    >
                                      {expanded ? "Hide run" : "View run"}
                                    </button>
                                  )}
                                </div>
                                {a.runId && expanded && <ProvenancePanel runId={a.runId} defaultOpen className="mt-2" />}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Intake ── readiness card (returns/relationships/workpapers live on Overview) ── */}
                {tab === "Intake" && (
                  <div className="mx-auto max-w-[760px]">
                    <IntakeRecord householdId={h.id} />
                  </div>
                )}

                {/* ── Documents ── */}
                {tab === "Documents" && (
                  <div className="mx-auto max-w-[760px] space-y-8">
                    {/* upload zone */}
                    <section>
                      <SectionHead title="Upload documents" action={<RequestDocsButton householdId={h.id} onToast={show} />} />
                      <FileUploader
                        hint="PDF, PNG, JPG, XLSX or DOCX, up to 50 MB"
                        onDragFileStart={(e, name) => e.dataTransfer.setData("text/petal-doc", name)}
                      />
                      <p className="mt-2 flex items-center gap-1.5 px-0.5 text-[11.5px] text-[var(--os-ink-subtle)]">
                        <PetalMark className="size-3 shrink-0" /> Drag any file onto the Ask Petal panel to have Petal review it.
                      </p>
                    </section>

                    {/* per-engagement document checklist - clean file cards */}
                    {engs.map(e => {
                      const rows = [...docsOfEngagement(e.id)].sort((a, b) => DOC_STATUS_ORDER[a.status] - DOC_STATUS_ORDER[b.status]);
                      const dc = docsOf(e.id);
                      return (
                        <section key={e.id}>
                          <div className="mb-2 flex items-center gap-2">
                            <FormChip form={e.form} />
                            <h3 className="text-[13px] font-semibold text-[var(--os-ink)]">{entityById(e.entityId)?.name}</h3>
                            <span className="text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{e.taxYear}</span>
                            <span className={cn("ml-auto text-[12px] tabular-nums", dc.inHand >= dc.denom ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>{dc.label} received</span>
                          </div>
                          {rows.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-[var(--os-border-strong)] px-3.5 py-4 text-[13px] text-[var(--os-ink-muted)]">
                              No checklist yet - import last year&apos;s return and Petal builds it.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {rows.map(d => {
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
                      );
                    })}
                  </div>
                )}

                {/* ── Memory ── durable facts Petal knows about this client ── */}
                {tab === "Memory" && <ClientMemory householdId={h.id} />}

                {/* ── Tasks ── grouped by status, breathing-room cards ── */}
                {tab === "Tasks" && (
                  hhTasks.length === 0 ? (
                    <div className="grid place-items-center gap-1.5 rounded-xl border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
                      <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
                      <p className="text-[13px] text-[var(--os-ink-muted)]">No tasks for {h.name}. Run a skill from the header to queue one.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {TASK_STATUS_ORDER.map(status => {
                        const group = hhTasks.filter(t => t.status === status);
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

                {/* ── Billing ── mirrors the Billing page invoice drawer ── */}
                {tab === "Billing" && (
                  <div className="mx-auto max-w-[560px] space-y-5">
                    {/* hero - balance + status (same idiom as the Billing drawer) */}
                    <div>
                      <div className="text-[12px] text-[var(--os-ink-muted)]">{invoice.status === "paid" ? "Paid in full" : invoice.status === "overdue" ? "Balance overdue" : "Balance due"}</div>
                      <div className={cn("os-display mt-1 text-[30px] font-semibold leading-none tabular-nums", invoice.status === "overdue" && "text-[var(--os-danger)]")}>{money(invoice.status === "paid" ? invoice.invoiced : invoice.balance)}</div>
                      <span className={cn("mt-2.5 inline-flex items-center gap-1.5 text-[12px]", invoiceStatusMeta[invoice.status].accent)}>
                        <span className={cn("size-1.5 shrink-0 rounded-full", invoiceStatusMeta[invoice.status].dot)} /> {invoiceStatusMeta[invoice.status].label}
                      </span>
                    </div>

                    {/* breakdown box (same as drawer) */}
                    <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                      {([["Invoiced", invoice.invoiced, false], ["Collected", invoice.collected, false], ["Balance", invoice.balance, true]] as const).map(([label, val, bold]) => (
                        <div key={label} className="flex items-center justify-between px-3.5 py-2.5">
                          <span className="text-[12px] text-[var(--os-ink-muted)]">{label}</span>
                          <span className={cn("text-[13px] tabular-nums", bold ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>{money(val)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 text-[12px] text-[var(--os-ink-muted)]">
                      <span className="tabular-nums">{invoice.number}</span>
                      <span>Issued {invoice.issued}</span>
                      <span>{invoice.due}</span>
                      <span>{invoice.serviceTier} tier</span>
                    </div>

                    {(invoice.blockedByDocs || invoice.chaseTaskId) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {invoice.chaseTaskId && (
                          <Link href={`/os/tasks?task=${invoice.chaseTaskId}`} className={cn("flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>
                            <PetalMark className="size-3.5" /> Chase with Petal
                          </Link>
                        )}
                        {invoice.blockedByDocs && (
                          <button onClick={() => setTab("Documents")} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100", FOCUS)}>
                            Fee blocked by missing docs <Icon icon={I.chevronRight} size={11} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* payment method (drawer idiom) */}
                    <div>
                      <div className="os-label mb-1.5">Payment method</div>
                      <div className="flex items-center gap-3 rounded-lg border border-[var(--os-border)] px-3.5 py-3">
                        <span className="grid h-6 w-9 shrink-0 place-items-center rounded bg-[var(--os-ink)] text-[8px] font-bold tracking-wide text-[var(--os-primary-fg)]">VISA</span>
                        <span className="text-[13px] tabular-nums text-[var(--os-ink)]">•••• {String(1000 + (h.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 9000))}</span>
                        <span className="rounded-full bg-[var(--os-selected)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)]">Default</span>
                        <span className="ml-auto text-[12px] text-[var(--os-ink-subtle)]">On file for deposits</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Positions ── */}
                {tab === "Positions" && (
                  hhPositions.length === 0 ? (
                    <p className="py-8 text-center text-[13px] text-[var(--os-ink-muted)]">No documented positions for {h.name}. Positions land here as returns are prepared.</p>
                  ) : (
                    <div className="mx-auto max-w-[760px]">
                      <SectionHead title="Documented positions" count={hhPositions.length} />
                      <div className="space-y-5">
                        {hhPositions.map((p, idx) => {
                          const eng = engagementById(p.engagementId);
                          return (
                            <div key={p.id} className={cn("pt-4", idx > 0 && "border-t border-[var(--os-border)]")}>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                {eng && <FormChip form={eng.form} />}
                                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--os-ink)]">{p.issue}</span>
                                {p.status === "open" ? (
                                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-[var(--os-ink-muted)]"><span className="size-1.5 rounded-full bg-amber-500" /> Open</span>
                                ) : (
                                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]"><span className="size-1.5 rounded-full bg-emerald-500" /> Resolved by {p.resolvedBy}{p.resolvedOn ? ` · ${fmtDate(p.resolvedOn)}` : ""}</span>
                                )}
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--os-ink-muted)]">
                                <span className="inline-flex items-center rounded-full bg-[var(--os-selected)] px-2 py-0.5 text-[11px] font-medium">{p.authorityLevel}</span>
                                <span className="tabular-nums">Confidence {Math.round(p.confidence * 100)}%</span>
                              </div>
                              <ul className="mt-2 space-y-0.5">
                                {p.documentation.map((d, i) => (
                                  <li key={i} className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                                    <Icon icon={I.file} size={12} className="shrink-0 text-[var(--os-ink-subtle)]" /> {d}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}

                {/* ── Notes ── */}
              </div>
            )}
          </div>

          {/* Right rail: Ask Petal (assistant) · Details (properties) · Notes.
              Also a drop target - drag a document here and Petal reviews it. */}
          <motion.aside
            key={h.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onDragOver={e => { if (e.dataTransfer.types.includes("text/petal-doc")) { e.preventDefault(); setPetalDropOver(true); } }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPetalDropOver(false); }}
            onDrop={e => { e.preventDefault(); const name = e.dataTransfer.getData("text/petal-doc"); setPetalDropOver(false); if (name) attachDoc(name); }}
            className="relative hidden w-[360px] shrink-0 flex-col border-l border-[var(--os-border)] lg:flex"
          >
            <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-3">
              {(["Ask Petal", "Details", "Notes"] as const).map(p => (
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

            {panel === "Ask Petal" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                  {/* Petal's opening read - plain assistant prose */}
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalMark className="size-3" /> Petal</div>
                    <StreamedText key={h.id} text={petalAnswer} className="text-[13.5px] leading-relaxed text-[var(--os-ink)]" onDone={() => setOpeningReady(true)} />
                    {openTasks.length > 0 && openingReady && (
                      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} onClick={() => setTab("Tasks")} className={cn("mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--os-link)] hover:underline", FOCUS)}>
                        Open the {openTasks.length === 1 ? "task" : "tasks"} <Icon icon={I.chevronRight} size={11} />
                      </motion.button>
                    )}
                  </div>

                  {/* conversation */}
                  {chat.messages.map((m, mi) =>
                    m.role === "user" ? (
                      <div key={m.id} className="flex flex-col items-end gap-1.5">
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {m.attachments.map(name => (
                              <span key={name} className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] py-1.5 pl-2 pr-3 shadow-[0_1px_2px_rgba(17,17,26,0.04)]">
                                <FileGlyph kind={docKind(name)} size={26} className="shrink-0" />
                                <span className="flex min-w-0 flex-col">
                                  <span className="max-w-[150px] truncate text-[12px] font-medium leading-tight text-[var(--os-ink)]">{name}</span>
                                  <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-[var(--os-ink-subtle)]">{docKind(name)}</span>
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                        {m.text && <div className="max-w-[85%] rounded-2xl bg-[var(--os-selected)] px-3.5 py-2 text-[13px] leading-relaxed text-[var(--os-ink)]">{m.text}</div>}
                      </div>
                    ) : (
                      <div key={m.id}>
                        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]"><PetalLogo key={m.thinking ? "load" : "done"} loading={m.thinking} className="size-3.5 shrink-0 text-[var(--os-primary)]" /> Petal</div>
                        <PetalAnswerView
                          answer={m.answer}
                          thinking={m.thinking}
                          compact
                          stream={m.id === [...chat.messages].reverse().find(x => x.role === "petal")?.id}
                          onSuggest={q => sendChat(q)}
                        />
                        {!m.thinking && (() => {
                          const prev = chat.messages[mi - 1];
                          const q = prev && prev.role === "user" ? prev.text : "";
                          const saved = savedMem.has(m.id);
                          if (!q) return null;
                          return (
                            <button
                              onClick={() => { if (saved) return; memoryStore.add(h.id, q, "flag", "From Ask Petal · just now"); setSavedMem(s => new Set(s).add(m.id)); }}
                              disabled={saved}
                              className={cn("mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium transition-colors", saved ? "text-[var(--os-ink-muted)]" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]", FOCUS)}
                            >
                              {saved
                                ? <><Icon icon={I.check} size={12} className="text-[var(--os-primary)]" /> Saved to {first(h.name)}&apos;s memory</>
                                : <><PetalMark className="size-3" /> Save to memory</>}
                            </button>
                          );
                        })()}
                      </div>
                    ),
                  )}

                  {/* suggested prompts - pill chips fade in once the opening read finishes typing */}
                  {chat.messages.length === 0 && openingReady && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="flex flex-wrap gap-1.5 pt-0.5">
                      {[`What's blocking ${first(h.name)}?`, "What's next?", "Summarize open items"].map(s => (
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
                    {attachments.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {attachments.map(name => (
                          <span key={name} className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] py-1.5 pl-2 pr-1.5 shadow-[0_1px_2px_rgba(17,17,26,0.04)]">
                            <FileGlyph kind={docKind(name)} size={26} className="shrink-0" />
                            <span className="flex min-w-0 flex-col">
                              <span className="max-w-[150px] truncate text-[12px] font-medium leading-tight text-[var(--os-ink)]">{name}</span>
                              <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-[var(--os-ink-subtle)]">{docKind(name)}</span>
                            </span>
                            <button onClick={() => setAttachments(prev => prev.filter(n => n !== name))} aria-label={`Remove ${name}`} className="grid size-5 shrink-0 place-items-center rounded-full text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={12} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                      rows={1}
                      placeholder={attachments.length ? "Add a message, or send to have Petal review…" : "Ask Petal…"}
                      className="max-h-28 w-full resize-none bg-transparent text-[13px] leading-relaxed text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
                    />
                    <div className="mt-1 flex items-center gap-1">
                      <button className={cn("grid size-7 place-items-center rounded-full text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)} aria-label="Attach"><Icon icon={I.attach} size={15} /></button>
                      <button
                        onClick={() => sendChat()}
                        disabled={!chatInput.trim() && attachments.length === 0}
                        className={cn("ml-auto grid size-7 place-items-center rounded-full bg-[var(--os-primary)] text-[var(--os-primary-fg)] transition-opacity disabled:opacity-25", FOCUS)}
                        aria-label="Send"
                      >
                        <Icon icon={I.send} size={14} />
                      </button>
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
                    <LRow label="Status"><StageTag stage={stage} /></LRow>
                    <LRow label="Owner"><AssigneePicker householdId={h.id} className="-ml-1" /></LRow>
                    <LRow label="Type">{kindLabel[h.kind]}</LRow>
                    <LRow label="Service">{h.serviceTier}</LRow>
                    <LRow label="Since"><span className="tabular-nums">{h.since}</span></LRow>
                    <LRow label="8821">{h.has8821 ? "On file" : "Not on file"}</LRow>
                  </div>
                </LCard>

                {/* Progress - segmented Documents / Returns with stat rows (Linear) */}
                <LCard title="Progress">
                  <Segmented
                    value={progressTab}
                    onChange={v => setProgressTab(v as "Documents" | "Returns")}
                    options={[{ value: "Documents", label: "Documents" }, { value: "Returns", label: "Returns" }]}
                    className="mb-3"
                  />
                  {progressTab === "Documents" ? (
                    <>
                      <div className="mb-1 flex items-center gap-2 px-0.5">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
                          <div className={cn("h-full rounded-full", docs.inHand >= docs.denom ? "bg-emerald-500" : docs.denom > 0 && docs.inHand / docs.denom >= 0.5 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${docs.denom > 0 ? Math.round((docs.inHand / docs.denom) * 100) : 100}%` }} />
                        </div>
                        <span className="shrink-0 text-[12px] tabular-nums text-[var(--os-ink-muted)]">{docs.label}</span>
                      </div>
                      <div className="mt-1.5 border-t border-[var(--os-border)] pt-1">
                        <StatRow dot="bg-emerald-500" label="Received" value={docs.have} />
                        {docs.needsReview > 0 && <StatRow dot="bg-amber-500" label="Needs review" value={docs.needsReview} />}
                        <StatRow dot="bg-[var(--os-border-strong)]" label="Requested" value={docs.requested} />
                      </div>
                    </>
                  ) : (() => {
                    const filed = engs.filter(e => e.stage === "e_filed" || e.stage === "accepted").length;
                    const inProg = engs.length - filed;
                    return (
                      <>
                        <div className="mb-1 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--os-selected)]">
                          <div className="h-full bg-emerald-500" style={{ width: `${engs.length ? (filed / engs.length) * 100 : 0}%` }} />
                          <div className="h-full bg-blue-500" style={{ width: `${engs.length ? (inProg / engs.length) * 100 : 0}%` }} />
                        </div>
                        <div className="mt-1.5 border-t border-[var(--os-border)] pt-1">
                          <StatRow dot="bg-emerald-500" label="Filed" value={filed} />
                          <StatRow dot="bg-blue-500" label="In progress" value={inProg} />
                        </div>
                      </>
                    );
                  })()}
                </LCard>

                {/* Entities */}
                <LCard title="Entities" action={<span className="text-[11px] tabular-nums text-[var(--os-ink)]">{ents.length}</span>}>
                  <div className="space-y-0.5">
                    {ents.map(e => (
                      <div key={e.id} className="flex items-center gap-2.5 px-0.5 py-1.5">
                        <FormChip form={e.form} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-[var(--os-ink)]">{e.name}</div>
                          <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{e.type}{e.ein ? ` · EIN ${e.ein}` : ""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </LCard>

                {/* People */}
                <LCard title="People" action={<span className="text-[11px] tabular-nums text-[var(--os-ink)]">{ppl.length}</span>}>
                  <div className="space-y-0.5">
                    {ppl.map(p => (
                      <div key={p.id} className="flex items-center gap-2.5 px-0.5 py-1.5">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(p.name)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-[var(--os-ink)]">{p.name}</div>
                          <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{p.email}</div>
                        </div>
                        <span className="shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{p.role}</span>
                      </div>
                    ))}
                  </div>
                </LCard>
              </div>
            )}

            {panel === "Notes" && <NotesThread scopeId={h.id} scopeLabel={h.name} onToast={show} />}

            {/* drop overlay */}
            {petalDropOver && (
              <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-[var(--os-accent)]/[0.06] ring-2 ring-inset ring-[var(--os-accent)]">
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--os-accent)] bg-[var(--os-surface)] px-3 py-2 text-[12.5px] font-medium text-[var(--os-accent)] shadow-sm">
                  <PetalMark className="size-3.5" /> Drop to ask Petal
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}

      {/* document review modal (shared with /os/documents) */}
      <AnimatePresence>{openDoc && <ReviewModal doc={openDoc} onClose={() => setOpenDoc(null)} />}</AnimatePresence>

      {/* task detail modal (shared with /os/tasks) */}
      <AnimatePresence>
        {taskItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} onClick={() => setTaskOpen(null)} className="fixed inset-0 z-30 grid place-items-center bg-black/20 p-4 backdrop-blur-[6px] sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.16, ease: "easeOut" }} onClick={e => e.stopPropagation()}
              className="flex h-[82vh] w-full max-w-[920px] overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
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
