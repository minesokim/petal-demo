"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Bottom tab bar for the post-login portal. Five tabs — Home, Docs,
 * Messages, Signatures, Profile. Active tab gets a forest label and
 * filled icon; inactive tabs muted.
 *
 * This is the one place on the client portal where the navigation
 * chrome persists across screens. Each tab's screen owns its own
 * header + scroll.
 */

export type PortalTab = "home" | "docs" | "messages" | "signatures" | "profile";

export function PortalTabBar({
  active,
  onTab,
  unreadMessages,
  pendingSignatures
}: {
  active: PortalTab;
  onTab: (t: PortalTab) => void;
  unreadMessages?: number;
  pendingSignatures?: number;
}) {
  return (
    <nav
      className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-portal-border bg-portal-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <TabButton
        label="Home"
        active={active === "home"}
        onClick={() => onTab("home")}
        icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M3 11 L11 4 L19 11 V18 H14 V13 H8 V18 H3 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={active === "home" ? "currentColor" : "none"}
              fillOpacity={active === "home" ? 0.12 : 1}
            />
          </svg>
        }
      />
      <TabButton
        label="Docs"
        active={active === "docs"}
        onClick={() => onTab("docs")}
        icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M5 3 H14 L18 7 V19 H5 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={active === "docs" ? "currentColor" : "none"}
              fillOpacity={active === "docs" ? 0.12 : 1}
            />
            <path d="M14 3 V7 H18" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        }
      />
      <TabButton
        label="Messages"
        active={active === "messages"}
        onClick={() => onTab("messages")}
        badge={unreadMessages}
        icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M3 5 H19 V15 H13 L11 19 L9 15 H3 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={active === "messages" ? "currentColor" : "none"}
              fillOpacity={active === "messages" ? 0.12 : 1}
            />
          </svg>
        }
      />
      <TabButton
        label="Sign"
        active={active === "signatures"}
        onClick={() => onTab("signatures")}
        badge={pendingSignatures}
        icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M4 17 C7 15, 9 10, 14 7 C18 5, 19 7, 19 9"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M4 20 H18"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="1.5 2.5"
            />
          </svg>
        }
      />
      <TabButton
        label="Profile"
        active={active === "profile"}
        onClick={() => onTab("profile")}
        icon={
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle
              cx="11"
              cy="8"
              r="3.5"
              stroke="currentColor"
              strokeWidth="1.6"
              fill={active === "profile" ? "currentColor" : "none"}
              fillOpacity={active === "profile" ? 0.12 : 1}
            />
            <path
              d="M4 19 C5 15, 8 13.5, 11 13.5 C14 13.5, 17 15, 18 19"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        }
      />
    </nav>
  );
}

function TabButton({
  label,
  active,
  onClick,
  icon,
  badge
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium tracking-[0.03em] uppercase transition-colors",
        active ? "text-forest" : "text-portal-muted hover:text-portal-ink-soft"
      )}>
      <span className="relative">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-1.5 grid min-w-4 place-items-center rounded-full bg-forest px-1 text-[9px] font-semibold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </span>
      {label}
    </button>
  );
}
