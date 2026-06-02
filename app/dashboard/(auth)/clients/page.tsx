"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { ViewModeToggle, type ViewMode } from "@/components/clients/view-mode-toggle";
import { ClientsFilterPills, type BucketFilter, PipelineFilterPills, type PipelineFilter } from "@/components/clients/clients-filter-pills";
import { ClientsTableView, type SortKey, type SortDir } from "@/components/clients/clients-table-view";
import { ClientsPipelineView } from "@/components/clients/clients-pipeline-view";
import type { SortMode } from "@/lib/pipeline-smart-sort";
import { DualScrollContainer } from "@/components/ui/dual-scroll-container";
import { SearchIcon, ArrowUpDown, Plus, LayoutGrid, Rows3 } from "lucide-react";
import Link from "next/link";
import type { Density } from "@/lib/pipeline-smart-sort";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { clients as rawClients, stageLabels, serviceTierOptions, pendingIntakeContext, type Client, type ReturnStage } from "@/lib/mock-data";
import { applyStageOverrides, setStageOverride as setStageOverrideGlobal } from "@/lib/stage-overrides";
import {
  applyAssignmentOverrides,
  getAllAssignmentOverrides,
  subscribeAssignmentOverrides,
} from "@/lib/client-assignment-store";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/toast-notification";
import { useSession } from "@/lib/session-context";
import { UserCheck } from "lucide-react";
import { useSyncExternalStore } from "react";

const VIEW_MODE_KEY = "petal-clients-view-mode";


const sortOptions: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "urgency", label: "Urgency" },
  { key: "stage", label: "Stage" },
  { key: "docs", label: "Docs completion" },
  { key: "lastActive", label: "Last active" },
  { key: "fee", label: "Fee amount" },
];

// Empty fallback for SSR — keeps server/client render parity.
const EMPTY_ASSIGNMENT_OVERRIDES: Record<string, string | null> = {};

export default function ClientsPage() {
  // Subscribe to assignment-override changes so reassigning from a client
  // popup re-renders this page (and the "Assigned to me" toggle's count).
  // We only read the snapshot to force the subscription; the actual override
  // application happens in applyAssignmentOverrides below.
  useSyncExternalStore(
    subscribeAssignmentOverrides,
    getAllAssignmentOverrides,
    () => EMPTY_ASSIGNMENT_OVERRIDES
  );
  const clients = applyAssignmentOverrides(
    applyStageOverrides(rawClients) as Client[]
  );
  const { user } = useSession();
  const [search, setSearch] = useState("");
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const { showToast } = useToast();
  const [declinedIds, setDeclinedIds] = useState<string[]>([]);
  const [assignedTiers, setAssignedTiers] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("pipeline");
  const [activeFilter, setActiveFilter] = useState<BucketFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pipelineSortMode, setPipelineSortMode] = useState<SortMode>("smart");
  const [pipelineDensity, setPipelineDensity] = useState<Density>("comfortable");
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("all");
  const [highlightedColumn, setHighlightedColumn] = useState<string | null>(null);
  // "Assigned to me" — narrows the visible roster to the active user's
  // book of business. Off by default so owners see everything when they
  // first land on the page. Petal (ai) is excluded — she's never assigned.
  const [assignedOnly, setAssignedOnly] = useState(false);

  // Auto-reset assignedOnly when switching to the AI persona — Petal has
  // no book of business, so the toggle would zero out the list.
  useEffect(() => {
    if (user.role === "ai" && assignedOnly) setAssignedOnly(false);
  }, [user.role, assignedOnly]);

  // Load persisted view mode on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      if (stored === "table" || stored === "pipeline") {
        setViewMode(stored);
      } else if (stored === "cards") {
        // Migrate legacy "cards" preference to pipeline (Cards view has been merged into Pipeline)
        setViewMode("pipeline");
        try { localStorage.setItem(VIEW_MODE_KEY, "pipeline"); } catch {}
      }
    } catch {}
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "pipeline") {
      setActiveFilter("all");
    } else {
      setPipelineFilter("all");
    }
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {}
  };

  const handleSortChange = (key: SortKey, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
  };


  // Search-filtered clients (before bucket filter).
  // Also applies the "Assigned to me" toggle so bucket/pipeline counts
  // shrink with the visible roster — counts always reflect what's on screen.
  const searchFiltered = clients.filter((c) => {
    if (search && !c.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    if (declinedIds.includes(c.id)) return false;
    if (assignedOnly && c.assignedTo !== user.id) return false;
    return true;
  });

  // Count of clients assigned to the current user — drives the toggle label
  // ("Assigned to me · 7") and lets us hide the toggle for the AI persona.
  const myCount = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.assignedTo === user.id &&
          !declinedIds.includes(c.id)
      ).length,
    [clients, user.id, declinedIds]
  );

  // Map clients to workflow buckets matching Overview terminology
  const getBucket = (c: Client): BucketFilter => {
    if (c.clientStatus === "pending" && !acceptedIds.includes(c.id)) return "pending";
    const stage = c.returnStage;
    if (stage === "new_intake" || stage === "ready_to_prep" || stage === "pay_and_sign") return "need_you";
    if (stage === "collecting_docs" || stage === "client_review") return "waiting";
    if (stage === "in_preparation") return "in_progress";
    if (stage === "filed") return "done";
    return "need_you";
  };

  // Compute bucket counts from search-filtered clients
  const bucketCounts = useMemo(() => {
    const counts: Record<BucketFilter, number> = { all: 0, pending: 0, need_you: 0, waiting: 0, in_progress: 0, done: 0 };
    for (const c of searchFiltered) {
      const bucket = getBucket(c);
      counts[bucket]++;
    }
    counts.all = searchFiltered.length;
    return counts;
  }, [searchFiltered, acceptedIds]);

  // Compute pipeline stage counts for pipeline filter pills
  const pipelineCounts = useMemo(() => {
    const counts: Record<PipelineFilter, number> = { all: 0, pending: 0, new_intake: 0, collecting_docs: 0, in_preparation: 0, client_review: 0, pay_and_sign: 0, filed: 0 };
    for (const c of searchFiltered) {
      const isPending = c.clientStatus === "pending" && !acceptedIds.includes(c.id);
      if (isPending) {
        counts.pending++;
      } else {
        const stage = c.returnStage === "ready_to_prep" ? "in_preparation" : c.returnStage;
        if (stage in counts) counts[stage as PipelineFilter]++;
      }
    }
    counts.all = searchFiltered.length;
    return counts;
  }, [searchFiltered, acceptedIds]);

  // Apply bucket filter on top of search filter
  const filtered = useMemo(() => {
    if (activeFilter === "all") return searchFiltered;
    return searchFiltered.filter((c) => getBucket(c) === activeFilter);
  }, [searchFiltered, activeFilter, acceptedIds]);

  // Table view now uses the same stage-based pills as pipeline, so filter the
  // table roster by pipeline stage (same mapping the pipeline counts use:
  // ready_to_prep folds into in_preparation; pending is its own bucket).
  const tableFiltered = useMemo(() => {
    if (pipelineFilter === "all") return searchFiltered;
    return searchFiltered.filter((c) => {
      const isPending = c.clientStatus === "pending" && !acceptedIds.includes(c.id);
      if (pipelineFilter === "pending") return isPending;
      if (isPending) return false;
      const stage = c.returnStage === "ready_to_prep" ? "in_preparation" : c.returnStage;
      return stage === pipelineFilter;
    });
  }, [searchFiltered, pipelineFilter, acceptedIds]);

  // Subtitle counts
  const totalCount = clients.filter(c => c.clientStatus !== "declined" && !declinedIds.includes(c.id)).length;
  const pendingCount = clients.filter(c => c.clientStatus === "pending" && !acceptedIds.includes(c.id) && !declinedIds.includes(c.id)).length;
  const activeCount = totalCount - pendingCount;

  const columns = [
    { key: "pending", label: "Pending", dot: "bg-zinc-400", bg: "bg-zinc-50 dark:bg-zinc-900/20", headerBg: "bg-zinc-50/60" },
    { key: "need_you", label: "Need You", dot: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/20", headerBg: "bg-red-50/50" },
    { key: "waiting", label: "Waiting", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", headerBg: "bg-amber-50/50" },
    { key: "in_progress", label: "In Progress", dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", headerBg: "bg-blue-50/50" },
    { key: "done", label: "Done", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", headerBg: "bg-emerald-50/50" },
  ];

  const columnData = columns.map(col => ({
    ...col,
    clients: filtered.filter(c => getBucket(c) === col.key),
  })).filter(col => col.clients.length > 0);

  const formatCallTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " at " + timeStr;
  };
  const isCallPast = (dateStr: string) => new Date(dateStr) < new Date();

  const handleAccept = (id: string) => {
    setAcceptedIds(prev => [...prev, id]);
    const client = clients.find(c => c.id === id);
    if (client) {
      showToast("success", `${client.fullName} accepted`, `Moved to ${assignedTiers[id] || "Active Clients"}`);
    }
  };

  const handleDecline = (id: string) => {
    setDeclinedIds(prev => [...prev, id]);
  };

  const currentSortLabel = sortOptions.find(s => s.key === sortKey)?.label || "Name";

  const seasonYear = new Date().getFullYear() + 1;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Clients</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Tax Season {seasonYear}
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            {totalCount} {totalCount === 1 ? "client" : "clients"}
            {pendingCount > 0 && (
              <>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <span className="text-foreground/80">{pendingCount} need review</span>
              </>
            )}
          </p>
        </div>
        <Button
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/90"
          onClick={() => showToast("success", "Add client", "Client creation flow coming soon")}
        >
          <Plus className="size-3.5" /> Add client
        </Button>
      </div>

      {/* Search + View Toggle + Sort (table only) */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
          {/* Sort dropdown — different options per view mode, same position */}
          {viewMode === "table" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <ArrowUpDown className="size-3" />
                  <span className="text-muted-foreground">Sort:</span>
                  <span className="font-medium">{currentSortLabel}</span>
                  <span className="text-muted-foreground">{sortDir === "asc" ? "↑" : "↓"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {sortOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => {
                      if (sortKey === opt.key) {
                        setSortDir(d => d === "asc" ? "desc" : "asc");
                      } else {
                        setSortKey(opt.key);
                        setSortDir("asc");
                      }
                    }}
                    className="text-xs"
                  >
                    <span className="flex-1">{opt.label}</span>
                    {sortKey === opt.key && (
                      <span className="text-muted-foreground text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <span className="text-muted-foreground">Sort:</span>
                  <span className="font-medium capitalize">{pipelineSortMode}</span>
                  <span className="text-muted-foreground">▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {(["smart", "stale", "recent", "name"] as SortMode[]).map((opt) => (
                  <DropdownMenuItem
                    key={opt}
                    onClick={() => setPipelineSortMode(opt)}
                    className="text-xs capitalize"
                  >
                    <span className="flex-1">{opt}</span>
                    {pipelineSortMode === opt && (
                      <span className="text-muted-foreground text-[10px]">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stage bar — stage-based filter pills (shared by table + pipeline) */}
      <div className="flex min-w-0 items-center gap-2">
        <PipelineFilterPills
          value={pipelineFilter}
          onChange={setPipelineFilter}
          counts={pipelineCounts}
        />
      </div>

      {/* Density toggle + Assigned-to-me — left-aligned, below the stage bar */}
      {(viewMode === "pipeline" || (user.role !== "ai" && myCount > 0)) && (
        <div className="flex items-center gap-2">
          {/* Card density — pipeline only (compact vs comfortable cards) */}
          {viewMode === "pipeline" && (
            <div className="flex shrink-0 items-center rounded-md border bg-card p-0.5">
              <button
                onClick={() => setPipelineDensity("comfortable")}
                title="Comfortable"
                className={cn(
                  "flex size-7 items-center justify-center rounded transition-colors",
                  pipelineDensity === "comfortable" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setPipelineDensity("compact")}
                title="Compact"
                className={cn(
                  "flex size-7 items-center justify-center rounded transition-colors",
                  pipelineDensity === "compact" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Rows3 className="size-3.5" />
              </button>
            </div>
          )}
          {/* Assigned-to-me toggle — hidden for the AI persona (Petal has no
              direct assignments) and for users with zero assigned clients. */}
          {user.role !== "ai" && myCount > 0 && (
            <button
              type="button"
              onClick={() => setAssignedOnly((v) => !v)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
                assignedOnly
                  ? "border-foreground/15 bg-foreground/[0.06] text-foreground"
                  : "border-border/60 bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              title={`Show only clients assigned to ${user.shortName}`}
            >
              <UserCheck className="size-3.5" />
              <span>Assigned to me</span>
              <span className="tabular-nums text-foreground/55">{myCount}</span>
            </button>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <ClientsTableView
          clients={tableFiltered}
          acceptedIds={acceptedIds}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onOpenDetail={setDetailClient}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortChange={handleSortChange}
        />
      )}

      {/* Pipeline View */}
      {viewMode === "pipeline" && (
        <ClientsPipelineView
          clients={searchFiltered}
          acceptedIds={acceptedIds}
          declinedIds={declinedIds}
          assignedTiers={assignedTiers}
          onAssignTier={(id, tier) => setAssignedTiers(prev => ({ ...prev, [id]: tier }))}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onOpenDetail={setDetailClient}
          filterStage={pipelineFilter}
          sortMode={pipelineSortMode}
          density={pipelineDensity}
        />
      )}

      <ClientDetailDialog
        client={detailClient}
        open={!!detailClient}
        onOpenChange={(open) => !open && setDetailClient(null)}
        onAccept={(id, tier) => {
          setAcceptedIds(prev => [...prev, id]);
          setAssignedTiers(prev => ({ ...prev, [id]: tier }));
          setStageOverrideGlobal(id, "new_intake");
          const c = clients.find(cl => cl.id === id);
          if (c) showToast("success", `${c.fullName} accepted`, `Moved to ${tier || "Active Clients"}`);
        }}
        onDecline={(id) => {
          setDeclinedIds(prev => [...prev, id]);
        }}
      />
    </div>
  );
}
