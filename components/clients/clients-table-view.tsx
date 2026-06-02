"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, ChevronUp, ChevronDown, Building2, ArrowUpRight } from "lucide-react";
import { type Client, type FilingStatus, stageLabels, stageDotStyles } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { AttentionChip, buildAttentionItems } from "@/components/insights";
import { getTrackingBadgesForClient } from "@/lib/insights-mock-data";
import { getUnreadCountForClient } from "@/lib/comms-mock-data";

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
  extended: 7,
};

// Standard tax filing-status labels (acronyms stay uppercase; "single" → Single).
const filingLabels: Record<FilingStatus, string> = {
  single: "Single",
  mfj: "MFJ",
  mfs: "MFS",
  hoh: "HoH",
  qw: "QW",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
          cmp = (stageOrder[a.returnStage] ?? 0) - (stageOrder[b.returnStage] ?? 0);
          break;
        case "docs": {
          const aP = a.documentsRequired ? a.documentsSubmitted / a.documentsRequired : 0;
          const bP = b.documentsRequired ? b.documentsSubmitted / b.documentsRequired : 0;
          cmp = aP - bP;
          break;
        }
        case "lastActive": {
          const aT = a.lastPortalLogin ? new Date(a.lastPortalLogin).getTime() : 0;
          const bT = b.lastPortalLogin ? new Date(b.lastPortalLogin).getTime() : 0;
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
      return <ChevronUp className="size-3 opacity-0 transition-opacity group-hover:opacity-40" />;
    return sortDir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />;
  };

  const Th = ({
    column,
    label,
    align = "left",
    className,
  }: {
    column?: SortKey;
    label: string;
    align?: "left" | "right";
    className?: string;
  }) => (
    <th
      className={cn(
        "px-3 py-2.5 text-[11px] font-medium text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
        column && "group cursor-pointer select-none transition-colors hover:text-foreground",
        className
      )}
      onClick={column ? () => handleSort(column) : undefined}
    >
      <span className={cn("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
        {label}
        {column && <SortIcon column={column} />}
      </span>
    </th>
  );

  const isEmpty = pendingClients.length === 0 && activeClients.length === 0;

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[16%]" />
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="border-b bg-muted/40">
              <Th column="name" label="Client" className="pl-4" />
              <Th column="stage" label="Stage" />
              <Th column="docs" label="Docs" />
              <Th column="urgency" label="Attention" />
              <Th column="fee" label="Fee" align="right" className="pr-4" />
            </tr>
          </thead>
          <tbody>
            {pendingClients.length > 0 && (
              <>
                <SectionRow label="Pending review" count={pendingClients.length} dot="bg-zinc-400" tint />
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
                {activeClients.length > 0 && <SectionRow label="Active clients" count={activeClients.length} dot="bg-emerald-500" />}
              </>
            )}

            {activeClients.map((client) => (
              <ClientRow key={client.id} client={client} isPending={false} onOpenDetail={onOpenDetail} />
            ))}

            {isEmpty && (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-sm text-muted-foreground">
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

function SectionRow({ label, count, dot, tint }: { label: string; count: number; dot: string; tint?: boolean }) {
  return (
    <tr>
      <td colSpan={5} className={cn("border-b px-4 py-1.5", tint ? "bg-zinc-50 dark:bg-zinc-900/20" : "bg-muted/20")}>
        <div className="flex items-center gap-2">
          <span className={cn("size-1.5 rounded-full", dot)} />
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground/60">{count}</span>
        </div>
      </td>
    </tr>
  );
}

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
    ? Math.round((client.documentsSubmitted / client.documentsRequired) * 100)
    : 0;
  const attentionItems = buildAttentionItems({
    urgency: client.urgency,
    badges: getTrackingBadgesForClient(client.id),
  });
  const unread = getUnreadCountForClient(client.id);
  const subtitle = client.businessName ?? filingLabels[client.filingStatus];

  return (
    <tr
      className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40"
      onClick={() => onOpenDetail(client)}
    >
      {/* Client */}
      <td className="py-2.5 pl-4 pr-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative shrink-0">
            <Avatar className="size-8">
              <AvatarImage src={client.avatar} alt={client.fullName} />
              <AvatarFallback className="text-[10px]">{getInitials(client.fullName)}</AvatarFallback>
            </Avatar>
            {unread > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex size-[15px] items-center justify-center rounded-full bg-emerald-600 text-[8.5px] font-bold leading-none text-white ring-2 ring-background tabular-nums"
                aria-label={`${unread} unread`}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-sans text-[13px] font-medium">{client.fullName}</span>
              {client.type === "business" && <Building2 className="size-3 shrink-0 text-muted-foreground" />}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {subtitle}
              <span className="mx-1 text-muted-foreground/40">·</span>
              {client.serviceTier}
            </div>
          </div>
        </div>
      </td>

      {/* Stage — colored dot + quiet label: keeps the stage color cue without
          a saturated filled pill on every row (reserves loud color for Attention). */}
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-2">
          <span className={cn("size-1.5 shrink-0 rounded-full", stageDotStyles[client.returnStage])} />
          <span className="text-[12px] text-foreground/70">{stageLabels[client.returnStage]}</span>
        </span>
      </td>

      {/* Docs */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", docPercent >= 100 ? "bg-emerald-500" : "bg-foreground/30")}
              style={{ width: `${Math.min(docPercent, 100)}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {client.documentsSubmitted}/{client.documentsRequired}
          </span>
        </div>
      </td>

      {/* Attention */}
      <td className="px-3 py-2.5">
        {attentionItems.length > 0 ? (
          <AttentionChip size="md" items={attentionItems} />
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </td>

      {/* Fee / pending actions */}
      <td className="py-2.5 pl-3 pr-4 text-right">
        {isPending && onAccept && onDecline ? (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => onAccept(client.id)}>
              <Check className="mr-1 size-3" /> Accept
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => onDecline(client.id)}>
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <span className="font-sans text-[12px] tabular-nums text-foreground/80">${client.feeAmount}</span>
            <ArrowUpRight className="size-3.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </td>
    </tr>
  );
}
