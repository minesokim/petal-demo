"use client";

import * as React from "react";
import { ArrowRight, Calendar } from "lucide-react";
import { type Client, type ReturnStage } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOneLineInsightForClient } from "@/lib/insights-mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  subscribePipelineStages,
  getAllStageOverrides,
} from "@/lib/pipeline-stage-store";

const EMPTY_OVERRIDES: Record<string, ReturnStage> = {};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// Workflow ordering used for the "% complete" derivation
const STAGE_ORDER: ReturnStage[] = [
  "new_intake",
  "collecting_docs",
  "ready_to_prep",
  "in_preparation",
  "client_review",
  "pay_and_sign",
  "filed",
];

/**
 * Derive a 0-100 progress for the return. Each stage carries an equal slice
 * (~14%); for collecting_docs we additionally blend in the docs-submitted
 * ratio so clients with more docs in hand visibly inch forward within the
 * stage. Pending clients = 0; filed = 100.
 */
function returnProgressPct(client: Client, stage: ReturnStage): number {
  if (client.clientStatus === "pending") return 0;
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < 0) return 0;
  const slice = 100 / STAGE_ORDER.length;
  const base = (idx + 1) * slice;
  if (stage === "collecting_docs" && client.documentsRequired > 0) {
    const docPct = Math.min(1, client.documentsSubmitted / client.documentsRequired);
    return Math.round(base - slice + slice * docPct);
  }
  return Math.round(base);
}

/**
 * Filing type derived from client.type + serviceTier. Three buckets that map
 * to the services available in serviceTierOptions (mock-data.ts):
 *   - Simple    → individual + Basic tier        (Simple Tax Return — $150)
 *   - Complex   → individual + Standard/Premium  (Complex Return — $350+)
 *   - Business  → any business client            (Business Tax Return — $500)
 */
function getFilingType(client: Client): "Simple" | "Complex" | "Business" {
  if (client.type === "business") return "Business";
  if (client.serviceTier === "Basic") return "Simple";
  return "Complex";
}

// Assignee lookup — pulls from the real firm member list (lib/firm-mock-data)
// using client.assignedTo. Falls back to a deterministic hash pick for the
// rare case where assignedTo is missing (e.g., a freshly-created client
// before the assignment dialog has been used).
import { FIRM, memberInitials, type FirmMember } from "@/lib/firm-mock-data";

type AssigneeChip = { name: string; avatar?: string; initials: string };

function chipFromMember(m: FirmMember): AssigneeChip {
  return {
    name: `${m.shortName} ${m.fullName.split(" ").slice(-1)[0]?.[0] ?? ""}.`.trim(),
    avatar: m.avatar,
    initials: memberInitials(m),
  };
}

// Deterministic fallback over human members (skip Petal — she's never
// directly assigned in production).
const HUMAN_POOL = FIRM.members.filter((m) => m.role !== "ai");

function getAssigneeFor(client: Client): AssigneeChip {
  if (client.assignedTo) {
    const m = FIRM.members.find((x) => x.id === client.assignedTo);
    if (m) return chipFromMember(m);
  }
  // Fallback — stable per client id
  let hash = 0;
  for (let i = 0; i < client.id.length; i++) hash = (hash * 31 + client.id.charCodeAt(i)) | 0;
  return chipFromMember(HUMAN_POOL[Math.abs(hash) % HUMAN_POOL.length]);
}

/**
 * Dot color for the status row. Filed clients get emerald (success);
 * otherwise the insight severity drives the color: alert=red, concern=amber,
 * default=blue (in-progress).
 */
function dotColorForSeverity(severity: string | undefined, stage: ReturnStage): string {
  if (stage === "filed") return "bg-emerald-500";
  switch (severity) {
    case "alert":
      return "bg-red-500";
    case "concern":
      return "bg-amber-500";
    case "insight":
    default:
      return "bg-blue-500";
  }
}

/**
 * Calendar-row label per stage. Reference cards show one short, time-anchored
 * phrase ("Due Mar 30 · Missed", "Requested Feb 24", "Est. ready Mar 10"),
 * so the wording leans concrete + actionable rather than vague.
 */
function timelineForStage(client: Client, stage: ReturnStage): { text: string; urgent: boolean } {
  const daysAgo = client.lastPortalLogin
    ? Math.floor((Date.now() - new Date(client.lastPortalLogin).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const daysLabel = daysAgo === null ? "recently" : daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;

  if (client.clientStatus === "pending") {
    if (client.scheduledCall) {
      const callDate = new Date(client.scheduledCall);
      const dateStr = callDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isPast = callDate < new Date();
      if (isPast) return { text: `Due ${dateStr} · Missed`, urgent: true };
      return { text: `Call ${dateStr}`, urgent: client.urgency === "urgent" || client.urgency === "high" };
    }
    return { text: "Awaiting partner decision", urgent: false };
  }

  switch (stage) {
    case "new_intake":
      return { text: `Intake started ${daysLabel}`, urgent: false };
    case "collecting_docs":
      return { text: `Requested ${daysLabel}`, urgent: false };
    case "ready_to_prep":
    case "in_preparation":
      return { text: "Est. ready in 5 days", urgent: false };
    case "client_review":
      return { text: "Awaiting signoff", urgent: false };
    case "pay_and_sign":
      return { text: "Signature pending", urgent: true };
    case "filed":
      return { text: "Filed", urgent: false };
    default:
      return { text: "", urgent: false };
  }
}

interface ClientCardProps {
  client: Client;
  onOpenDetail?: (client: Client) => void;
  /** Compatibility — no longer affects layout. */
  defaultExpanded?: boolean;
  staticSize?: boolean;
  /** Optional unread message count — green badge in the header. */
  unreadCount?: number;
  /** Pipeline density. "compact" = single-line row; "comfortable" = full card. */
  density?: "comfortable" | "compact";
}

export function ClientCard({
  client,
  onOpenDetail,
  unreadCount = 0,
  density = "comfortable",
}: ClientCardProps) {
  // Effective stage honors drag-and-drop overrides from the pipeline store
  const overrides = React.useSyncExternalStore<Record<string, ReturnStage>>(
    subscribePipelineStages,
    getAllStageOverrides,
    () => EMPTY_OVERRIDES
  );
  const effectiveStage: ReturnStage = overrides[client.id] ?? client.returnStage;

  const lastActive = client.lastPortalLogin
    ? Math.floor((Date.now() - new Date(client.lastPortalLogin).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const lastActiveLabel = lastActive === null ? "Never" : lastActive === 0 ? "Today" : `${lastActive}d ago`;
  const lastActiveColor = lastActive !== null && lastActive <= 3 ? "text-foreground" : lastActive !== null && lastActive <= 7 ? "text-amber-600" : "text-red-500";

  // ─── Compact density — single-line row used in pipeline "Compact" view ───
  if (density === "compact") {
    return (
      <div
        onClick={() => onOpenDetail?.(client)}
        className="group flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-white px-2.5 text-[12px] transition-colors hover:bg-muted/50"
      >
        <Avatar className="size-5 shrink-0">
          {client.avatar && <AvatarImage src={client.avatar} alt={client.fullName} />}
          <AvatarFallback className="text-[8px] font-medium">{getInitials(client.fullName)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate font-medium">{client.fullName}</span>
        {unreadCount > 0 && (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-semibold leading-none text-white">
            {unreadCount}
          </span>
        )}
        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
          {client.documentsSubmitted}/{client.documentsRequired}
        </span>
        <span className={cn("shrink-0 text-[10px] tabular-nums", lastActiveColor)}>
          {lastActiveLabel}
        </span>
      </div>
    );
  }

  // ─── Comfortable density — Kanban card matching the reference ───
  const oneLineInsight = getOneLineInsightForClient(client.id);
  const insightText = oneLineInsight?.title || "No active flags";
  const dotColor = dotColorForSeverity(oneLineInsight?.severity, effectiveStage);
  const timeline = timelineForStage(client, effectiveStage);
  const progress = returnProgressPct(client, effectiveStage);
  const assignee = getAssigneeFor(client);
  const progressComplete = effectiveStage === "filed";
  const filingType = getFilingType(client);

  return (
    <div
      onClick={() => onOpenDetail?.(client)}
      className="group cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Header — avatar + name + tier · price */}
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={client.avatar} alt={client.fullName} />
          <AvatarFallback className="text-xs">{getInitials(client.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14px] font-semibold leading-tight">{client.fullName}</span>
            <span
              className="shrink-0 rounded border border-border bg-background px-1.5 py-px text-[9px] font-medium text-foreground/60"
              title={`${filingType} return`}
            >
              {filingType}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {client.serviceTier} <span className="text-muted-foreground/40">·</span> ${client.feeAmount}
          </div>
        </div>
        {unreadCount > 0 && (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold leading-none text-white"
            aria-label={`${unreadCount} unread`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Status row — colored dot + insight (the WHAT) */}
      <div className="mt-3 flex items-center gap-2 text-[12.5px]">
        <span className={cn("size-1.5 shrink-0 rounded-full", dotColor)} />
        <span className="truncate text-foreground/85">{insightText}</span>
      </div>

      {/* Timeline row — calendar + date (the WHEN) */}
      <div className="mt-1.5 flex items-center gap-2 text-[12.5px]">
        <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "truncate",
            timeline.urgent ? "font-medium text-red-600" : "text-muted-foreground"
          )}
        >
          {timeline.text}
        </span>
      </div>

      {/* Assignee (left) + progress (right) — combined row, quiet visual weight */}
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <Avatar className="size-4 shrink-0">
          {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.name} />}
          <AvatarFallback className="text-[7px] font-medium">{assignee.initials}</AvatarFallback>
        </Avatar>
        <span className="truncate text-muted-foreground">{assignee.name}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div className="h-1 w-14 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progressComplete ? "bg-emerald-500" : "bg-foreground/70"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-7 text-right tabular-nums text-muted-foreground">{progress}%</span>
        </div>
      </div>

      {/* Open file — separate row beneath, quiet hover lift */}
      <Link
        href={`/dashboard/clients/${client.id}/overview`}
        onClick={(e) => e.stopPropagation()}
        className="mt-2.5 flex items-center gap-1 text-[12.5px] font-medium text-foreground/70 transition-colors hover:text-foreground"
      >
        Open file <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
