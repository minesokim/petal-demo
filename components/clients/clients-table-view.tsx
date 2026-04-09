"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, ChevronUp, ChevronDown, Building2, ArrowUpRight, Calendar } from "lucide-react";
import { type Client, stageLabels, pendingIntakeContext } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CompactInsightIndicator } from "@/components/insights";
import { getOneLineInsightForClient } from "@/lib/insights-mock-data";

function formatCallTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today ${timeStr}`;
  if (isYesterday) return `Yesterday ${timeStr}`;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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

export type SortKey = "name" | "stage" | "docs" | "lastActive" | "urgency" | "fee";
export type SortDir = "asc" | "desc";

const stageOrder: Record<string, number> = {
  new_intake: 0,
  collecting_docs: 1,
  ready_to_prep: 2,
  in_preparation: 3,
  client_review: 4,
  pay_and_sign: 5,
  filed: 6,
};

function getStageColor(stage: string) {
  switch (stage) {
    case "new_intake":
    case "ready_to_prep":
    case "pay_and_sign":
      return "bg-red-500";       // Need You
    case "collecting_docs":
    case "client_review":
      return "bg-amber-500";     // Waiting
    case "in_preparation":
      return "bg-blue-500";      // In Progress
    case "filed":
      return "bg-emerald-500";   // Done
    default:
      return "bg-zinc-400";
  }
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

interface ClientsTableViewProps {
  clients: Client[];
  acceptedIds: string[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onOpenDetail: (client: Client) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortChange: (key: SortKey, dir: SortDir) => void;
}

export function ClientsTableView({
  clients,
  acceptedIds,
  onAccept,
  onDecline,
  onOpenDetail,
  sortKey,
  sortDir,
  onSortChange,
}: ClientsTableViewProps) {
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      onSortChange(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  };

  // Separate pending from active, sort each group independently
  const { pendingClients, activeClients } = useMemo(() => {
    const pending: Client[] = [];
    const active: Client[] = [];
    for (const c of clients) {
      if (c.clientStatus === "pending" && !acceptedIds.includes(c.id)) {
        pending.push(c);
      } else {
        active.push(c);
      }
    }

    const sortFn = (a: Client, b: Client) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.fullName.localeCompare(b.fullName);
          break;
        case "stage":
          cmp =
            (stageOrder[a.returnStage] ?? 0) -
            (stageOrder[b.returnStage] ?? 0);
          break;
        case "docs": {
          const aP = a.documentsRequired
            ? a.documentsSubmitted / a.documentsRequired
            : 0;
          const bP = b.documentsRequired
            ? b.documentsSubmitted / b.documentsRequired
            : 0;
          cmp = aP - bP;
          break;
        }
        case "lastActive": {
          const aT = a.lastPortalLogin
            ? new Date(a.lastPortalLogin).getTime()
            : 0;
          const bT = b.lastPortalLogin
            ? new Date(b.lastPortalLogin).getTime()
            : 0;
          cmp = aT - bT;
          break;
        }
        case "urgency": {
          const urgencyOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
          cmp = (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2);
          break;
        }
        case "fee":
          cmp = a.feeAmount - b.feeAmount;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    };

    pending.sort(sortFn);
    active.sort(sortFn);
    return { pendingClients: pending, activeClients: active };
  }, [clients, acceptedIds, sortKey, sortDir]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column)
      return <ChevronUp className="size-3 opacity-0 group-hover:opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="size-3" />
    ) : (
      <ChevronDown className="size-3" />
    );
  };

  const headerClass =
    "group cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground transition-colors";

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th
                className={cn(headerClass, "px-4 py-3 text-left")}
                onClick={() => handleSort("name")}
              >
                <span className="inline-flex items-center gap-1">
                  Client <SortIcon column="name" />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Type / Tier
              </th>
              <th
                className={cn(headerClass, "px-4 py-3 text-left")}
                onClick={() => handleSort("stage")}
              >
                <span className="inline-flex items-center gap-1">
                  Stage <SortIcon column="stage" />
                </span>
              </th>
              <th
                className={cn(headerClass, "px-4 py-3 text-left")}
                onClick={() => handleSort("docs")}
              >
                <span className="inline-flex items-center gap-1">
                  Docs <SortIcon column="docs" />
                </span>
              </th>
              <th
                className={cn(headerClass, "px-4 py-3 text-left")}
                onClick={() => handleSort("lastActive")}
              >
                <span className="inline-flex items-center gap-1">
                  Last Active <SortIcon column="lastActive" />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                AI Insight
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Pending clients pinned to top */}
            {pendingClients.length > 0 && (
              <>
                <tr>
                  <td colSpan={7} className="bg-zinc-50 dark:bg-zinc-900/20 px-4 py-1.5 border-b">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-zinc-400" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pending Review</span>
                      <Badge variant="outline" className="text-[10px] ml-1">{pendingClients.length}</Badge>
                    </div>
                  </td>
                </tr>
                {pendingClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    isPending
                    onOpenDetail={onOpenDetail}
                    onAccept={onAccept}
                    onDecline={onDecline}
                  />
                ))}
                {activeClients.length > 0 && (
                  <tr>
                    <td colSpan={7} className="bg-muted/20 px-4 py-1.5 border-b">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Clients</span>
                    </td>
                  </tr>
                )}
              </>
            )}

            {/* Active clients */}
            {activeClients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                isPending={false}
                onOpenDetail={onOpenDetail}
              />
            ))}

            {pendingClients.length === 0 && activeClients.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No clients match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Extracted row component for reuse between pending and active sections
function ClientRow({
  client,
  isPending,
  onOpenDetail,
  onAccept,
  onDecline,
}: {
  client: Client;
  isPending: boolean;
  onOpenDetail: (client: Client) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}) {
  const docPercent = client.documentsRequired
    ? Math.round(
        (client.documentsSubmitted / client.documentsRequired) * 100
      )
    : 0;

  return (
    <tr
      className={cn(
        "group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40",
        isPending && "bg-zinc-50/50 dark:bg-zinc-900/10"
      )}
      onClick={() => onOpenDetail(client)}
    >
      {/* Urgency indicator + Client info */}
      <td className="relative px-4 py-3">
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-[2.5px] rounded-r opacity-60",
            isPending ? "bg-zinc-400" : getStageColor(client.returnStage)
          )}
        />
        <div className="flex items-center gap-3 pl-1">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={client.avatar} alt={client.fullName} />
            <AvatarFallback className="text-[10px]">
              {getInitials(client.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate font-display">
                {client.fullName}
              </span>
              {client.type === "business" && (
                <Building2 className="size-3 shrink-0 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {client.filingStatus.toUpperCase()}
              {client.businessName ? ` / ${client.businessName}` : ""}
            </p>
          </div>
        </div>
      </td>

      {isPending ? (
        <>
          {/* Service Requested */}
          <td className="px-4 py-3">
            {(() => {
              const ctx = pendingIntakeContext[client.id];
              return ctx ? (
                <div>
                  <div className="text-xs"><span className="text-muted-foreground">Requested:</span> <span className="font-medium">{ctx.service}</span></div>
                  <div className="text-[10px] text-muted-foreground">{ctx.filing} / {ctx.income.join(", ")}</div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {client.serviceTier} - ${client.feeAmount}
                </div>
              );
            })()}
          </td>

          {/* Deposit + Intake Status */}
          <td className="px-4 py-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[11px]">
                <Check className="size-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">$50 deposit</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Check className="size-3 text-emerald-500" />
                <span className="text-muted-foreground">Intake done</span>
              </div>
            </div>
          </td>

          {/* Scheduled Call */}
          <td className="px-4 py-3">
            {client.scheduledCall ? (
              <div className="flex items-center gap-1.5">
                <Calendar className={cn("size-3", isCallPast(client.scheduledCall) ? "text-red-500" : "text-blue-500")} />
                <span className={cn("text-xs", isCallPast(client.scheduledCall) ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground")}>
                  {formatCallTime(client.scheduledCall)}
                  {isCallPast(client.scheduledCall) && " · Missed"}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No call scheduled</span>
            )}
          </td>

          {/* AI Insight for pending */}
          <td className="px-4 py-3">
            {(() => {
              const insight = getOneLineInsightForClient(client.id);
              if (!insight) return <span className="text-xs text-muted-foreground/50">-</span>;
              return <CompactInsightIndicator title={insight.title} severity={insight.severity} />;
            })()}
          </td>
        </>
      ) : (
        <>
          {/* Type / Tier */}
          <td className="px-4 py-3">
            <div className="text-xs">
              <span className="capitalize">{client.type}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {client.serviceTier} - ${client.feeAmount}
            </div>
          </td>

          {/* Stage */}
          <td className="px-4 py-3">
            <Badge
              variant={
                client.returnStage === "filed"
                  ? "default"
                  : client.returnStage === "pay_and_sign"
                  ? "default"
                  : client.returnStage === "collecting_docs"
                  ? "secondary"
                  : "outline"
              }
              className="text-[10px]"
            >
              {stageLabels[client.returnStage]}
            </Badge>
          </td>

          {/* Docs */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 rounded-full bg-muted">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    docPercent >= 100 ? "bg-emerald-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(docPercent, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                {client.documentsSubmitted}/{client.documentsRequired}
              </span>
            </div>
          </td>

          {/* Last Active */}
          <td className="px-4 py-3">
            <span
              className={cn(
                "text-xs",
                !client.lastPortalLogin
                  ? "text-red-500"
                  : Math.floor(
                      (Date.now() -
                        new Date(client.lastPortalLogin).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) > 7
                  ? "text-amber-600"
                  : "text-muted-foreground"
              )}
            >
              {formatLastActive(client.lastPortalLogin)}
            </span>
          </td>

          {/* AI Insight */}
          <td className="px-4 py-3">
            {(() => {
              const insight = getOneLineInsightForClient(client.id);
              if (!insight) return <span className="text-xs text-muted-foreground/50">-</span>;
              return <CompactInsightIndicator title={insight.title} severity={insight.severity} />;
            })()}
          </td>
        </>
      )}

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        {isPending && onAccept && onDecline ? (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="default"
              className="h-7 px-2.5 text-xs"
              onClick={() => onAccept(client.id)}
            >
              <Check className="mr-1 size-3" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs"
              onClick={() => onDecline(client.id)}
            >
              <X className="mr-1 size-3" /> Decline
            </Button>
          </div>
        ) : (
          <Link
            href={`/dashboard/clients/${client.id}/overview`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100"
          >
            Open <ArrowUpRight className="size-3" />
          </Link>
        )}
      </td>
    </tr>
  );
}
