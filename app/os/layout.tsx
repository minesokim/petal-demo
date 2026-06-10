"use client";

import "./os-theme.css";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { PetalLogo } from "@/components/os/primitives";
import { SidebarChat } from "@/components/os/sidebar-chat";
import { Icon, I } from "@/components/os/icon";
import { type IconSvgElement } from "@hugeicons/react";
import {
  ChevronsUpDown, ListChecks, Inbox, BarChart3, Users,
  Settings, Home, FileText, Folder, FileCheck2, MailWarning, Receipt,
} from "lucide-react";
import { useLiveNeedsYou } from "@/lib/demo-store";

type Item = { label: string; href: string; icon?: React.ComponentType<{ className?: string }>; badge?: number; glyph?: boolean; logo?: boolean; hugeicon?: IconSvgElement };

function NavRow({ item, active }: { item: Item; active: boolean }) {
  const IconC = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-black/[0.035] text-[var(--os-ink)]"
          : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
      )}
    >
      {item.logo ? <PetalLogo size={16} className="shrink-0" /> : item.hugeicon ? <Icon icon={item.hugeicon} size={16} className="shrink-0" /> : item.glyph ? <PetalMark className="size-4 shrink-0" /> : IconC ? <IconC className="size-4 shrink-0" /> : null}
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="ml-auto rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

/** Collapsible nav section — condenses the sidebar (Solve pattern). */
function NavGroup({ label, icon, items, isActive, defaultOpen = true }: { label: string; icon: React.ReactNode; items: Item[]; isActive: (h: string) => boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("mt-1 rounded-lg transition-colors", open && "bg-black/[0.035]")}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"
      >
        {icon}
        <span className="flex-1 truncate text-left">{label}</span>
        <Icon icon={I.chevronDown} size={14} className={cn("shrink-0 text-[var(--os-ink-subtle)] transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="space-y-0.5 px-1 pb-1.5">{items.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}</div>}
    </div>
  );
}

export default function OsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const needsYou = useLiveNeedsYou().length;

  // Review mode and debug surfaces render full-screen, outside the shell chrome.
  if (pathname.startsWith("/os/review") || pathname.startsWith("/os/debug")) {
    return (
      <div className="petal-os h-screen w-full overflow-hidden bg-[var(--os-shell)] text-[13px]">
        {children}
      </div>
    );
  }

  const primary: Item[] = [
    { label: "Today", href: "/os/today", icon: Home },
    { label: "Tasks", href: "/os/tasks", icon: ListChecks, badge: needsYou },
    { label: "Inbox", href: "/os/inbox", icon: Inbox },
  ];
  const records: Item[] = [
    { label: "Returns", href: "/os/returns", icon: FileCheck2 },
    { label: "Clients", href: "/os/clients", icon: Users },
    { label: "Documents", href: "/os/documents", icon: FileText },
    { label: "Notices", href: "/os/notices", icon: MailWarning },
    { label: "Billing", href: "/os/billing", icon: Receipt },
  ];
  const petalAi: Item[] = [
    { label: "Skills", href: "/os/skills", hugeicon: I.skills },
  ];
  const system: Item[] = [
    { label: "Practice", href: "/os/practice", icon: BarChart3 },
    { label: "Settings", href: "/os/settings", icon: Settings },
  ];

  return (
    <div className="petal-os flex h-screen w-full overflow-hidden bg-[var(--os-shell)] text-[13px]">
      {/* ── SIDEBAR ── */}
      <aside className="relative flex w-[208px] shrink-0 flex-col">
        {/* workspace switcher + search / compose (Linear) */}
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <div className="grid size-6 shrink-0 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]">
            <PetalMark className="size-3.5" />
          </div>
          <button className="flex min-w-0 items-center gap-1">
            <span className="truncate text-[14px] font-semibold">Vazant EA</span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-[var(--os-ink-subtle)]" />
          </button>
          <button aria-label="Search" className="ml-auto grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"><Icon icon={I.search} size={16} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3 pt-1">
          <div className="space-y-0.5">
            {primary.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}
          </div>
          <div className="mx-1 my-2 h-px bg-[var(--os-border)]" />
          <NavGroup label="Records" icon={<Folder className="size-4 shrink-0" />} items={records} isActive={isActive} defaultOpen />
          <NavGroup label="Petal AI" icon={<PetalMark className="size-4 shrink-0" />} items={petalAi} isActive={isActive} defaultOpen={false} />
          <div className="mx-1 my-2 h-px bg-[var(--os-border)]" />
          <div className="space-y-0.5">
            {system.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}
          </div>
        </nav>

        {/* bottom — Ask Petal chat zone (Recent · history · New chat); history slides up over the sidebar */}
        <SidebarChat />
      </aside>

      {/* ── MAIN ── */}
      <main className="min-w-0 flex-1 overflow-hidden p-2.5 pt-3">
        <div className="h-full overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-canvas)] shadow-[0_1px_2px_rgba(17,17,26,0.04),0_4px_14px_-6px_rgba(17,17,26,0.07)]">
          {children}
        </div>
      </main>
    </div>
  );
}
