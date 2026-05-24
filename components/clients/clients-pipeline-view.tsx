"use client";

import { useMemo, useState, useSyncExternalStore, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Client, type ReturnStage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { DualScrollContainer } from "@/components/ui/dual-scroll-container";
import { ClientCard } from "@/components/ui/client-card";
import { PendingClientCard } from "@/components/clients/pending-client-card";
import { getUnreadCountForClient } from "@/lib/comms-mock-data";
import {
  setClientStage,
  getAllStageOverrides,
  subscribePipelineStages,
} from "@/lib/pipeline-stage-store";
import { sortClients, type SortMode, type Density } from "@/lib/pipeline-smart-sort";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Rows3, LayoutGrid } from "lucide-react";

type PipelineStageKey = ReturnStage | "pending";

const pipelineStages: {
  key: PipelineStageKey;
  label: string;
  dot: string;
}[] = [
  { key: "pending", label: "Pending Review", dot: "bg-rose-400" },
  { key: "new_intake", label: "New Intake", dot: "bg-sky-400" },
  { key: "collecting_docs", label: "Collecting Docs", dot: "bg-amber-500" },
  { key: "in_preparation", label: "In Preparation", dot: "bg-blue-500" },
  { key: "client_review", label: "Client Review", dot: "bg-purple-500" },
  { key: "pay_and_sign", label: "Pay & Sign", dot: "bg-orange-500" },
  { key: "filed", label: "Filed", dot: "bg-emerald-500" },
  { key: "extended", label: "Extended (Oct 15)", dot: "bg-orange-500" },
];

const SORT_LABELS: Record<SortMode, string> = {
  smart: "Smart",
  stale: "Stale",
  recent: "Recent",
  name: "Name",
};

// Stable empty snapshot for SSR
const EMPTY_OVERRIDES: Record<string, ReturnStage> = {};

interface ClientsPipelineViewProps {
  clients: Client[];
  acceptedIds: string[];
  declinedIds?: string[];
  assignedTiers?: Record<string, string>;
  onAssignTier?: (clientId: string, tier: string) => void;
  onAccept?: (clientId: string) => void;
  onDecline?: (clientId: string) => void;
  onOpenDetail: (client: Client) => void;
  filterStage?: string;
}

export function ClientsPipelineView({
  clients,
  acceptedIds,
  declinedIds = [],
  assignedTiers = {},
  onAssignTier,
  onAccept,
  onDecline,
  onOpenDetail,
  filterStage = "all",
}: ClientsPipelineViewProps) {
  // Subscribe to stage overrides so cards re-flow into the right column after drag / AI moves
  const overrides = useSyncExternalStore<Record<string, ReturnStage>>(
    subscribePipelineStages,
    getAllStageOverrides,
    () => EMPTY_OVERRIDES
  );

  const effectiveStage = useCallback(
    (c: Client): ReturnStage => overrides[c.id] ?? c.returnStage,
    [overrides]
  );

  const [sortMode, setSortMode] = useState<SortMode>("smart");
  const [density, setDensity] = useState<Density>("comfortable");
  const [highlightedCol, setHighlightedCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);

  // Group clients by stage (using EFFECTIVE stage from store) then sort each column
  const columns = useMemo(() => {
    const allCols = pipelineStages.map(stage => ({
      ...stage,
      clients: clients.filter(c => {
        const isPending = c.clientStatus === "pending" && !acceptedIds.includes(c.id);
        if (stage.key === "pending") return isPending && !declinedIds.includes(c.id);
        if (isPending) return false;

        const stg = effectiveStage(c);
        if (stage.key === "in_preparation") {
          return stg === "in_preparation" || stg === "ready_to_prep";
        }
        return stg === stage.key;
      }),
    }));

    // Apply sort to each column
    allCols.forEach(col => {
      col.clients = sortClients(col.clients, sortMode, col.key as ReturnStage | "pending");
    });

    if (filterStage && filterStage !== "all") {
      return allCols.filter(col => col.key === filterStage);
    }
    return allCols;
  }, [clients, acceptedIds, declinedIds, filterStage, effectiveStage, sortMode]);

  // ─── Drag handlers ───
  const handleDragOver = (e: React.DragEvent, colKey: PipelineStageKey) => {
    if (colKey === "pending") return; // pending column doesn't accept drops
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingOver !== colKey) setDraggingOver(colKey);
  };

  const handleDragLeave = (colKey: PipelineStageKey) => {
    if (draggingOver === colKey) setDraggingOver(null);
  };

  const handleDrop = (e: React.DragEvent, colKey: PipelineStageKey) => {
    e.preventDefault();
    setDraggingOver(null);
    setDraggingId(null);
    if (colKey === "pending") return;
    const clientId = e.dataTransfer.getData("text/plain");
    if (!clientId) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const fromStage = effectiveStage(client);
    if (fromStage === colKey) return; // no-op same column

    setClientStage(clientId, colKey as ReturnStage, "manual", client.returnStage);
    // Light feedback — no Undo toast on manual moves (drag implies intent)
  };

  return (
    <>
      {/* ── Toolbar — Sort + Density ── */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                Sort: <span className="font-medium">{SORT_LABELS[sortMode]}</span>
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuRadioGroup value={sortMode} onValueChange={v => setSortMode(v as SortMode)}>
                <DropdownMenuRadioItem value="smart">
                  Smart
                  <span className="ml-auto text-[10px] text-muted-foreground">stage-aware</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="stale">
                  Stale
                  <span className="ml-auto text-[10px] text-muted-foreground">oldest first</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="recent">
                  Recent
                  <span className="ml-auto text-[10px] text-muted-foreground">newest first</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name">
                  Name
                  <span className="ml-auto text-[10px] text-muted-foreground">A → Z</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Density toggle — segmented icon control */}
          <div className="flex items-center rounded-md border bg-card p-0.5">
            <button
              onClick={() => setDensity("comfortable")}
              title="Comfortable"
              className={cn(
                "flex size-7 items-center justify-center rounded transition-colors",
                density === "comfortable" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              onClick={() => setDensity("compact")}
              title="Compact"
              className={cn(
                "flex size-7 items-center justify-center rounded transition-colors",
                density === "compact" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Rows3 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <DualScrollContainer>
        <div className="flex gap-3 min-w-max pb-4">
          {columns.map(col => {
            const isDimmed = highlightedCol !== null && highlightedCol !== col.key;
            const isDropTarget = draggingOver === col.key;
            return (
              <div
                key={col.key}
                className={cn(
                  "w-[300px] shrink-0 transition-all duration-300",
                  isDimmed && "opacity-30 blur-[1px]"
                )}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={() => handleDragLeave(col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                {/* Column header — clickable to highlight */}
                <button
                  onClick={() => setHighlightedCol(highlightedCol === col.key ? null : col.key)}
                  className={cn(
                    "mb-3 flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-all cursor-pointer border border-border/30",
                    highlightedCol === col.key && "border-border/60 shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("size-1.5 rounded-full", col.dot)} />
                    <span className="text-[13px] font-medium text-foreground">{col.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {col.clients.length}
                  </Badge>
                </button>

                {/* Column container — dashed wrap visually groups the cards.
                    Highlights when drag is hovering this column. */}
                <div
                  className={cn(
                    "rounded-xl border border-dashed border-border/50 bg-muted/10 p-2.5 min-h-[280px] transition-colors",
                    isDropTarget && "border-foreground/40 bg-muted/40"
                  )}
                >
                  <div className={cn(density === "comfortable" ? "space-y-3 [zoom:0.85]" : "space-y-1.5")}>
                    {col.key === "pending" ? (
                      <AnimatePresence mode="popLayout">
                        {col.clients.map(client => (
                          <PendingClientCard
                            key={client.id}
                            client={client}
                            assignedTier={assignedTiers[client.id]}
                            onAssignTier={tier => onAssignTier?.(client.id, tier)}
                            onAccept={() => onAccept?.(client.id)}
                            onDecline={() => onDecline?.(client.id)}
                            onOpen={() => onOpenDetail(client)}
                          />
                        ))}
                      </AnimatePresence>
                    ) : (
                      col.clients.map(client => (
                        <div
                          key={client.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", client.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggingId(client.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDraggingOver(null);
                          }}
                          className={cn(
                            "cursor-grab active:cursor-grabbing transition-opacity",
                            draggingId === client.id && "opacity-40"
                          )}
                        >
                          <ClientCard
                            client={client}
                            onOpenDetail={onOpenDetail}
                            staticSize
                            density={density}
                            unreadCount={getUnreadCountForClient(client.id)}
                          />
                        </div>
                      ))
                    )}

                    {col.clients.length === 0 && (
                      <div className="flex h-[220px] items-center justify-center">
                        <p className="text-[10px] text-muted-foreground">No clients</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DualScrollContainer>
    </>
  );
}
