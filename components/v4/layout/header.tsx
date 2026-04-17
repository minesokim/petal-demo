import * as React from "react";
import { Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEADER_SLOT_ATTR } from "./shell-context";

/**
 * Header — 48px top bar, persistent across triage and client workspace.
 *
 * Layout per DOCKET-V4-PRD.md §3.4 and design-references/docket-direction-b-v2.html:
 *   [ 200px brand ] [ flex: header-middle portal target ] [ ⌘K  🔔  avatar ]
 *
 * The middle region is a DOM node marked with `data-header-slot` so
 * pages can portal content into it (triage: progress strip; workspace:
 * breadcrumb). Using a portal instead of context state avoids the
 * infinite-loop hazard of storing JSX in useState.
 */
export interface HeaderProps {
  user?: {
    initials: string;
  };
  /** Unread notification count; bell shows a rust dot when > 0. */
  unreadCount?: number;
  /** Placeholder shown inside the ⌘K input. */
  searchPlaceholder?: string;
  className?: string;
}

export function Header({
  user = { initials: "AV" },
  unreadCount = 0,
  searchPlaceholder = "Search clients, docs, commands",
  className
}: HeaderProps) {
  return (
    <div
      className={cn(
        "grid h-full items-center bg-bg",
        // brand 200px, flexible middle, right auto — matches mockup
        "grid-cols-[200px_minmax(0,1fr)_auto]",
        className
      )}>
      <Brand />
      <div
        {...{ [HEADER_SLOT_ATTR]: "" }}
        className="flex h-full min-w-0 items-center border-r border-hairline"
      />
      <div className="flex h-full items-center gap-3 px-4">
        <CommandKInput placeholder={searchPlaceholder} />
        <NotificationBell unreadCount={unreadCount} />
        <Avatar initials={user.initials} />
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex h-full items-center gap-[9px] border-r border-hairline px-4">
      <div
        className="grid size-[22px] place-items-center rounded-[5px] bg-ink font-serif text-[14px] font-semibold text-bg"
        style={{
          letterSpacing: "-0.02em",
          fontVariationSettings: '"opsz" 144, "SOFT" 30'
        }}
        aria-hidden>
        D
      </div>
      <span
        className="font-serif text-[17px] font-medium"
        style={{
          letterSpacing: "-0.015em",
          fontVariationSettings: '"opsz" 144, "SOFT" 30'
        }}>
        Docket
      </span>
    </div>
  );
}

function CommandKInput({ placeholder }: { placeholder: string }) {
  return (
    <button
      type="button"
      className="flex w-[260px] items-center gap-2 rounded-[5px] border border-hairline bg-surface px-2.5 py-1.5 text-left text-[12px] text-ink-4 transition-colors hover:bg-surface-2">
      <Search className="size-[13px] stroke-[1.5] text-ink-4" aria-hidden />
      <span className="flex-1 truncate">{placeholder}</span>
      <kbd className="rounded-[3px] border border-hairline bg-bg px-[5px] py-px font-mono text-[10px] text-ink-3">
        ⌘K
      </kbd>
    </button>
  );
}

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const hasUnread = unreadCount > 0;
  return (
    <button
      type="button"
      aria-label={hasUnread ? `${unreadCount} unread notifications` : "Notifications"}
      className="relative grid size-7 place-items-center rounded-[4px] text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-2">
      <Bell className="size-[15px] stroke-[1.5]" aria-hidden />
      {hasUnread ? (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-rust" aria-hidden />
      ) : null}
    </button>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="grid size-[26px] flex-shrink-0 place-items-center rounded-full bg-ink-2 text-[10px] font-medium tracking-[0.02em] text-bg">
      {initials}
    </div>
  );
}
