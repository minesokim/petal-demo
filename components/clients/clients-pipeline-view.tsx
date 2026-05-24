"use client";

import { useMemo, useState, useSyncExternalStore, useCallback } from "react";
import { AnimatePresence } from "motion/react";
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

type PipelineStageKey = ReturnStage | "pending";

const pipelineStages: {
  key: PipelineStageKey;
  label: string;
  subtitle: string;
  dot: string;
}[] = [
  { key: "pending",         label: "Pending Review",  subtitle: "Partner review needed",      dot: "bg-rose-400"    },
  { key: "new_intake",      label: "New Intake",      subtitle: "Recently added clients",     dot: "bg-sky-400"     },
  { key: "collecting_docs", label: "Collecting Docs", subtitle: "Waiting on client documents",dot: "bg-amber-500"   },
  { key: "in_preparation",  label: "In Preparation",  subtitle: "Preparing returns",          dot: "bg-blue-500"    },
  { key: "client_review",   label: "Client Review",   subtitle: "Awaiting client signoff",    dot: "bg-purple-500"  },
  { key: "pay_and_sign",    label: "Pay & Sign",      subtitle: "Signatures pending",         dot: "bg-orange-500"  },
  { key: "filed",           label: "Filed",           subtitle: "Returns complete",           dot: "bg-emerald-500" },
  { key: "extended",        label: "Extended",        subtitle: "Oct 15 deadline",            dot: "bg-orange-500"  },
];

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
  /** Sort mode — lifted to the page-level toolbar to match the reference layout. */
  sortMode?: SortMode;
  /** Density — lifted to the page-level filter row alongside the filter pills. */
  density?: Density;
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
  sortMode = "smart",
  density = "comfortable",
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
      <DualScrollContainer>
        <div className="flex gap-3 min-w-max pb-4">
          {columns.map(col => {
            const isDimmed = highlightedCol !== null && highlightedCol !== col.key;
            const isDropTarget = draggingOver === col.key;
            return (
              <div
                key={col.key}
                className={cn(
                  // Whole column wrapped in a soft tinted card — header + cards live inside one container.
                  // Border + tinted bg both visible by default so the column edges read clearly against the page.
                  "flex w-[300px] shrink-0 flex-col rounded-xl border border-border/60 bg-muted/50 p-3 transition-all duration-300",
                  isDimmed && "opacity-30 blur-[1px]",
                  isDropTarget && "border-foreground/30 bg-muted/80",
                  highlightedCol === col.key && "border-foreground/20"
                )}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={() => handleDragLeave(col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                {/* Column header — editorial: dot + title + count on top, subtitle on second line. Clickable to highlight. */}
                <button
                  onClick={() => setHighlightedCol(highlightedCol === col.key ? null : col.key)}
                  className="mb-3 flex w-full items-start justify-between gap-2 px-1 text-left transition-opacity hover:opacity-80"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-1.5 shrink-0 rounded-full", col.dot)} />
                      <span className="text-[14px] font-semibold text-foreground">{col.label}</span>
                    </div>
                    <div className="ml-3.5 mt-0.5 text-[11.5px] text-muted-foreground">
                      {col.subtitle}
                    </div>
                  </div>
                  <span className="inline-flex h-[22px] min-w-[32px] shrink-0 items-center justify-center rounded-full bg-background px-2.5 text-[11px] font-medium tabular-nums text-foreground/70 ring-1 ring-border/60">
                    {col.clients.length}
                  </span>
                </button>

                {/* Cards container — drops directly into the wrapped column (no nested bg) */}
                <div className="min-h-[200px] flex-1">
                  <div className={cn(density === "comfortable" ? "space-y-3" : "space-y-1.5")}>
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
