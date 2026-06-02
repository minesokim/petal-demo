"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  ExternalLinkIcon,
  FileTextIcon,
  MailIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PetalMark } from "@/components/petal-mark";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useToast } from "@/components/ui/toast-notification";
import {
  TRIAGE_TIERS,
  TRIAGE_ISSUES,
  RESOLVED_TODAY,
  defaultTrustTierFor,
  deriveAuditRisk,
  hasAuditRisk,
  deriveAuditRiskFactors,
  auditRiskBand,
  deriveTimeline,
  type TriageIssue,
  type TriageTier,
  type TimelineEvent,
  type ResolvedItem,
} from "@/lib/triage-mock-data";

/** Snoozed items use the same shape as ResolvedItem - the only difference
 *  is what `dispatchedAt` means semantically. Defining a shared alias here
 *  rather than importing because it's a local UI concern. */
type DispatchedItem = {
  id: string;
  clientName: string;
  title: string;
  typeLabel: string;
  dispatchedAt: string;
};
import { clients, type DraftMessage, type MessageChannel, type Client } from "@/lib/mock-data";
import { type TrustTier } from "@/components/trust-tier-badge";
import { useAIPanelAsk } from "@/components/ai-panel";
import { DraftMessageCard } from "@/components/insights/draft-message";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { useSession } from "@/lib/session-context";
import {
  getAllAssignmentOverrides,
  subscribeAssignmentOverrides,
} from "@/lib/client-assignment-store";
import { useSyncExternalStore } from "react";
import {
  UserCheck,
  ExternalLink,
  ShieldAlert,
  Link2,
  Building2,
  Sparkles,
  AlertCircle,
  Send,
  FileSignature,
  GraduationCap,
  GitMerge,
  Map as MapIcon,
  RotateCcw,
  Scale,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SourceChip } from "@/components/integrations/source-chip";
import { getIntegration } from "@/lib/integrations-mock-data";
import { addClientFlag } from "@/lib/client-issues-store";
import { TriageIssueMenu } from "@/components/triage/triage-issue-menu";
import { useTierOverrides } from "@/lib/triage-tier-override-store";
import { useIssueAssignments } from "@/lib/triage-issue-assignment-store";
import { FIRM, memberInitials } from "@/lib/firm-mock-data";
import { BookmarkPlus } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Page - 3-column layout matching the reference design:
//   [ Queue (3) | Detail (6) | Context (3) ]
//
// Left rail = Group/Sort + tier-grouped issue cards with risk chips
// Middle    = action-first hero (recommendation + action row) + structured
//             client/return/next-step blocks
// Right     = standing context panel (Why · Evidence · Sources · Timeline ·
//             Risk & Confidence) - no more collapsible disclosures
// ─────────────────────────────────────────────────────────────────────────

const EMPTY_ASSIGNMENT_OVERRIDES: Record<string, string | null> = {};

export default function TriagePage() {
  const { user } = useSession();
  // Subscribe to assignment overrides so the "My queue" count + filtered list
  // re-render the moment someone reassigns a client elsewhere (popup, full page).
  const assignmentOverrides = useSyncExternalStore(
    subscribeAssignmentOverrides,
    getAllAssignmentOverrides,
    () => EMPTY_ASSIGNMENT_OVERRIDES
  );
  // Per-issue tier overrides from the 3-dot "Bump priority" action. Applied
  // to each issue's tier before grouping so a bumped card visibly jumps to
  // a different status section.
  const tierOverrides = useTierOverrides();
  // Per-issue delegations from the 3-dot "Assign to teammate" action. Used
  // by the "Mine" filter: an individual assignment OVERRIDES the client-level
  // assignee, so a delegated issue drops off the assigner's Mine and lands
  // on the assignee's.
  const issueAssignmentsMap = useIssueAssignments();

  const [selectedId, setSelectedId] = useState<string>(TRIAGE_ISSUES[0]?.id ?? "");
  const [showResolved, setShowResolved] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [sortBy, setSortBy] = useState<SortBy>("priority");
  // "My queue" — narrow the issue list to clients assigned to the active
  // user. Off by default; auto-disables for the AI persona (Petal has no
  // direct assignments).
  const [mineOnly, setMineOnly] = useState(false);
  useEffect(() => {
    if (user.role === "ai" && mineOnly) setMineOnly(false);
  }, [user.role, mineOnly]);
  // Session state - issues the user has actually resolved or snoozed during
  // this session. They disappear from the active queue and appear in their
  // respective sidebar sections.
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(() => new Set());
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(() => new Set());
  // Flagged is a third dispatched bucket alongside resolved + snoozed.
  // Mental model: "I bookmarked this for the client's record, deferred
  // from active queue." Flagged items also write through to the client's
  // Flags card via addClientFlag.
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => new Set());
  const [sessionResolved, setSessionResolved] = useState<ResolvedItem[]>([]);
  const [sessionSnoozed, setSessionSnoozed] = useState<DispatchedItem[]>([]);
  const [sessionFlagged, setSessionFlagged] = useState<DispatchedItem[]>([]);
  // When the user clicks a resolved or snoozed item in the sidebar, the
  // middle panel switches to a read-only view of that item. `null` means
  // we're back on the active queue.
  const [viewingDispatched, setViewingDispatched] = useState<{
    kind: "resolved" | "snoozed" | "flagged";
    id: string;
  } | null>(null);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [showFlagged, setShowFlagged] = useState(true); // open by default — flagged is the "memory" bucket
  // Client popup state — opened by clicking the avatar/name in the Client
  // card on the IssueDetail middle panel. The "View details" link in the
  // Return card still routes to the full client page; this gives a quick
  // peek without losing your place in the triage queue.
  const [popupClient, setPopupClient] = useState<Client | null>(null);
  const { showToast } = useToast();

  // Flag model B: flags live on client pages, NOT in triage. The Flag
  // button in triage creates a ClientIssue + resolves the original triage
  // item (= it leaves the queue). We no longer derive flag-shaped triage
  // cards from ClientIssue records — that was the duplicating loop we
  // killed deliberately.

  // Derived: active issues (excluding resolved + snoozed) and queue sections
  // grouped + sorted per the toolbar dropdowns. The "My queue" toggle layers
  // an additional filter that resolves each issue's clientId → effective
  // assignee (override > seed) and keeps only issues for the active user.
  const clientAssignee = (clientId: string): string | undefined => {
    if (clientId in assignmentOverrides) {
      return assignmentOverrides[clientId] ?? undefined;
    }
    return clients.find((c) => c.id === clientId)?.assignedTo;
  };
  // Who effectively owns a given ISSUE: an individual delegation wins over
  // the client-level assignee. This is what the "Mine" filter checks, so a
  // delegated issue moves from the assigner's queue to the assignee's.
  const effectiveIssueOwner = (issue: { id: string; clientId: string }): string | undefined =>
    issueAssignmentsMap[issue.id]?.assigneeId ?? clientAssignee(issue.clientId);

  const activeIssues = useMemo(
    () =>
      TRIAGE_ISSUES.filter((i) => {
        if (resolvedIds.has(i.id) || snoozedIds.has(i.id) || flaggedIds.has(i.id)) return false;
        if (mineOnly && effectiveIssueOwner(i) !== user.id) return false;
        return true;
      })
        // Apply any tier overrides (Bump priority) so the card lands in the
        // section the user moved it to.
        .map((i) =>
          tierOverrides[i.id] && tierOverrides[i.id] !== i.tier
            ? { ...i, tier: tierOverrides[i.id] }
            : i
        ),
    [resolvedIds, snoozedIds, flaggedIds, mineOnly, user.id, assignmentOverrides, tierOverrides, issueAssignmentsMap]
  );

  // Count for the toggle label: how many active issues belong to the user?
  // Computed against the full active set (ignoring the mineOnly filter) so
  // the chip still shows "My queue · 7" even while it's turned on.
  const myCount = useMemo(
    () =>
      TRIAGE_ISSUES.filter(
        (i) =>
          !resolvedIds.has(i.id) &&
          !snoozedIds.has(i.id) &&
          !flaggedIds.has(i.id) &&
          effectiveIssueOwner(i) === user.id
      ).length,
    [resolvedIds, snoozedIds, flaggedIds, user.id, assignmentOverrides, issueAssignmentsMap]
  );
  const sections = useMemo(
    () => getQueueSections(groupBy, sortBy, activeIssues),
    [groupBy, sortBy, activeIssues]
  );

  // Flat display order — the exact sequence of issues as they appear in the
  // queue sidebar. Arrow keys MUST walk this list, not the raw activeIssues
  // array, because activeIssues is in declaration order but the visible
  // queue is grouped + sorted. Walking the wrong order is why arrow nav
  // felt random — pressing ↓ on a "right_now" item jumped to whatever was
  // next in TRIAGE_ISSUES (often in a different section visually).
  const displayOrder = useMemo<TriageIssue[]>(
    () => sections.flatMap((s) => s.items),
    [sections]
  );

  const selected = activeIssues.find((i) => i.id === selectedId);
  const currentIdx = activeIssues.findIndex((i) => i.id === selectedId);

  // Refs of the latest displayOrder + selectedId so the window keydown
  // handler (registered once on mount) always navigates the CURRENTLY
  // VISIBLE queue order, not a stale snapshot or the raw insertion order.
  // Arrow keys must follow what the eye sees — flat order through grouped
  // sections — otherwise pressing ↓ feels like teleporting around.
  const displayOrderRef = useRef(displayOrder);
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    displayOrderRef.current = displayOrder;
  }, [displayOrder]);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const goPrev = () => {
    const list = displayOrderRef.current;
    const currentId = selectedIdRef.current;
    const idx = list.findIndex((i) => i.id === currentId);
    if (idx === -1) {
      // Stale selection — recover by going to the first visible item.
      if (list[0]) setSelectedId(list[0].id);
      return;
    }
    if (idx > 0) setSelectedId(list[idx - 1].id);
  };
  const goNext = () => {
    const list = displayOrderRef.current;
    const currentId = selectedIdRef.current;
    const idx = list.findIndex((i) => i.id === currentId);
    if (idx === -1) {
      if (list[0]) setSelectedId(list[0].id);
      return;
    }
    if (idx < list.length - 1) setSelectedId(list[idx + 1].id);
  };

  // Advance to the next visible issue when the current one is dispatched
  // (resolved or snoozed). If there are none left, leave selectedId as-is
  // so the empty state renders.
  const advanceAfterDispatch = (dispatchedId: string) => {
    const remaining = activeIssues.filter((i) => i.id !== dispatchedId);
    if (remaining.length === 0) return;
    const idx = activeIssues.findIndex((i) => i.id === dispatchedId);
    const next = remaining[Math.min(idx, remaining.length - 1)] ?? remaining[0];
    setSelectedId(next.id);
  };

  const handleResolve = (issue: TriageIssue) => {
    setResolvedIds((prev) => new Set([...prev, issue.id]));
    setSessionResolved((prev) => [
      {
        id: issue.id,
        clientName: issue.clientName,
        title: issue.title,
        typeLabel: issue.typeLabel,
        resolvedAt: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      },
      ...prev,
    ]);
    showToast("success", "Resolved", `${issue.title.split(" ").slice(0, 6).join(" ")}…`);
    advanceAfterDispatch(issue.id);
  };

  const handleSnooze = (issue: TriageIssue) => {
    setSnoozedIds((prev) => new Set([...prev, issue.id]));
    setSessionSnoozed((prev) => [
      {
        id: issue.id,
        clientName: issue.clientName,
        title: issue.title,
        typeLabel: issue.typeLabel,
        dispatchedAt: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      },
      ...prev,
    ]);
    showToast("success", "Snoozed until tomorrow", issue.clientName);
    advanceAfterDispatch(issue.id);
  };

  // Un-snooze: pull the issue out of snoozedIds (so it reappears in the
  // active queue) and remove its sidebar entry.
  const handleUnsnooze = (id: string) => {
    setSnoozedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSessionSnoozed((prev) => prev.filter((s) => s.id !== id));
    setViewingDispatched(null);
    setSelectedId(id);
    showToast("success", "Back on your queue", "Issue reactivated");
  };

  // Flag: bookmark to the client's page AND move the triage item to the
  // Flagged dispatched bucket. Symmetric to snooze but with a different
  // semantic ("memory" vs "later"). The ClientIssue write happens at the
  // call site so the title/description can be edited inline.
  const handleFlag = (issue: TriageIssue) => {
    setFlaggedIds((prev) => new Set([...prev, issue.id]));
    setSessionFlagged((prev) => [
      {
        id: issue.id,
        clientName: issue.clientName,
        title: issue.title,
        typeLabel: issue.typeLabel,
        dispatchedAt: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      },
      ...prev,
    ]);
    advanceAfterDispatch(issue.id);
  };

  // Un-flag: bring the issue back to the active queue. The ClientIssue
  // bookmark on the client page stays — un-flagging only affects triage.
  const handleUnflag = (id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSessionFlagged((prev) => prev.filter((f) => f.id !== id));
    setViewingDispatched(null);
    setSelectedId(id);
    showToast("success", "Back on your queue", "Issue reactivated (bookmark still on client page)");
  };

  // Click a resolved/snoozed/flagged sidebar row → switch the middle panel
  // to a read-only "dispatched" view of that item. Clicking any active
  // queue row clears the view back to active.
  const viewResolved = (id: string) => setViewingDispatched({ kind: "resolved", id });
  const viewSnoozed = (id: string) => setViewingDispatched({ kind: "snoozed", id });
  const viewFlagged = (id: string) => setViewingDispatched({ kind: "flagged", id });

  // Selecting an active queue item also exits the dispatched-view mode.
  const selectActive = (id: string) => {
    setViewingDispatched(null);
    setSelectedId(id);
  };

  // Resolve dispatched items for the middle-panel renderer.
  const viewingResolvedItem =
    viewingDispatched?.kind === "resolved"
      ? sessionResolved.find((r) => r.id === viewingDispatched.id) ??
        RESOLVED_TODAY.find((r) => r.id === viewingDispatched.id) ??
        null
      : null;
  const viewingSnoozedItem =
    viewingDispatched?.kind === "snoozed"
      ? sessionSnoozed.find((s) => s.id === viewingDispatched.id) ?? null
      : null;
  const viewingFlaggedItem =
    viewingDispatched?.kind === "flagged"
      ? sessionFlagged.find((f) => f.id === viewingDispatched.id) ?? null
      : null;

  // Underlying issue for the dispatched view. First try a real TriageIssue
  // by id (session-resolved/snoozed/flagged items match this way). Fall
  // back to synthesizing one from the dispatched item's minimal fields so
  // even mock RESOLVED_TODAY rows (synthetic ids like "r1") render the
  // full IssueDetail layout instead of the stripped DispatchedDetail.
  const dispatchedAt = viewingResolvedItem
    ? viewingResolvedItem.resolvedAt
    : viewingSnoozedItem?.dispatchedAt
      ?? viewingFlaggedItem?.dispatchedAt
      ?? "";
  const dispatchedIssue: TriageIssue | null = (() => {
    if (!viewingDispatched) return null;
    const real = TRIAGE_ISSUES.find((i) => i.id === viewingDispatched.id);
    if (real) return real;
    // Synthesize from the resolved/snoozed/flagged item's minimal data.
    const source = viewingResolvedItem ?? viewingSnoozedItem ?? viewingFlaggedItem;
    if (!source) return null;
    const client = clients.find((c) => c.fullName === source.clientName);
    return {
      id: source.id,
      tier: "needs_review",
      type: "return_review",
      typeLabel: source.typeLabel,
      clientId: client?.id ?? "",
      clientName: source.clientName,
      clientAvatar: client?.avatar,
      title: source.title,
      whyNow: `${source.clientName}'s ${source.typeLabel.toLowerCase()} was cleared at ${dispatchedAt}. Petal logged the resolution on the client's timeline and is monitoring for any follow-up signals from the IRS or the client.`,
      context: [
        "All due-diligence checks satisfied at time of resolution",
        "Full receipt + outcome documented on the client's audit trail",
        "Petal continues passive monitoring for related anomalies",
      ],
      confidence: "High",
      recommendation:
        "This task is complete. No further action required - it lives on the client's permanent record. Reopen via Bring back to queue if circumstances change.",
      sources: ["Resolution log", "Client timeline", "Petal audit trail"],
      estimatedMin: 0,
    };
  })();

  // ── Keyboard navigation: J/K + arrow keys ──
  useEffect(() => {
    // Throttle window for OS key-autorepeat. macOS/Windows fire many
    // keydown events for a single hold; we cap to ~one nav per 130ms so a
    // quick tap doesn't accidentally skip 5 issues at once. Native
    // event.repeat is also checked first — it's true for OS-generated
    // repeats but false for genuine fresh keydowns, so we drop those
    // entirely (intentional hold = repeated tap, not slide-through).
    let lastNavAt = 0;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTyping) return;

      const isNavKey =
        e.key === "j" || e.key === "ArrowDown" || e.key === "k" || e.key === "ArrowUp";
      if (!isNavKey) return;

      // Always block the browser's default scroll on nav keys.
      e.preventDefault();

      // Drop OS-autorepeat events outright; only manual key presses advance.
      if (e.repeat) return;

      // Belt-and-suspenders: also throttle to one nav per 130ms in case
      // the browser doesn't set event.repeat reliably.
      const now = Date.now();
      if (now - lastNavAt < 130) return;
      lastNavAt = now;

      if (e.key === "j" || e.key === "ArrowDown") {
        goNext();
      } else {
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const remainingCount = activeIssues.length;
  // All resolved items - session-resolved on top (most recent first) then
  // the static mock RESOLVED_TODAY. Used for the queue's Resolved-today
  // section and for done-count math.
  const allResolved = useMemo(
    () => [...sessionResolved, ...RESOLVED_TODAY],
    [sessionResolved]
  );
  const doneCount = allResolved.length;
  const completionPct = Math.round((doneCount / (doneCount + remainingCount)) * 100);

  // Time saved by Petal today - rough heuristic: ~35 min saved per resolved issue
  const timeSavedMin = doneCount * 35;
  const tsHours = Math.floor(timeSavedMin / 60);
  const tsMins = timeSavedMin % 60;
  const timeSavedLabel = tsHours > 0 ? `${tsHours}h ${tsMins}m` : `${tsMins}m`;

  // Remaining work ETA — computed from the LIVE remaining queue so it shrinks
  // as issues are resolved/snoozed/flagged. (Previously frozen: totalMin was a
  // []-memo over ALL issues and never recalculated, so "time left / clear by"
  // never moved while the open/cleared counts did.)
  const remainingMin = activeIssues.reduce((sum, i) => sum + (i.estimatedMin ?? 0), 0);
  const clearBy = new Date(Date.now() + remainingMin * 60 * 1000);
  const clearByLabel = clearBy.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex h-[var(--content-full-height)] min-h-[600px] flex-col gap-3">
      {/* ── Compact header: title + counts left · Petal-saved + progress right ── */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border/60 pb-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-display text-xl tracking-tight md:text-2xl">Tasks</h1>
          <span className="text-[12px] text-muted-foreground">
            <span className="font-medium text-foreground/75 tabular-nums">{remainingCount}</span> open
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="tabular-nums">{doneCount}</span> cleared today
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <PetalMark className="size-3 text-foreground/55" />
            saved
            <span className="font-display text-[14px] font-medium tabular-nums tracking-tight text-foreground">
              {timeSavedLabel}
            </span>
            today
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-1.5">
            <span className="tabular-nums">{completionPct}%</span>
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-emerald-500/70 transition-all"
                style={{ width: `${completionPct}%` }}
                aria-hidden="true"
              />
            </span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>
            clear by{" "}
            <span className="font-medium text-foreground/75 tabular-nums">{clearByLabel}</span>
          </span>
        </div>
      </header>

      {/* ── 3-column body - queue · detail · context ── */}
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-12">
        {/* ── LEFT: Queue ── */}
        <aside className="flex min-h-0 flex-col rounded-lg border bg-card md:col-span-3">
          {/* Group + Sort dropdowns */}
          <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2.5">
            <ToolbarDropdown
              icon={SlidersHorizontalIcon}
              label="Group"
              value={groupBy}
              options={[
                { value: "status", label: "Status" },
                { value: "client", label: "Client" },
                { value: "tier", label: "Trust tier" },
                { value: "source", label: "Source" },
              ]}
              onChange={(v) => setGroupBy(v as typeof groupBy)}
            />
            <ToolbarDropdown
              label="Sort"
              value={sortBy}
              options={[
                { value: "priority", label: "Priority" },
                { value: "newest", label: "Newest" },
                { value: "fastest", label: "Fastest" },
              ]}
              onChange={(v) => setSortBy(v as typeof sortBy)}
            />
          </div>

          {/* "Scope" row — segmented "Everyone / Mine" toggle. Lives on its
              own row underneath Group/Sort so the narrow col-span-3 queue
              panel doesn't overflow. Hidden for Petal (AI persona). */}
          {user.role !== "ai" && (
            <div className="flex shrink-0 items-center gap-1 border-b border-border/60 bg-muted/30 px-3 py-1.5">
              <span className="mr-1 text-[11.5px] font-medium text-muted-foreground/80">
                Showing
              </span>
              <div className="inline-flex items-center rounded-md border border-border/60 bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setMineOnly(false)}
                  className={cn(
                    "inline-flex h-6 items-center rounded px-2 text-[11.5px] font-medium transition-colors",
                    !mineOnly
                      ? "bg-foreground/[0.07] text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Everyone
                  <span className="ml-1.5 tabular-nums text-foreground/40">
                    {TRIAGE_ISSUES.filter(
                      (i) => !resolvedIds.has(i.id) && !snoozedIds.has(i.id)
                    ).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMineOnly(true)}
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded px-2 text-[11.5px] font-medium transition-colors",
                    mineOnly
                      ? "bg-foreground/[0.07] text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={`Show only ${user.shortName}'s queue`}
                >
                  <UserCheck className="size-3" />
                  Mine
                  <span className="tabular-nums text-foreground/40">{myCount}</span>
                </button>
              </div>
            </div>
          )}

          {/* Issue list - scrolls internally. Sections separated by hairline
              dividers + generous top padding for breathing room. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {/* Flagged — pinned to the TOP of the queue. These are the items
                the user explicitly bookmarked, so they should be the first
                thing seen, not sunk beneath the active queue. Each row shows
                a bookmark icon. Also writes through to the client's page. */}
            {sessionFlagged.length > 0 && (
              <section className="pb-2">
                <button
                  onClick={() => setShowFlagged((v) => !v)}
                  className="flex w-full items-center gap-2 px-1.5 py-1 text-left transition-opacity hover:opacity-80"
                >
                  <BookmarkIcon className="size-3 text-amber-600" />
                  <span className="text-[12.5px] font-medium text-foreground">Flagged</span>
                  <span className="text-[10.5px] tabular-nums text-muted-foreground/70">
                    {sessionFlagged.length}
                  </span>
                  <ChevronDownIcon
                    className={cn(
                      "ml-auto size-3 text-muted-foreground transition-transform",
                      showFlagged && "rotate-180"
                    )}
                  />
                </button>
                {showFlagged && (
                  <ul className="mt-2 space-y-1">
                    {sessionFlagged.map((item) => {
                      const isSelected =
                        viewingDispatched?.kind === "flagged" && viewingDispatched.id === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => viewFlagged(item.id)}
                            className={cn(
                              "group flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                              isSelected
                                ? "bg-muted/60 ring-1 ring-inset ring-foreground/10"
                                : "hover:bg-muted/40"
                            )}
                          >
                            <BookmarkIcon className="mt-1 size-3 shrink-0 text-amber-600" />
                            <div className="min-w-0 flex-1">
                              <div className="line-clamp-2 text-[12.5px] leading-snug text-foreground/85 group-hover:text-foreground">
                                {item.title}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                                <span className="truncate">{item.clientName}</span>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="shrink-0 tabular-nums">{item.dispatchedAt}</span>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {sections.map((section, i) => (
              <section
                key={section.key}
                className={cn(
                  "pb-2",
                  // Separator above each section after the first — and above
                  // the very first active section too when the Flagged block
                  // is pinned above it.
                  (i > 0 || sessionFlagged.length > 0) && "mt-5 border-t border-border/40 pt-5"
                )}
              >
                <div className="mb-2.5 flex items-center gap-2 px-1.5">
                  {section.dot && <span className={cn("size-1.5 shrink-0 rounded-full", section.dot)} />}
                  {section.avatar && (
                    <Avatar className="size-3.5 shrink-0">
                      <AvatarImage src={section.avatar} alt={section.label} />
                      <AvatarFallback className="text-[7px] font-medium">
                        {getInitials(section.label)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-[12.5px] font-medium text-foreground">
                    {section.label}
                  </span>
                  <span className="text-[10.5px] tabular-nums text-muted-foreground/70">
                    {section.items.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {section.items.map((issue) => (
                    <li key={issue.id}>
                      <QueueItem
                        issue={issue}
                        isSelected={issue.id === selectedId}
                        onSelect={() => selectActive(issue.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {/* Resolved today - bigger per-item rows, clickable, with
                generous bottom padding so the last item never feels cramped
                against the panel edge. Pulls from the combined session +
                mock list so newly-resolved items show up at the top in
                real time. */}
            <section className="mt-5 border-t border-border/40 pt-5 pb-6">
              <button
                onClick={() => setShowResolved((v) => !v)}
                className="flex w-full items-center gap-2 px-1.5 py-1 text-left transition-opacity hover:opacity-80"
              >
                <CheckIcon className="size-3 text-emerald-600" />
                <span className="text-[12.5px] font-medium text-foreground">
                  Resolved today
                </span>
                <span className="text-[10.5px] tabular-nums text-muted-foreground/70">
                  {allResolved.length}
                </span>
                <ChevronDownIcon
                  className={cn(
                    "ml-auto size-3 text-muted-foreground transition-transform",
                    showResolved && "rotate-180"
                  )}
                />
              </button>
              {showResolved && (
                <ul className="mt-2 space-y-1">
                  {allResolved.map((item) => {
                    const isSelected =
                      viewingDispatched?.kind === "resolved" && viewingDispatched.id === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => viewResolved(item.id)}
                          className={cn(
                            "group flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                            isSelected
                              ? "bg-muted/60 ring-1 ring-inset ring-foreground/10"
                              : "hover:bg-muted/40"
                          )}
                        >
                          <CheckIcon className="mt-1 size-3 shrink-0 text-emerald-500/80" />
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-2 text-[12.5px] leading-snug text-foreground/85 group-hover:text-foreground">
                              {item.title}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                              <span className="truncate">{item.clientName}</span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="shrink-0 tabular-nums">{item.resolvedAt}</span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Snoozed - only renders when there's at least one snoozed
                item in the session. Same collapsible pattern as Resolved
                today; clicking an item opens its read-only view in the
                middle panel with an Unsnooze affordance. */}
            {sessionSnoozed.length > 0 && (
              <section className="mt-5 border-t border-border/40 pt-5 pb-6">
                <button
                  onClick={() => setShowSnoozed((v) => !v)}
                  className="flex w-full items-center gap-2 px-1.5 py-1 text-left transition-opacity hover:opacity-80"
                >
                  <ClockIcon className="size-3 text-amber-600" />
                  <span className="text-[12.5px] font-medium text-foreground">Snoozed</span>
                  <span className="text-[10.5px] tabular-nums text-muted-foreground/70">
                    {sessionSnoozed.length}
                  </span>
                  <ChevronDownIcon
                    className={cn(
                      "ml-auto size-3 text-muted-foreground transition-transform",
                      showSnoozed && "rotate-180"
                    )}
                  />
                </button>
                {showSnoozed && (
                  <ul className="mt-2 space-y-1">
                    {sessionSnoozed.map((item) => {
                      const isSelected =
                        viewingDispatched?.kind === "snoozed" && viewingDispatched.id === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => viewSnoozed(item.id)}
                            className={cn(
                              "group flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                              isSelected
                                ? "bg-muted/60 ring-1 ring-inset ring-foreground/10"
                                : "hover:bg-muted/40"
                            )}
                          >
                            <ClockIcon className="mt-1 size-3 shrink-0 text-amber-500/80" />
                            <div className="min-w-0 flex-1">
                              <div className="line-clamp-2 text-[12.5px] leading-snug text-foreground/85 group-hover:text-foreground">
                                {item.title}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                                <span className="truncate">{item.clientName}</span>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="shrink-0 tabular-nums">{item.dispatchedAt}</span>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>

        </aside>

        {/* ── MIDDLE: Detail ── */}
        <main className="min-h-0 overflow-y-auto rounded-lg border bg-card md:col-span-6">
          {dispatchedIssue && viewingDispatched ? (
            // Dispatched view: full IssueDetail with status banner +
            // limited actions. The underlying issue is either a real
            // TriageIssue (session-resolved/snoozed) or a synthesized one
            // (mock RESOLVED_TODAY rows). Either way, the user sees the
            // same Why/Evidence/Sources/Timeline/Risk layout.
            <IssueDetail
              issue={dispatchedIssue}
              currentIdx={0}
              total={1}
              onPrev={() => {}}
              onNext={() => {}}
              onAction={(label) => showToast("success", label, "Coming soon")}
              onResolve={() => {}}
              onSnooze={() => {}}
              onFlag={() => {}}
              onOpenClientPopup={() => {
                const c = clients.find((cl) => cl.id === dispatchedIssue.clientId);
                if (c) setPopupClient(c);
              }}
              dispatchedMode={{
                kind: viewingDispatched.kind,
                at: dispatchedAt,
                onBack: () => setViewingDispatched(null),
                onUnsnooze:
                  viewingDispatched.kind === "snoozed"
                    ? () => handleUnsnooze(viewingDispatched.id)
                    : undefined,
                onUnflag:
                  viewingDispatched.kind === "flagged"
                    ? () => handleUnflag(viewingDispatched.id)
                    : undefined,
              }}
            />
          ) : selected ? (
            <IssueDetail
              issue={selected}
              currentIdx={currentIdx}
              total={activeIssues.length}
              onPrev={goPrev}
              onNext={goNext}
              onAction={(label) => showToast("success", label, "Coming soon")}
              onResolve={() => handleResolve(selected)}
              onSnooze={() => handleSnooze(selected)}
              onFlag={(title, description) => {
                // Flag = bookmark to the client's page AND move the
                // triage item into the Flagged dispatched bucket (its
                // own collapsible section in the sidebar, parallel to
                // Snoozed). Reactivate from there anytime.
                addClientFlag({
                  clientId: selected.clientId,
                  title,
                  description,
                  source: "manual",
                });
                handleFlag(selected);
                showToast(
                  "success",
                  "Flagged",
                  `Bookmarked on ${selected.clientName}'s page · moved to Flagged section.`
                );
              }}
              onOpenClientPopup={() => {
                const c = clients.find((cl) => cl.id === selected.clientId);
                if (c) setPopupClient(c);
              }}
            />
          ) : (
            <EmptyState />
          )}
        </main>

        {/* ── RIGHT: Context column. Two stacked cards - a standalone
              stat strip on top, and the main IssueContext card below it.
              The stat strip stays pinned at the top of the column (no
              overflow); the body card scrolls if its content overflows. */}
        <aside className="flex min-h-0 flex-col gap-3 md:col-span-3">
          {(dispatchedIssue || selected) && (
            <StatStripCard issue={(dispatchedIssue ?? selected)!} />
          )}
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-card">
            {dispatchedIssue ? (
              <IssueContext issue={dispatchedIssue} />
            ) : selected ? (
              <IssueContext issue={selected} />
            ) : null}
          </div>
        </aside>
      </div>

      {/* Client popup — opens when the user clicks the avatar/name in the
          IssueDetail's Client card. Closing returns to the triage panel
          with no state loss. */}
      <ClientDetailDialog
        client={popupClient}
        open={!!popupClient}
        onOpenChange={(open) => !open && setPopupClient(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Queue item - compact card with title, client, time, and audit-risk chip
// ─────────────────────────────────────────────────────────────────────────

function QueueItem({
  issue,
  isSelected,
  onSelect,
}: {
  issue: TriageIssue;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const risk = deriveAuditRisk(issue);
  const showRisk = hasAuditRisk(issue);
  const topDriver = showRisk ? deriveAuditRiskFactors(issue)[0] : null;
  const riskColor =
    risk >= 25 ? "text-red-600" : risk >= 12 ? "text-amber-600" : "text-emerald-600";
  // Note: type icons were stripped from the queue intentionally — they
  // competed with source chips and avatars, and the queue row should have
  // one visual hook per row, not three. Type identity lives in the detail
  // panel chips (Flagged / Deadline / Audit rep / etc.) and the kicker line.
  // When this row becomes selected (typically via arrow keys / j/k), scroll
  // it into view inside the queue panel and run a tiny attention pulse so
  // the eye finds the new focus immediately. `block: "nearest"` means we
  // only scroll when the row is actually off-screen.
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isSelected || !buttonRef.current) return;
    buttonRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isSelected]);

  return (
    <button
      ref={buttonRef}
      onClick={onSelect}
      data-selected={isSelected ? "true" : "false"}
      className={cn(
        // `relative` anchors the left-edge marker (the absolutely-positioned
        // <span> below). Linear-style: a thin vertical bar slides in along
        // the left edge when this row gains focus.
        "group relative flex w-full flex-col gap-1.5 rounded-md px-2 py-2.5 text-left transition-all duration-200 ease-out",
        isSelected
          ? "bg-muted/60 ring-1 ring-inset ring-foreground/15 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "ring-1 ring-inset ring-transparent hover:bg-muted/30"
      )}
    >
      {/* Focus marker — thin foreground bar on the left edge that fades +
          scales in when selected. Mirrors Linear's selection affordance. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-1.5 left-0 w-[2px] rounded-r-full bg-foreground/70 transition-all duration-200 ease-out",
          isSelected ? "opacity-100 scale-y-100" : "opacity-0 scale-y-50"
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-1 text-[12.5px] font-medium text-foreground/90">
          {issue.title}
        </span>
        <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground">
          {issue.estimatedMin}m
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{issue.clientName}</span>
          {issue.sourceIntegrationId && (
            <>
              <span className="text-foreground/25" aria-hidden="true">·</span>
              <SourceChip integrationId={issue.sourceIntegrationId} size="xs" />
            </>
          )}
        </span>
        {showRisk && (
          <span
            className={cn("flex shrink-0 items-center gap-0.5 tabular-nums", riskColor)}
            title={topDriver ? `${auditRiskBand(risk)} audit risk — mostly ${topDriver.label.toLowerCase()}` : `Audit risk ${risk}%`}
          >
            <ShieldAlert className="size-2.5" />
            {risk}%
          </span>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Toolbar dropdown - Group / Sort selectors
// ─────────────────────────────────────────────────────────────────────────

function ToolbarDropdown({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md border border-transparent bg-transparent py-1 pl-1.5 pr-6 text-[11.5px] font-medium text-foreground/80 outline-none transition-colors hover:border-border focus:border-border"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {label}: {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-1 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
      {Icon && <Icon className="pointer-events-none absolute left-1.5 top-1/2 hidden size-3 -translate-y-1/2 text-muted-foreground" />}
      {/* Visual label fallback (selects show their own option text, label appears via "Label: Option" pattern) */}
      <span className="sr-only">{label}: {current.label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Issue detail - middle column
// ─────────────────────────────────────────────────────────────────────────

function IssueDetail({
  issue,
  currentIdx,
  total,
  onPrev,
  onNext,
  onAction,
  onResolve,
  onSnooze,
  onFlag,
  onOpenClientPopup,
  dispatchedMode,
}: {
  issue: TriageIssue;
  currentIdx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onAction: (label: string) => void;
  onResolve: () => void;
  onSnooze: () => void;
  /** Bookmark this issue as a persistent flag on the client. Mirrors the
   *  OpenItemsSection "Add" flow. The triage issue stays in the queue;
   *  flagging just adds a parallel ClientIssue record for the client page. */
  onFlag: (title: string, description: string) => void;
  /** Opens the ClientDetailDialog popup with the issue's client. Clicking
   *  the avatar/name in the Client card triggers this; the "View details"
   *  link in the Return card still routes to the full client page. */
  onOpenClientPopup?: () => void;
  /** When set, the issue is being viewed in a read-only dispatched state
   *  (resolved, snoozed, or flagged). Hides the prev/next nav (shows Back
   *  to queue instead), swaps the urgency byline for a status banner,
   *  hides the Resolve/Snooze action buttons, and surfaces an Unsnooze /
   *  Unflag affordance when appropriate. */
  dispatchedMode?: {
    kind: "resolved" | "snoozed" | "flagged";
    at: string;
    onBack: () => void;
    onUnsnooze?: () => void;
    onUnflag?: () => void;
  } | null;
}) {
  const risk = deriveAuditRisk(issue);
  const riskColor =
    risk >= 25 ? "text-red-600" : risk >= 12 ? "text-amber-600" : "text-emerald-600";
  const client = clients.find((c) => c.id === issue.clientId);
  // Tier metadata - used for the urgency dot in the byline (red = blocks
  // filing, blue = needs client, amber = later today, neutral = needs review)
  const tier = TRIAGE_TIERS.find((t) => t.key === issue.tier)!;

  // Per-issue delegation — if this issue was assigned to a teammate via the
  // 3-dot menu, surface a chip so the assignment is visible.
  const issueAssignments = useIssueAssignments();
  const assignment = issueAssignments[issue.id];
  const assignedMember = assignment
    ? FIRM.members.find((m) => m.id === assignment.assigneeId)
    : undefined;

  // "Flag this" inline form state — renders as a preview of the resulting
  // flag row so the user sees exactly what they're creating. Title +
  // description are pre-filled from the triage issue but freely editable.
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagTitle, setFlagTitle] = useState("");
  const [flagDescription, setFlagDescription] = useState("");
  const handleStartFlag = () => {
    setFlagTitle(issue.title);
    setFlagDescription(issue.whyNow);
    setFlagOpen(true);
  };
  const handleSubmitFlag = () => {
    if (!flagTitle.trim()) return;
    onFlag(flagTitle.trim(), flagDescription.trim());
    setFlagOpen(false);
    setFlagTitle("");
    setFlagDescription("");
  };
  const handleCancelFlag = () => {
    setFlagOpen(false);
    setFlagTitle("");
    setFlagDescription("");
  };

  // Ask Petal - opens the side panel pre-filled with a contextual prompt
  // about this specific issue. Guarded with try/catch because the page can
  // theoretically render outside an AIPanelProvider in tests/snapshots.
  let askPetal: (q: string) => void = () => {};
  try {
    askPetal = useAIPanelAsk();
  } catch {
    // no provider in scope - silently no-op
  }
  const askPrompt = `About ${issue.clientName}'s ${issue.typeLabel.toLowerCase()} - "${issue.title}". Walk me through your reasoning, the trade-offs, and what I should consider before deciding.`;


  return (
    <article className="space-y-4 px-5 pb-5 pt-3 md:px-6 md:pb-6 md:pt-4">
      {/* ── Top nav row. In active mode: pagination counter + prev/next/more.
            In dispatched mode: Back to queue link (this issue isn't part of
            the active sequence anymore). ── */}
      <div>
        {/* Header row — kicker (tier dot + typeLabel, or dispatched status)
            anchors the top-LEFT, pagination + prev/next anchors the top-RIGHT.
            Pulled out of the byline so the title sits directly underneath the
            kicker without a competing chip-strip between them. */}
        <header className="mb-3 flex items-center justify-between gap-2">
          {/* Kicker — top-left corner of the detail card */}
          <span className="inline-flex items-center gap-1.5 text-[12px] text-foreground/80">
            {dispatchedMode ? (
              <>
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    dispatchedMode.kind === "resolved"
                      ? "bg-emerald-500"
                      : dispatchedMode.kind === "flagged"
                        ? "bg-amber-600"
                        : "bg-amber-500"
                  )}
                />
                <span className={cn(
                  "font-medium inline-flex items-center gap-1",
                  dispatchedMode.kind === "resolved"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : dispatchedMode.kind === "flagged"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-amber-700 dark:text-amber-400"
                )}>
                  {dispatchedMode.kind === "flagged" && (
                    <BookmarkIcon className="size-3" />
                  )}
                  {dispatchedMode.kind === "resolved"
                    ? "Resolved"
                    : dispatchedMode.kind === "flagged"
                      ? "Flagged"
                      : "Snoozed"}
                </span>
                <span className="text-foreground/35">·</span>
                <span className="tabular-nums">{dispatchedMode.at}</span>
                <span className="text-foreground/35">·</span>
                <span>{issue.typeLabel}</span>
              </>
            ) : (
              <>
                <span
                  className={cn("size-1.5 shrink-0 rounded-full", tier.dot)}
                  title={`Urgency: ${tier.label}`}
                />
                {issue.typeLabel}
              </>
            )}
          </span>

          {/* Right cluster — Back to queue OR pagination + nav */}
          {dispatchedMode ? (
            <button
              onClick={dispatchedMode.onBack}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <ArrowLeftIcon className="size-3" /> Back to queue
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] tabular-nums text-muted-foreground">
                {currentIdx + 1} <span className="text-muted-foreground/40">/</span> {total}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onPrev}
                  disabled={currentIdx === 0}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  title="Previous (K)"
                >
                  <ArrowLeftIcon className="size-3.5" />
                </button>
                <button
                  onClick={onNext}
                  disabled={currentIdx === total - 1}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  title="Next (J)"
                >
                  <ArrowRightIcon className="size-3.5" />
                </button>
                {/* 3-dot overflow — Assign, Reassign client, Snooze until,
                    Bump priority, Convert to flag, Copy link, History,
                    Report to Petal. Role-gated inside the menu. */}
                <TriageIssueMenu
                  issue={issue}
                  onSnooze={onSnooze}
                  onConvertToFlag={() => onFlag(issue.title, issue.whyNow)}
                />
              </div>
            </div>
          )}
        </header>

        {/* Hero block: title leads, then byline, then deck */}
        <div className="space-y-2.5">
          <h2 className="font-display text-[24px] leading-tight tracking-tight md:text-[28px]">
            {issue.title}
          </h2>
          {/* Byline row — kicker (tier dot + typeLabel) lifted to the
              header above; this row now only carries the type-specific
              origin chip (Flagged, From inbox, Deadline, etc.) when one
              applies, plus the source chip + any delegation chip. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground/80">
            {/* Delegation chip — when this issue was assigned to a teammate
                via the 3-dot menu. Shows assignee + due + approval-gate cue. */}
            {!dispatchedMode && assignment && assignedMember && (
              <span
                className="inline-flex items-center gap-1.5 rounded bg-violet-100 px-1.5 py-0.5 text-[10.5px] font-medium text-violet-800 dark:bg-violet-900/50 dark:text-violet-200"
                title={`Assigned to ${assignedMember.fullName}${assignment.approvalGate ? " · your approval required before send" : ""}`}
              >
                <Avatar className="size-3.5">
                  {assignedMember.avatar && (
                    <AvatarImage src={assignedMember.avatar} alt={assignedMember.fullName} />
                  )}
                  <AvatarFallback className="text-[6px] font-semibold">
                    {memberInitials(assignedMember)}
                  </AvatarFallback>
                </Avatar>
                {assignedMember.shortName}
                <span className="text-violet-800/50 dark:text-violet-200/50">·</span>
                due {new Date(assignment.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {assignment.approvalGate && (
                  <ShieldCheckIcon className="size-2.5" />
                )}
              </span>
            )}
            {/* Origin chip — only on cross-system items so the user knows
                where this came from without opening the source. Flag chip
                removed: flags don't surface as triage cards anymore (model B). */}
            {!dispatchedMode && issue.type === "message" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10.5px] font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                title="Surfaced from an inbound client message"
              >
                <MessageSquareIcon className="size-2.5" />
                From inbox
              </span>
            )}
            {!dispatchedMode && issue.type === "regulatory_deadline" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10.5px] font-medium text-red-800 dark:bg-red-900/50 dark:text-red-200"
                title="Compliance / regulatory deadline"
              >
                <ShieldAlert className="size-2.5" />
                Deadline
              </span>
            )}
            {!dispatchedMode && issue.type === "prep_blocker" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-[10.5px] font-medium text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"
                title="Resolving this unblocks downstream work"
              >
                <Link2 className="size-2.5" />
                Blocker
              </span>
            )}
            {!dispatchedMode && issue.type === "business_ops" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-stone-200 px-1.5 py-0.5 text-[10.5px] font-medium text-stone-700 dark:bg-stone-800/60 dark:text-stone-200"
                title="Practice operations — not client-side"
              >
                <Building2 className="size-2.5" />
                Practice
              </span>
            )}
            {!dispatchedMode && issue.type === "proactive_opportunity" && (
              // "Holographic Pokemon card" chip — gradient surface with a
              // gradient-text label and a violet PetalMark. Reads as
              // "Petal noticed something worth chasing." The background is
              // a translucent gradient with an inset ring for the iridescent
              // border feel; the label uses background-clip text for the
              // gradient-typography effect.
              <span
                className="relative inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-semibold"
                title="Petal-surfaced advisory opportunity"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(139,92,246,0.20) 100%)",
                  boxShadow: "inset 0 0 0 1px rgba(139,92,246,0.40)",
                }}
              >
                <PetalMark className="size-2.5 text-violet-600 dark:text-violet-400" />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Opportunity
                </span>
              </span>
            )}
            {!dispatchedMode && issue.type === "e_file_status" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                title="E-file transmission status"
              >
                <Send className="size-2.5" />
                E-file
              </span>
            )}
            {!dispatchedMode && issue.type === "engagement_letter" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 text-[10.5px] font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
                title="Engagement letter — annual renewal cycle"
              >
                <FileSignature className="size-2.5" />
                Engagement
              </span>
            )}
            {!dispatchedMode && issue.type === "cpe_tracking" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-sky-100 px-1.5 py-0.5 text-[10.5px] font-medium text-sky-800 dark:bg-sky-900/50 dark:text-sky-200"
                title="Continuing professional education"
              >
                <GraduationCap className="size-2.5" />
                CPE
              </span>
            )}
            {!dispatchedMode && issue.type === "k1_inflow" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-cyan-100 px-1.5 py-0.5 text-[10.5px] font-medium text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200"
                title="Waiting on upstream K-1"
              >
                <GitMerge className="size-2.5" />
                K-1
              </span>
            )}
            {!dispatchedMode && issue.type === "multi_state" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-teal-100 px-1.5 py-0.5 text-[10.5px] font-medium text-teal-800 dark:bg-teal-900/50 dark:text-teal-200"
                title="Multi-state return triggered"
              >
                <MapIcon className="size-2.5" />
                Multi-state
              </span>
            )}
            {!dispatchedMode && issue.type === "amended_return" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-pink-100 px-1.5 py-0.5 text-[10.5px] font-medium text-pink-800 dark:bg-pink-900/50 dark:text-pink-200"
                title="Amended return (1040-X)"
              >
                <RotateCcw className="size-2.5" />
                Amended
              </span>
            )}
            {!dispatchedMode && issue.type === "audit_representation" && (
              <span
                className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10.5px] font-medium text-red-800 dark:bg-red-900/50 dark:text-red-200"
                title="Client under IRS audit"
              >
                <Scale className="size-2.5" />
                Audit rep
              </span>
            )}
            {/* Estimated time chip moved to the right-rail StatStripCard
                (4th column) so the kicker line doesn't get crowded. */}
            {/* Source integration chip — when this card came from a
                connected app, show which one + last-sync timestamp so the
                user can trust the data lineage. */}
            {!dispatchedMode && issue.sourceIntegrationId && (
              <span className="inline-flex items-center gap-1 rounded border border-border/70 bg-background px-1.5 py-0.5">
                <SourceChip integrationId={issue.sourceIntegrationId} size="sm" showSync />
              </span>
            )}
          </div>
          {/* Sub-headline - sans, slightly larger than body and lightly
              muted. No italics, no serif. Hierarchy via size + tighter
              leading + subtle color. */}
          {issue.needsResponseBy && (
            <p className="text-[14.5px] font-normal leading-snug text-foreground/65">
              {issue.needsResponseBy}
            </p>
          )}
        </div>
      </div>

      {/* ── Petal recommends + action row ──
            Outer container = darkish-gray "AI surface" so the recommendation
            block reads as Petal's own panel, distinct from the white draft
            card it contains. (Inner DraftMessageCard keeps its own bg.)
            Trust tier surfaces inline with the "Petal recommends" label
            because it describes *how* the recommendation will execute -
            putting it here keeps it contextual instead of a free-floating
            chip in the meta strip. ── */}
      <div className="space-y-3 rounded-lg border border-foreground/12 bg-muted/70 px-4 pb-4 pt-5 dark:bg-muted/40">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground/[0.08]">
            <PetalMark className="size-3 text-foreground/70" />
          </span>
          <div className="flex-1">
            {/* Header line - 2 elements only: kicker on the left, Ask Petal
                on the right. Trust tier moved into the right-rail Risk &
                confidence section so this line breathes. */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
              <span className="text-[11px] font-medium text-foreground/55">
                Petal recommends
              </span>
              <button
                onClick={() => askPetal(askPrompt)}
                className="group flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-foreground/55 transition-colors hover:bg-background/70 hover:text-foreground"
                title={`Ask Petal about ${issue.clientName}'s issue`}
              >
                {/* PetalMark spins a full 360° on hover - playful but quiet,
                    600ms keeps it elegant rather than gimmicky. */}
                <PetalMark className="size-3 text-foreground/55 transition-all duration-500 ease-out group-hover:rotate-180 group-hover:text-foreground" />
                Ask Petal
                <ArrowRightIcon className="size-2.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-foreground">
              {issue.recommendation}
            </p>
            {/* "Next step" hint — quiet preview of what unblocks after this
                resolves. Bridges the queue's per-card view to the broader
                workflow chain so the user sees continuity. Only renders
                when deriveNextStep has a meaningful hint for this type. */}
            {!dispatchedMode && (() => {
              const next = deriveNextStep(issue.type);
              if (!next) return null;
              return (
                <p className="mt-2 flex items-start gap-1.5 text-[11.5px] italic leading-relaxed text-foreground/55">
                  <ArrowRightIcon className="mt-[3px] size-2.5 shrink-0 text-foreground/40" />
                  <span>Once resolved: {next}</span>
                </p>
              );
            })()}
          </div>
        </div>

        {/* AI-drafted reply preview - DraftMessageCard owns its own action
            footer (Send / Edit / channel switcher), and the card chrome
            adapts per channel (Apple-Mail letterhead for email; chat-bubble
            for SMS; portal-notification for portal). The outer action row
            handles only secondary moves (Call · Snooze · Resolve). The
            `key={issue.id}` forces a remount on navigation so the card's
            internal channel state resets between issues. */}
        {issue.recommendedReply && (
          <DraftMessageCard
            key={issue.id}
            draft={toDraftMessage(issue)}
            client={client}
            onSend={(channel) => onAction(`Sent via ${CHANNEL_LABEL[channel]}`)}
            onEdit={() => onAction("Edit reply")}
          />
        )}

        {/* Outer action row - secondary moves only.
            - Open workspace: only when no draft exists (otherwise card owns primary)
            - Call: only when phone escalation is the genuine next move
            - Snooze + Resolve: always */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {dispatchedMode ? (
            // Dispatched mode: hide Resolve/Snooze (already done) and
            // surface Unsnooze / Unflag when applicable. Mock RESOLVED_TODAY
            // items don't expose callbacks so the row may be empty.
            dispatchedMode.kind === "snoozed" && dispatchedMode.onUnsnooze ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-border/60 px-3 text-[12px]"
                onClick={dispatchedMode.onUnsnooze}
              >
                <CheckIcon className="size-3.5" /> Bring back to queue
              </Button>
            ) : dispatchedMode.kind === "flagged" && dispatchedMode.onUnflag ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-border/60 px-3 text-[12px]"
                onClick={dispatchedMode.onUnflag}
                title="Bookmark stays on client page; this only restores triage visibility"
              >
                <CheckIcon className="size-3.5" /> Bring back to queue
              </Button>
            ) : null
          ) : (
            <>
              {/* Deep-link to external tool — when an integration owns the
                  actual work (open in Drake/Lacerte/QuickBooks/etc.), the
                  deep-link is the PRIMARY action. Branded with integration color. */}
              {issue.deepLink && (() => {
                const dl = issue.deepLink;
                const integ = getIntegration(dl.integrationId);
                return (
                  <a
                    href={dl.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: integ?.brandColor ?? "var(--foreground)",
                      color: integ?.brandText ?? "var(--background)",
                    }}
                    onClick={() => onAction(dl.label)}
                  >
                    <ExternalLink className="size-3.5" />
                    {dl.label}
                  </a>
                );
              })()}
              {!issue.recommendedReply && !issue.deepLink && (
                <Link href={`/dashboard/clients/${issue.clientId}/overview`}>
                  <Button
                    size="sm"
                    className="bg-foreground text-background hover:bg-foreground/90"
                  >
                    <ExternalLinkIcon className="size-3.5" /> Open workspace
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-border/60 px-3 text-[12px] text-foreground/75 hover:bg-muted/40 hover:text-foreground"
                onClick={onSnooze}
              >
                <ClockIcon className="size-3.5" /> Snooze
              </Button>
              {/* Flag this — bookmarks the issue as a persistent ClientIssue
                  on the client's page. Same affordance the OpenItemsSection
                  uses, just initiated from triage. Skip for issues that ARE
                  already flag-derived (no point flagging a flag). */}
              {issue.type !== "flag" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-border/60 px-3 text-[12px] text-foreground/75 hover:bg-muted/40 hover:text-foreground"
                  onClick={handleStartFlag}
                  title="Bookmark this for later — appears in the client's Flags card"
                >
                  <BookmarkPlus className="size-3.5" /> Flag
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-8 gap-1.5 px-3 text-[12px] text-foreground/75 hover:bg-muted/40 hover:text-foreground"
                onClick={onResolve}
              >
                <CheckIcon className="size-3.5" /> Resolve
              </Button>
            </>
          )}
        </div>

        {/* Inline Flag form — rendered as a PREVIEW of the resulting Flag
            row so the user sees exactly what they're about to create.
            Mirrors components/issues/issue-row.tsx field-for-field:
              - Red AlertCircle on the left (mt-0.5)
              - Editable title (text-sm leading-snug)
              - Editable description (text-xs muted, line-clamp-2 in render)
              - Meta row with "just now" stand-in
              - "Flag" / "Cancel" buttons where Resolve would be on a real row
            Submitting writes to client-issues-store → flag appears here AND
            in the client's Flags card with identical look. Bouncy spring
            entry/exit so opening/closing feels alive, not snappy. */}
        <AnimatePresence initial={false}>
          {flagOpen && !dispatchedMode && (
          <motion.div
            key="flag-form"
            initial={{ opacity: 0, y: -6, scale: 0.94, height: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1, height: "auto" }}
            exit={{ opacity: 0, y: -4, scale: 0.96, height: 0 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 22,
              mass: 0.7,
              opacity: { duration: 0.15 },
              height: { type: "spring", stiffness: 320, damping: 26 },
            }}
            style={{ overflow: "hidden" }}
          >
          <div className="mt-2 rounded-lg border border-foreground/15 bg-card px-3 py-2.5 shadow-sm">
            {/* Kicker — makes it clear this is preview mode, not a real flag yet */}
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground/70">
              <span>Flag preview · how it&apos;ll appear on {issue.clientName}&apos;s page</span>
              <button
                onClick={handleCancelFlag}
                className="rounded px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                title="Cancel (Esc)"
              >
                Cancel
              </button>
            </div>

            {/* The actual row — matches IssueRow.tsx layout exactly */}
            <div className="flex items-start gap-2.5">
              {/* Status icon — red AlertCircle, same as a real flag row */}
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />

              {/* Editable content stack */}
              <div className="min-w-0 flex-1">
                {/* Title — looks identical to the rendered flag title;
                    the input has no chrome so it reads as the row's title text */}
                <input
                  value={flagTitle}
                  onChange={(e) => setFlagTitle(e.target.value)}
                  placeholder="What to remember about this..."
                  className="w-full bg-transparent text-sm leading-snug outline-none placeholder:text-muted-foreground/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitFlag();
                    if (e.key === "Escape") handleCancelFlag();
                  }}
                  autoFocus
                />

                {/* Description — chromeless textarea matching the body text style */}
                <textarea
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  placeholder="Additional context (optional)…"
                  rows={2}
                  className="mt-0.5 w-full resize-none bg-transparent text-xs leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitFlag();
                    if (e.key === "Escape") handleCancelFlag();
                  }}
                />

                {/* Meta row — "just now" stand-in for the createdAt timestamp
                    that the live row would show ("about 2 months ago" etc.) */}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/60">just now</span>
                  <span className="text-[10px] text-muted-foreground/40" aria-hidden="true">·</span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {issue.clientName}'s flags
                  </span>
                </div>
              </div>

              {/* Action — sits where "Resolve" lives on a real row */}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 shrink-0 gap-1 px-2 text-[10px] font-medium text-foreground hover:bg-muted/60"
                disabled={!flagTitle.trim()}
                onClick={handleSubmitFlag}
              >
                Flag
              </Button>
            </div>
          </div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Client + Return structured blocks ── */}
      {client && (
        <div className="grid gap-4 border-t border-border/60 pt-5 md:grid-cols-2">
          {/* Client card - avatar + name + filing-status byline. Clicking
              this opens the ClientDetailDialog popup (quick overview without
              leaving the triage panel). The "View details" link in the
              Return card next to it goes to the full client page instead.
              Wrapped in flex column so the inner button can stretch to
              match the Return card's height. */}
          <div className="flex flex-col">
            <div className="mb-1.5 text-[11px] font-medium text-foreground/55">
              Client
            </div>
            {/* Minimal border + padding + hover state so the avatar+name+
                byline reads as a single clickable card that opens the
                client popup. Replaces the prior opacity-only affordance,
                which gave no visual cue that the area was interactive. */}
            <button
              type="button"
              onClick={() => onOpenClientPopup?.()}
              className="group flex h-full w-full items-center gap-2.5 rounded-md border border-border/60 px-2.5 py-2 text-left transition-colors hover:border-border hover:bg-muted/30"
            >
              <Avatar className="size-9">
                <AvatarImage src={client.avatar} alt={client.fullName} />
                <AvatarFallback className="text-[10px] font-medium">
                  {getInitials(client.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-foreground/90 group-hover:text-foreground">
                  {client.fullName}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span>{filingStatusLabel(client.filingStatus)}</span>
                  <span className="text-muted-foreground/40">·</span>
                  {client.depositPaid ? (
                    <span className="whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                      paid in full
                    </span>
                  ) : (
                    <span className="whitespace-nowrap text-amber-700 dark:text-amber-400">
                      deposit pending
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Return card - matching border + hover treatment as the Client
              card. The whole card is a Link to the full client page. The
              flex column + h-full on the Link guarantees both cards stay
              the same height even when the Client byline wraps to a third
              line (e.g., "Head of household · deposit pending"). */}
          <div className="flex flex-col">
            <div className="mb-1.5 text-[11px] font-medium text-foreground/55">Return</div>
            <Link
              href={`/dashboard/clients/${client.id}/overview`}
              className="group flex h-full items-center justify-between gap-2.5 rounded-md border border-border/60 px-2.5 py-2 transition-colors hover:border-border hover:bg-muted/30"
            >
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-foreground/90 group-hover:text-foreground">
                  2025 {returnTypeLabel(client)}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                  <span className="tabular-nums text-foreground/75">${client.feeAmount}</span>
                  <span>fee</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{client.serviceTier}</span>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] text-muted-foreground transition-colors group-hover:text-foreground">
                Open file
                <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Next step - single-step recommendation, no numbered badge.
            All 22 mock issues genuinely have one next step (the AI
            recommendation), so numbering was performative. A small arrow
            glyph anchors the recommendation visually without pretending
            this is a multi-step procedure. */}
      <div className="border-t border-border/60 pt-5">
        <div className="mb-2 text-[11px] font-medium text-foreground/55">
          Next step
        </div>
        <div className="flex items-start gap-2.5">
          <ArrowRightIcon className="mt-1 size-3.5 shrink-0 text-foreground/55" />
          <div className="text-[13px] leading-relaxed text-foreground">
            {issue.recommendation}
            {issue.recommendedReply && (
              <span className="mt-1 block text-[12px] text-muted-foreground">
                Once sent, Petal logs the reply on {issue.clientName.split(" ")[0]}&apos;s timeline
                and continues monitoring.
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Issue context - right rail
// ─────────────────────────────────────────────────────────────────────────

function IssueContext({ issue }: { issue: TriageIssue }) {
  const timeline = deriveTimeline(issue);

  // Editorial discipline: hairline rules between every section, generous
  // top padding, stronger body-to-label contrast (label whisper, body
  // confident). Reads top-down like a magazine sidebar.
  return (
    <div className="p-5">
      {/* Stat strip lives in a separate card above this one (rendered at
          the aside level). This file's IssueContext starts directly with
          the lede content. */}

      {/* Why this surfaced - the lede. */}
      <section>
        <SectionLabel>Why this surfaced</SectionLabel>
        <p className="mt-3 text-[13px] leading-[1.6] text-foreground">{issue.whyNow}</p>
      </section>

      {/* Evidence */}
      {issue.context.length > 0 && (
        <section className="mt-6 border-t border-border/40 pt-5">
          <SectionLabel>Evidence</SectionLabel>
          <ul className="mt-3 space-y-2.5">
            {issue.context.slice(0, 6).map((bullet, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px] leading-[1.55] text-foreground">
                <span className="mt-[8px] size-1 shrink-0 rounded-full bg-foreground/70" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Files (signal + evidence files) */}
      {(issue.signal || (issue.evidence && issue.evidence.length > 0)) && (
        <section className="mt-6 border-t border-border/40 pt-5">
          <SectionLabel>Files &amp; signals</SectionLabel>
          <ul className="mt-3 space-y-2">
            {issue.signal && (
              <li className="flex items-start gap-2.5 rounded-md border border-border/60 bg-background px-2.5 py-2">
                <MailIcon className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-foreground">
                    {issue.signal.via} · {issue.signal.timestamp}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] italic leading-[1.5] text-foreground/65">
                    &ldquo;{issue.signal.quote}&rdquo;
                  </p>
                </div>
              </li>
            )}
            {issue.evidence?.map((e, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-md border border-border/60 bg-background px-2.5 py-2"
              >
                <FileTextIcon className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-foreground">{e.label}</div>
                  <div className="text-[10.5px] text-foreground/65">{e.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sources */}
      {issue.sources.length > 0 && (
        <section className="mt-6 border-t border-border/40 pt-5">
          <SectionLabel>Sources</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {issue.sources.map((src) => (
              <span
                key={src}
                className="rounded border border-border/70 bg-background px-2 py-0.5 text-[11px] text-foreground/85"
              >
                {src}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="mt-6 border-t border-border/40 pt-5">
        <SectionLabel>Timeline</SectionLabel>
        <ul className="mt-3 space-y-2">
          {timeline.map((ev, i) => (
            <TimelineRow key={i} event={ev} isLast={i === timeline.length - 1} />
          ))}
        </ul>
      </section>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Timeline row - date · dot · event, with vertical connector
// ─────────────────────────────────────────────────────────────────────────

function TimelineRow({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  const isCurrent = event.status === "current";
  const dotClass =
    event.status === "done"
      ? "bg-emerald-500 border-emerald-500"
      : isCurrent
      ? // Static halo restored as the resting anchor; the animated ping
        // ripples outward from the dot and fades right at the halo edge.
        "bg-emerald-500 border-emerald-500 ring-4 ring-emerald-500/20"
      : "bg-background border-border";
  const labelClass = event.status === "pending" ? "text-foreground/55" : "text-foreground";

  return (
    <li className="relative flex gap-2.5 pb-2 last:pb-0">
      {/* Vertical connector - 1px line at left-[3px] spans x=3 to x=4,
          centered at 3.5px = exact center of the 7px dot. Was left-[4px]
          (centered on the 9px dot) before the 20% shrink. */}
      {!isLast && <span className="absolute left-[3px] top-3 bottom-0 w-px bg-border/70" />}

      {/* Dot - shrunk 20% (9px → 7px). Animated ping still anchored at
          inset-0 so it scales from the dot edge. */}
      <span className="relative z-10 mt-1 size-[7px] shrink-0">
        {isCurrent && (
          <span
            className="absolute inset-0 animate-ping rounded-full bg-emerald-500/45 [animation-duration:1.6s]"
            aria-hidden="true"
          />
        )}
        <span className={cn("relative block size-full rounded-full border-2", dotClass)} />
      </span>

      {/* Text */}
      <div className="flex min-w-0 flex-col">
        <span className="text-[10.5px] tabular-nums text-muted-foreground">{event.date}</span>
        <span className={cn("text-[12px] leading-snug", labelClass)}>{event.event}</span>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  // Sentence-case kicker - sized so right-rail section headings (Why this
  // surfaced, Evidence, Sources, etc.) feel like proper article subheads
  // rather than tiny captions. Color + weight still mark them as labels,
  // not body.
  return (
    <div className="text-[13.5px] font-medium text-foreground/70">{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Trust tier inline - quiet typographic version of the trust-tier badge.
// No pill, no ring - just a tiny dot + lowercase label that reads as a
// modifier on the section it lives inside ("Petal recommends · auto").
// Editorial discipline: never let a chip break a kicker line's rhythm.
// ─────────────────────────────────────────────────────────────────────────

const TRUST_TIER_INLINE_DOT: Record<TrustTier, string> = {
  auto: "bg-emerald-500",
  drafts: "bg-amber-500",
  asks: "bg-orange-500",
  manual: "bg-foreground/60",
};

/** Display label for each tier — singular form (Draft, Ask) instead of
 *  the awkward verb-as-noun plurals from the type key. */
const TRUST_TIER_DISPLAY: Record<TrustTier, string> = {
  auto: "Auto",
  drafts: "Draft",
  asks: "Ask",
  manual: "Manual",
};

const TRUST_TIER_INLINE_TITLE: Record<TrustTier, string> = {
  auto: "Auto - Petal handles, you see the receipt",
  drafts: "Drafts - Petal drafts, you approve before send",
  asks: "Asks - Petal flags, you make the call",
  manual: "Manual - Petal doesn't touch this",
};

/** Sentence-form descriptions for the right-rail Autonomy caption. Same
 *  meanings as `TRUST_TIER_INLINE_TITLE` minus the leading tier label. */
const TRUST_TIER_MEANING: Record<TrustTier, string> = {
  auto: "Petal handles this, you see the receipt",
  drafts: "Petal drafts, you approve before send",
  asks: "Petal flags, you make the call",
  manual: "Petal doesn't touch this",
};

function TrustTierInline({ tier }: { tier: TrustTier }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.04em] text-foreground/75"
      title={TRUST_TIER_INLINE_TITLE[tier]}
    >
      <span className={cn("size-1.5 rounded-full", TRUST_TIER_INLINE_DOT[tier])} />
      <span className="capitalize">{tier}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Group + Sort logic - powers the Group/Sort dropdowns in the queue toolbar
// ─────────────────────────────────────────────────────────────────────────

type GroupBy = "status" | "client" | "tier" | "source";
type SortBy = "priority" | "newest" | "fastest";

interface QueueSection {
  key: string;
  label: string;
  /** Optional colored dot - used for status + trust-tier groupings */
  dot?: string;
  /** Optional avatar URL - used for client groupings */
  avatar?: string;
  items: TriageIssue[];
}

/** Tier display priority for the "priority" sort:
 *  Blocks filing > Needs client > Later today > Needs review. */
const TIER_PRIORITY: Record<TriageTier, number> = {
  right_now: 0,
  waiting: 1,
  today: 2,
  needs_review: 3,
};

/** Trust-tier display priority - Auto first (Petal-handled, low-friction
 *  visibility), then Asks (decisions) → Drafts (reviews) → Manual (you-only). */
const TRUST_TIER_ORDER: TrustTier[] = ["auto", "asks", "drafts", "manual"];

const TRUST_TIER_DOT: Record<TrustTier, string> = {
  auto: "bg-emerald-500",
  drafts: "bg-amber-500",
  asks: "bg-orange-500",
  manual: "bg-foreground/60",
};

const TRUST_TIER_LABEL: Record<TrustTier, string> = {
  auto: "Auto · Petal handles",
  drafts: "Drafts · review before send",
  asks: "Asks · your decision",
  manual: "Manual · you handle",
};

/** Sort a flat list of issues per the chosen sort key. */
function sortIssues(items: TriageIssue[], sortBy: SortBy): TriageIssue[] {
  const out = [...items];
  switch (sortBy) {
    case "fastest":
      // Quick wins first - small estimated minutes ascending
      return out.sort((a, b) => a.estimatedMin - b.estimatedMin);
    case "newest":
      // Higher-numbered issue IDs are more recent in the mock array
      return out.sort((a, b) => idNum(b.id) - idNum(a.id));
    case "priority":
    default:
      // Tier priority first, then audit risk descending
      return out.sort((a, b) => {
        const tierDiff = TIER_PRIORITY[a.tier] - TIER_PRIORITY[b.tier];
        if (tierDiff !== 0) return tierDiff;
        return deriveAuditRisk(b) - deriveAuditRisk(a);
      });
  }
}

/** Build the queue sections for the chosen group + sort combination.
 *  Accepts an items source so the parent can pre-filter (excluding
 *  resolved + snoozed issues). */
function getQueueSections(groupBy: GroupBy, sortBy: SortBy, items: TriageIssue[] = TRIAGE_ISSUES): QueueSection[] {
  const all = items;

  if (groupBy === "client") {
    // One section per client, sections sorted by client name (alpha)
    const byClient = new Map<string, TriageIssue[]>();
    for (const issue of all) {
      const key = issue.clientId;
      const arr = byClient.get(key) ?? [];
      arr.push(issue);
      byClient.set(key, arr);
    }
    const sections: QueueSection[] = [];
    for (const [clientId, items] of byClient.entries()) {
      const client = clients.find((c) => c.id === clientId);
      sections.push({
        key: `client-${clientId}`,
        label: client?.fullName ?? items[0].clientName,
        avatar: client?.avatar ?? items[0].clientAvatar,
        items: sortIssues(items, sortBy),
      });
    }
    return sections.sort((a, b) => a.label.localeCompare(b.label));
  }

  if (groupBy === "tier") {
    // One section per trust tier in canonical order
    const byTier = new Map<TrustTier, TriageIssue[]>();
    for (const issue of all) {
      const tier = defaultTrustTierFor(issue);
      const arr = byTier.get(tier) ?? [];
      arr.push(issue);
      byTier.set(tier, arr);
    }
    return TRUST_TIER_ORDER.filter((t) => byTier.has(t)).map((t) => ({
      key: `tier-${t}`,
      label: TRUST_TIER_LABEL[t],
      dot: TRUST_TIER_DOT[t],
      items: sortIssues(byTier.get(t)!, sortBy),
    }));
  }

  if (groupBy === "source") {
    // One section per source integration. "Petal AI" bucket for issues
    // with no explicit source (= native Petal analysis).
    const bySource = new Map<string, TriageIssue[]>();
    for (const issue of all) {
      const key = issue.sourceIntegrationId ?? "_petal";
      const arr = bySource.get(key) ?? [];
      arr.push(issue);
      bySource.set(key, arr);
    }
    const sections: QueueSection[] = [];
    for (const [sourceId, items] of bySource.entries()) {
      const integration = sourceId === "_petal" ? null : getIntegration(sourceId);
      sections.push({
        key: `source-${sourceId}`,
        label: integration?.name ?? "Petal AI",
        // Use the integration's brand color as a tinted dot if available
        dot: integration ? undefined : "bg-violet-500",
        items: sortIssues(items, sortBy),
      });
    }
    // Sort by section size (largest first) — most-active sources up top
    return sections.sort((a, b) => b.items.length - a.items.length);
  }

  // Default: group by status (= TRIAGE_TIERS)
  return TRIAGE_TIERS
    .map((tier) => ({
      key: `status-${tier.key}`,
      label: tier.label,
      dot: tier.dot,
      items: sortIssues(
        all.filter((i) => i.tier === tier.key),
        sortBy
      ),
    }))
    .filter((s) => s.items.length > 0);
}

/** Extract the numeric portion of an issue ID ("i17" → 17) for sort comparisons. */
function idNum(id: string): number {
  const m = id.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

// ─────────────────────────────────────────────────────────────────────────
// Draft adapter - convert a TriageIssue's free-text `recommendedReply` into
// the structured `DraftMessage` shape the shared <DraftMessageCard> expects.
// Picks a sensible channel (default email; SMS for nudge escalations) and
// a contextual subject line so each draft reads as a real message, not a
// generic preview.
// ─────────────────────────────────────────────────────────────────────────

function toDraftMessage(issue: TriageIssue): DraftMessage {
  return {
    id: `triage-draft-${issue.id}`,
    channel: deriveDraftChannel(issue.type),
    subject: deriveDraftSubject(issue.type),
    content: issue.recommendedReply ?? "",
  };
}

function deriveDraftChannel(type: TriageIssue["type"]): MessageChannel {
  // Voicemail scripts and IRS letters still surface as email here because
  // those are the available channels in the shared component; in production
  // they'd map to dedicated voicemail / certified-mail channels.
  if (type === "nudge_escalation") return "sms";
  return "email";
}

/** Human-readable label per channel - used for the toast message when the
 *  shared DraftMessageCard fires its onSend callback. */
const CHANNEL_LABEL: Record<MessageChannel, string> = {
  email: "Email",
  sms: "SMS",
  portal: "Portal",
};


/** Short "what happens after you resolve this" hint by type. Surfaces
 *  downstream chain so the user sees workflow continuity, not isolated
 *  cards. Returns null when there's no natural next step. */
function deriveNextStep(type: TriageIssue["type"]): string | null {
  switch (type) {
    case "document_gap":
    case "intake_gap":
      return "Petal moves the return to ready_to_prep when all docs land.";
    case "books_discrepancy":
    case "txn_uncategorized":
      return "Books reconcile → Petal unblocks downstream prep items.";
    case "prep_ready":
      return "Once prepared, Petal queues internal review → client review → 8879.";
    case "return_review":
      return "After review, Petal sends to client for review + 8879.";
    case "signature":
      return "After 8879 + your ERO sig, Petal transmits to IRS + tracks acceptance.";
    case "e_file_status":
      return "On acceptance, Petal closes the engagement + queues the bill.";
    case "engagement_letter":
      return "Signed engagement unlocks prep workflow + payment processing.";
    case "k1_inflow":
      return "K-1 arrival lifts the prep block on this client's 1040.";
    case "multi_state":
      return "Adding the state return triggers nexus-specific compliance checks.";
    case "boi_filing":
      return "Filed BOI removes the FinCEN penalty meter from this client.";
    case "regulatory_deadline":
      return "Submission clears this deadline + Petal schedules the next renewal cycle.";
    case "flag":
      return "Resolving moves this to the client's resolved-flags log.";
    case "message":
      return "Reply sent → thread updates on both portal and email.";
    case "prep_blocker":
      return "Unblocking this releases the chained downstream items.";
    case "calendar_event":
      return "Post-call: Petal logs notes + queues action items into triage.";
    case "team_handoff":
      return "Your answer unblocks the teammate's prep work.";
    case "audit_representation":
      return "Response sent → Petal tracks IRS reply + schedules follow-up.";
    case "amended_return":
      return "Filed 1040-X → Petal tracks refund + updates client's records.";
    case "tax_planning":
    case "proactive_opportunity":
      return "Engagement opens an advisory workstream + recurring touchpoints.";
    default:
      return null;
  }
}

function deriveDraftSubject(type: TriageIssue["type"]): string {
  switch (type) {
    case "document_gap":
    case "intake_gap":
      return "Quick update on your remaining docs";
    case "extension_risk":
      return "Following up on your return";
    case "nudge_escalation":
      return "Quick check-in";
    case "irs_notice":
      return "Response to IRS notice · ready for your sign-off";
    case "compliance_alert":
      return "Quick check before we file";
    case "discovery":
      return "Found a tax-saving opportunity";
    case "prep_decision":
      return "Decision needed before we prep your return";
    case "meeting_prep":
      return "Pre-call brief ready for review";
    case "flag":
      return "Following up on a note I had on your return";
    case "message":
      return "Re: your message";
    case "business_ops":
      return "Friendly reminder · deposit still outstanding";
    case "proactive_opportunity":
      return "Quick idea I want to run by you";
    case "team_handoff":
      return "Quick question on your return";
    default:
      return "Quick check-in on your return";
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Dispatched detail - read-only view of a resolved or snoozed item, opened
// when the user clicks one in the left-rail Resolved/Snoozed sections.
// Mirrors the IssueDetail's editorial layout (kicker + headline + byline)
// but trims down to just the dispatched-state facts.
// ─────────────────────────────────────────────────────────────────────────

function DispatchedDetail({
  kind,
  item,
  onBack,
  onUnsnooze,
}: {
  kind: "resolved" | "snoozed";
  item: DispatchedItem;
  onBack: () => void;
  onUnsnooze?: () => void;
}) {
  const isResolved = kind === "resolved";
  const statusColor = isResolved ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400";
  const statusDot = isResolved ? "bg-emerald-500" : "bg-amber-500";
  const statusLabel = isResolved ? "Resolved" : "Snoozed";

  return (
    <article className="space-y-4 px-5 pb-5 pt-3 md:px-6 md:pb-6 md:pt-4">
      {/* Back button */}
      <header className="flex items-center justify-end gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3" /> Back to queue
        </button>
      </header>

      {/* Hero block - title + byline */}
      <div className="space-y-2.5">
        <h2 className="font-display text-[24px] leading-tight tracking-tight md:text-[28px] text-foreground/70">
          {item.title}
        </h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground/70">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("size-1.5 shrink-0 rounded-full", statusDot)} />
            <span className={cn("font-medium", statusColor)}>{statusLabel}</span>
          </span>
          <span className="text-foreground/35">·</span>
          <span>{item.typeLabel}</span>
          <span className="text-foreground/35">·</span>
          <span>{item.clientName}</span>
          <span className="text-foreground/35">·</span>
          <span className="tabular-nums">{item.dispatchedAt}</span>
        </div>
      </div>

      {/* Status card - what happened and what's next */}
      <div className="rounded-lg border border-foreground/10 bg-card p-4">
        {isResolved ? (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1 text-[13px] leading-relaxed text-foreground/85">
              You marked this resolved at <span className="tabular-nums">{item.dispatchedAt}</span>.
              Petal logged it on {item.clientName.split(" ")[0]}&apos;s timeline and is monitoring
              for any follow-up signals.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                <ClockIcon className="size-4" />
              </span>
              <div className="flex-1 text-[13px] leading-relaxed text-foreground/85">
                Snoozed at <span className="tabular-nums">{item.dispatchedAt}</span>. Petal will
                resurface this on tomorrow&apos;s queue.
              </div>
            </div>
            {onUnsnooze && (
              <div className="flex justify-start pl-10">
                <Button size="sm" variant="outline" className="h-8 gap-1.5 px-3 text-[12px]" onClick={onUnsnooze}>
                  <CheckIcon className="size-3.5" /> Bring back to queue now
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Stat strip card - the at-a-glance Audit risk / Confidence / Autonomy
// row. Rendered as its OWN standalone bordered card at the top of the
// right rail, above the main IssueContext card. Three flex columns with
// 1px divider grid-cells between them so the dividers reach top-to-bottom
// regardless of any flex/grid sizing quirks.
// ─────────────────────────────────────────────────────────────────────────

function StatStripCard({ issue }: { issue: TriageIssue }) {
  const risk = deriveAuditRisk(issue);
  const riskColor =
    risk >= 25 ? "text-red-600" : risk >= 12 ? "text-amber-600" : "text-emerald-600";
  const riskLabel = auditRiskBand(risk);
  // Risk is only a meaningful signal for compliance/return items — same gate
  // as the queue badge. Messages, signatures, scheduling, etc. show "—".
  const showRisk = hasAuditRisk(issue);
  // Qualitative drivers (no point math — that read as a developer scorecard).
  // Surfaced on hover so the rail stays dedicated to Evidence / Timeline /
  // Sources rather than a permanent breakdown.
  const factors = showRisk ? deriveAuditRiskFactors(issue) : [];

  // The audit-risk cell, shared between the hover-trigger and the plain
  // (non-applicable) render so the strip layout is identical either way.
  const auditCell = (
    <div className={cn("flex flex-col items-center px-1.5 py-2.5", showRisk && "cursor-default")}>
      <dt className="text-[10.5px] text-foreground/55">Audit risk</dt>
      <dd className="mt-1 flex h-[22px] items-center">
        {showRisk ? (
          <span className={cn("text-[14px] font-semibold tabular-nums leading-none", riskColor)}>
            {risk}%
          </span>
        ) : (
          <span className="text-[13.5px] font-medium leading-none text-foreground/40">—</span>
        )}
      </dd>
      <div
        className={cn(
          "mt-1 whitespace-nowrap text-[10.5px] leading-tight",
          showRisk
            ? cn(riskColor, "underline decoration-dotted decoration-current/40 underline-offset-2")
            : "text-foreground/40"
        )}
      >
        {showRisk ? riskLabel : "Not applicable"}
      </div>
    </div>
  );

  return (
    <dl
      className="grid shrink-0 overflow-hidden rounded-lg border bg-card"
      style={{ gridTemplateColumns: "1fr 1px 1fr 1px 1fr" }}
    >
      {/* Audit risk — band + % glanceable; the *reasoning* lives in a hover
          card (qualitative drivers, no arithmetic) so it costs no rail space. */}
      {showRisk ? (
        <HoverCard openDelay={120} closeDelay={80}>
          <HoverCardTrigger asChild>{auditCell}</HoverCardTrigger>
          <HoverCardContent side="bottom" align="start" className="w-64">
            <div className={cn("text-[12.5px] font-semibold", riskColor)}>
              {riskLabel} audit risk
            </div>
            <p className="mt-2 text-[10.5px] font-medium text-foreground/50">Why Petal flagged this</p>
            <ul className="mt-1.5 space-y-1.5">
              {factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground/85">
                  <span
                    aria-hidden="true"
                    className={cn("mt-[5px] size-1.5 shrink-0 rounded-full", f.recent ? "bg-amber-500" : "bg-foreground/25")}
                  />
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
          </HoverCardContent>
        </HoverCard>
      ) : (
        auditCell
      )}
      <div className="my-2.5 bg-border/60" aria-hidden="true" />
      {/* Confidence — hover surfaces the corroborating sources inline, since
          the strip is pinned while the full Sources list sits in the scrolling
          panel below. Same "explain on demand" pattern as audit risk. */}
      <HoverCard openDelay={120} closeDelay={80}>
        <HoverCardTrigger asChild>
          <div className="flex cursor-default flex-col items-center px-1.5 py-2.5">
            <dt className="text-[10.5px] text-foreground/55">Confidence</dt>
            <dd className="mt-1 flex h-[22px] items-center text-[13.5px] font-semibold leading-none text-foreground/80">
              {issue.confidence}
            </dd>
            <div className="mt-1 whitespace-nowrap text-[10.5px] leading-tight text-foreground/65 underline decoration-dotted decoration-foreground/25 underline-offset-2">
              {issue.sources.length} sources
            </div>
          </div>
        </HoverCardTrigger>
        {/* alignOffset pulls this card left by one grid column (the strip is
            three equal columns) so it opens at the strip's left edge — lined
            up with the audit-risk card instead of under the middle column. */}
        <HoverCardContent side="bottom" align="start" alignOffset={-79} className="w-64">
          <div className="text-[12.5px] font-semibold text-foreground">{issue.confidence} confidence</div>
          <p className="mt-2 text-[10.5px] font-medium text-foreground/50">Corroborated by</p>
          <ul className="mt-1.5 space-y-1.5">
            {issue.sources.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-snug text-foreground/85">
                <span aria-hidden="true" className="mt-[5px] size-1.5 shrink-0 rounded-full bg-foreground/25" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </HoverCardContent>
      </HoverCard>
      <div className="my-2.5 bg-border/60" aria-hidden="true" />
      <div className="flex flex-col items-center px-1.5 py-2.5">
        <dt className="text-[10.5px] text-foreground/55">Est. time</dt>
        <dd className="mt-1 flex h-[22px] items-center text-[13.5px] font-semibold tabular-nums leading-none text-foreground/80">
          {issue.estimatedMin < 60
            ? `${issue.estimatedMin}m`
            : `${Math.floor(issue.estimatedMin / 60)}h ${issue.estimatedMin % 60}m`}
        </dd>
        <div className="mt-1 whitespace-nowrap text-[10.5px] leading-tight text-foreground/65">
          to clear
        </div>
      </div>
    </dl>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <PetalMark className="size-8 text-foreground/40" />
      <div className="font-display text-2xl tracking-tight">Inbox zero.</div>
      <div className="text-[13px] text-muted-foreground">
        Take a breath. Petal will surface the next thing when it comes in.
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function filingStatusLabel(status: string): string {
  switch (status) {
    case "single":
      return "Single";
    case "mfj":
      return "Joint return";
    case "mfs":
      return "MFS";
    case "hoh":
      return "Head of household";
    case "qw":
      return "Qualifying widow(er)";
    default:
      return status;
  }
}

function returnTypeLabel(client: { type?: string; businessName?: string }): string {
  if (client.type === "business") {
    return client.businessName ? `${client.businessName} return` : "Business return";
  }
  return "Individual return";
}
