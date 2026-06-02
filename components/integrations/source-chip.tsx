"use client";

/**
 * SourceChip — tiny inline pill identifying which connected integration a
 * triage card came from. Two density variants:
 *
 *   <SourceChip integrationId="xero" />            ← logo + name
 *   <SourceChip integrationId="xero" showSync />   ← logo + name + "4m ago"
 *
 * Brand badge: first letter of name, on a colored square. Real logos would
 * replace this in production; the stand-in keeps things zero-asset.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { getIntegration } from "@/lib/integrations-mock-data";

interface SourceChipProps {
  integrationId: string;
  /** Show "synced Xm ago" suffix. Default: false. */
  showSync?: boolean;
  /** Visual size. Default: "sm". */
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function SourceChip({ integrationId, showSync = false, size = "sm", className }: SourceChipProps) {
  const integration = getIntegration(integrationId);
  if (!integration) return null;

  const sizeStyles = {
    xs: { badge: "size-3 text-[7px]", text: "text-[10px]", gap: "gap-1" },
    sm: { badge: "size-3.5 text-[8px]", text: "text-[10.5px]", gap: "gap-1" },
    md: { badge: "size-4 text-[9px]", text: "text-[11.5px]", gap: "gap-1.5" },
  }[size];

  const initial = integration.name.charAt(0).toUpperCase();
  const syncLabel = showSync && integration.lastSyncAt
    ? formatDistanceToNowStrict(parseISO(integration.lastSyncAt), { addSuffix: false })
    : null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md text-foreground/70",
        sizeStyles.gap,
        sizeStyles.text,
        className
      )}
      title={`Source: ${integration.name}${syncLabel ? ` · synced ${syncLabel} ago` : ""}`}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-sm font-bold tabular-nums leading-none",
          sizeStyles.badge
        )}
        style={{
          backgroundColor: integration.brandColor,
          color: integration.brandText ?? "#FFFFFF",
        }}
        aria-hidden="true"
      >
        {initial}
      </span>
      <span className="truncate font-medium">{integration.name}</span>
      {syncLabel && (
        <span className="text-foreground/45">· {syncLabel} ago</span>
      )}
    </span>
  );
}
