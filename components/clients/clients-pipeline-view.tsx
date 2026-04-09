"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Check, Calendar } from "lucide-react";
import { type Client, type ReturnStage, stageLabels, pendingIntakeContext } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { InsightDot } from "@/components/insights";
import { DualScrollContainer } from "@/components/ui/dual-scroll-container";
import { getOneLineInsightForClient } from "@/lib/insights-mock-data";

function formatCallTimeShort(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today ${timeStr}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function isCallPast(dateStr: string) { return new Date(dateStr) < new Date(); }

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type PipelineStageKey = ReturnStage | "pending";

const pipelineStages: {
  key: PipelineStageKey;
  label: string;
  dot: string;
  headerBg: string;
}[] = [
  {
    key: "pending",
    label: "Pending Review",
    dot: "bg-rose-400",
    headerBg: "bg-rose-50 dark:bg-rose-950/20",
  },
  {
    key: "new_intake",
    label: "New Intake",
    dot: "bg-zinc-400",
    headerBg: "bg-zinc-100 dark:bg-zinc-900/30",
  },
  {
    key: "collecting_docs",
    label: "Collecting Docs",
    dot: "bg-amber-500",
    headerBg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    key: "in_preparation",
    label: "In Preparation",
    dot: "bg-blue-500",
    headerBg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    key: "client_review",
    label: "Client Review",
    dot: "bg-purple-500",
    headerBg: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    key: "pay_and_sign",
    label: "Pay & Sign",
    dot: "bg-orange-500",
    headerBg: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    key: "filed",
    label: "Filed",
    dot: "bg-emerald-500",
    headerBg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
];

interface ClientsPipelineViewProps {
  clients: Client[];
  acceptedIds: string[];
  onOpenDetail: (client: Client) => void;
}

export function ClientsPipelineView({
  clients,
  acceptedIds,
  onOpenDetail,
}: ClientsPipelineViewProps) {
  // Group clients by pipeline stage.
  // Pending clients get their own column at the start.
  // ready_to_prep clients are folded into in_preparation for a cleaner pipeline.
  const columns = useMemo(() => {
    return pipelineStages.map((stage) => ({
      ...stage,
      clients: clients.filter((c) => {
        const isPending =
          c.clientStatus === "pending" && !acceptedIds.includes(c.id);

        if (stage.key === "pending") {
          return isPending;
        }
        // Non-pending clients only
        if (isPending) return false;

        if (stage.key === "in_preparation") {
          return (
            c.returnStage === "in_preparation" ||
            c.returnStage === "ready_to_prep"
          );
        }
        return c.returnStage === stage.key;
      }),
    }));
  }, [clients, acceptedIds]);

  return (
    <DualScrollContainer>
    <div className="flex gap-3 min-w-max pb-4">
      {columns.map((col) => (
        <div key={col.key} className="w-[240px] shrink-0">
          {/* Column header */}
          <div
            className={cn(
              "mb-3 flex items-center justify-between rounded-lg px-3 py-2",
              col.headerBg
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", col.dot)} />
              <span className="text-sm font-semibold">{col.label}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {col.clients.length}
            </Badge>
          </div>

          {/* Column cards */}
          <div className="space-y-2">
            {col.clients.map((client) => {
              const docPercent = client.documentsRequired
                ? Math.round(
                    (client.documentsSubmitted / client.documentsRequired) *
                      100
                  )
                : 0;
              const isPendingClient = client.clientStatus === "pending" && !acceptedIds.includes(client.id);
              const clientInsight = getOneLineInsightForClient(client.id);

              return (
                <div
                  key={client.id}
                  className="group/card cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
                  onClick={() => onOpenDetail(client)}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage
                        src={client.avatar}
                        alt={client.fullName}
                      />
                      <AvatarFallback className="text-[9px]">
                        {getInitials(client.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate leading-tight">
                        {client.fullName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate leading-tight">
                        {client.businessName || client.serviceTier}
                      </p>
                    </div>
                    {isPendingClient && (
                      <Badge variant="outline" className="text-[9px] shrink-0">New</Badge>
                    )}
                    {clientInsight && (
                      <InsightDot
                        severity={clientInsight.severity}
                        title={clientInsight.title}
                        className="shrink-0"
                      />
                    )}
                    {!clientInsight && (client.urgency === "urgent" ||
                      client.urgency === "high") && (
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          client.urgency === "urgent"
                            ? "bg-red-500"
                            : "bg-amber-500"
                        )}
                      />
                    )}
                  </div>

                  {isPendingClient ? (
                    /* Pending client: show intake context */
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const ctx = pendingIntakeContext[client.id];
                        return ctx ? (
                          <p className="text-[10px] text-muted-foreground">
                            Requested: <span className="font-medium text-foreground/80">{ctx.service}</span>
                          </p>
                        ) : null;
                      })()}
                      <div className="flex items-center gap-1 text-[10px]">
                        <Check className="size-2.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Deposit paid</span>
                      </div>
                      {client.scheduledCall && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <Calendar className={cn("size-2.5", isCallPast(client.scheduledCall) ? "text-red-500" : "text-blue-500")} />
                          <span className={cn(isCallPast(client.scheduledCall) ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground")}>
                            {formatCallTimeShort(client.scheduledCall)}
                            {isCallPast(client.scheduledCall) && " · Missed"}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Active client: show doc progress + last active */
                    <>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-1 rounded-full transition-all",
                              docPercent >= 100 ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${Math.min(docPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono tabular-nums shrink-0">
                          {client.documentsSubmitted}/{client.documentsRequired}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          {formatLastActive(client.lastPortalLogin)}
                        </p>
                        <Link
                          href={`/dashboard/clients/${client.id}/overview`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground opacity-0 group-hover/card:opacity-100"
                        >
                          Open <ArrowUpRight className="size-2.5" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {col.clients.length === 0 && (
              <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-6 text-center">
                <p className="text-[10px] text-muted-foreground">
                  No clients
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
    </DualScrollContainer>
  );
}
