"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * TabBar — 7 tabs under the client header, sticky top.
 *
 * Per PETAL-V4-PRD.md §5.2 and design-references/petal-synthesis.html.
 * Active tab: rust underline, ink copy, weight 550.
 * Inactive tabs link to /client/[id]/{slug} routes; in Phase 3 only
 * overview exists, others render a 404-style stub from the [slug] route.
 */

export type TabDef = {
  slug: string;
  label: string;
  count?: number;
  /** Shows a rust pulsing dot next to the count (unread messages). */
  pulse?: boolean;
};

export const WORKSPACE_TABS: TabDef[] = [
  { slug: "overview", label: "Overview" },
  { slug: "documents", label: "Documents" },
  { slug: "messages", label: "Messages" },
  { slug: "return", label: "Return" },
  { slug: "billing", label: "Billing" },
  { slug: "timeline", label: "Timeline" },
  { slug: "compliance", label: "Compliance" }
];

export interface TabBarProps {
  clientId: string;
  activeSlug: string;
  counts?: { documents?: number; messages?: number; messagesUnread?: boolean };
}

export function TabBar({ clientId, activeSlug, counts }: TabBarProps) {
  const tabs = WORKSPACE_TABS.map((t) => {
    if (t.slug === "documents")
      return { ...t, count: counts?.documents };
    if (t.slug === "messages")
      return {
        ...t,
        count: counts?.messages,
        pulse: counts?.messagesUnread
      };
    return t;
  });

  return (
    <div className="sticky top-0 z-[2] flex gap-[2px] border-b border-hairline bg-bg px-7">
      {tabs.map((t) => (
        <TabLink key={t.slug} tab={t} clientId={clientId} active={t.slug === activeSlug} />
      ))}
    </div>
  );
}

function TabLink({
  tab,
  clientId,
  active
}: {
  tab: TabDef;
  clientId: string;
  active: boolean;
}) {
  return (
    <Link
      href={`/dashboard/client/${clientId}/${tab.slug}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "-mb-px flex items-center gap-[7px] border-b-2 border-transparent px-3.5 py-2 text-[13px] font-medium transition-colors",
        active ? "border-rust font-[550] text-ink" : "text-ink-3 hover:text-ink"
      )}>
      {tab.label}
      {typeof tab.count === "number" ? (
        <span className="font-mono text-[10.5px] text-ink-4">{tab.count}</span>
      ) : null}
      {tab.pulse ? (
        <span
          aria-hidden
          className="size-[6px] animate-pulse rounded-full bg-rust"
          style={{ animationDuration: "2s" }}
        />
      ) : null}
    </Link>
  );
}
