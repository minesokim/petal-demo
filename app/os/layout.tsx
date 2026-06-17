"use client";

import "./os-theme.css";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { PetalLogo } from "@/components/os/primitives";
import { SidebarChat } from "@/components/os/sidebar-chat";
import { CommandSearch } from "@/components/os/command-search";
import { NotificationBell } from "@/components/os/notification-bell";
import { TipProvider, Tip } from "@/components/os/tooltip";
import { Icon, I } from "@/components/os/icon";
import { type IconSvgElement } from "@hugeicons/react";
import {
  ChevronsUpDown, ListChecks, Inbox, CalendarDays, Users,
  Settings, Home, FileText, Folder, MailWarning, CreditCard, BookOpen, LogOut,
  PanelLeftClose, PanelLeftOpen, Activity, Blocks,
} from "lucide-react";
import { useLiveNeedsYou } from "@/lib/demo-store";

type Item = { label: string; href: string; icon?: React.ComponentType<{ className?: string }>; badge?: number; glyph?: boolean; logo?: boolean; hugeicon?: IconSvgElement };

function NavRow({ item, active }: { item: Item; active: boolean }) {
  const IconC = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-normal transition-colors",
        active
          ? "bg-black/[0.07] text-[var(--os-ink)]"
          : "text-[var(--os-ink-muted)] hover:bg-black/[0.05] hover:text-[var(--os-ink)]",
      )}
    >
      {item.logo ? <PetalLogo size={14} className="shrink-0" /> : item.hugeicon ? <Icon icon={item.hugeicon} size={14} className="shrink-0" /> : item.glyph ? <PetalMark className="size-3.5 shrink-0" /> : IconC ? <IconC className="size-3.5 shrink-0" /> : null}
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="ml-auto rounded bg-[var(--os-accent-soft)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-accent)]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

/** Collapsible nav section - condenses the sidebar (Solve pattern). */
function NavGroup({ label, icon, items, isActive, defaultOpen = true }: { label: string; icon: React.ReactNode; items: Item[]; isActive: (h: string) => boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("mt-1 rounded-lg transition-colors", open && "bg-black/[0.05]")}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] font-normal text-[var(--os-ink-muted)] transition-colors hover:bg-black/[0.05] hover:text-[var(--os-ink)]"
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl-K opens search anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // close the workspace menu on outside click
  useEffect(() => {
    if (!wsOpen) return;
    const onDown = (e: MouseEvent) => { if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [wsOpen]);

  // Review mode and debug surfaces render full-screen, outside the shell chrome.
  if (pathname.startsWith("/os/review") || pathname.startsWith("/os/debug")) {
    return (
      <div className="petal-os h-screen w-full overflow-hidden bg-[var(--os-shell)] text-[13px]">
        {children}
      </div>
    );
  }

  const primary: Item[] = [
    { label: "Home", href: "/os/today", icon: Home },
    { label: "Tasks", href: "/os/tasks", icon: ListChecks, badge: needsYou },
    { label: "Clients", href: "/os/clients", icon: Users },
    { label: "Inbox", href: "/os/inbox", icon: Inbox },
    { label: "Calendar", href: "/os/calendar", icon: CalendarDays },
  ];
  const records: Item[] = [
    { label: "Documents", href: "/os/documents", icon: FileText },
    { label: "Notices", href: "/os/notices", icon: MailWarning },
    { label: "Billing", href: "/os/billing", icon: CreditCard },
  ];
  const petalAi: Item[] = [
    { label: "Skills", href: "/os/skills", hugeicon: I.skills },
    { label: "Knowledge", href: "/os/knowledge", icon: BookOpen },
    { label: "Activity", href: "/os/activity", icon: Activity },
  ];
  const system: Item[] = [
    { label: "Connections", href: "/os/connections", icon: Blocks },
    { label: "Settings", href: "/os/settings", icon: Settings },
  ];

  return (
    <TipProvider>
    <div className="petal-os relative flex h-screen w-full overflow-hidden bg-[var(--os-shell)] text-[13px]">
      {/* expand control - only when collapsed */}
      {collapsed && (
        <Tip label="Expand sidebar" side="right">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="absolute left-2 top-3 z-30 grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
        >
          <PanelLeftOpen className="size-[18px]" strokeWidth={1.5} />
        </button>
        </Tip>
      )}

      {/* ── SIDEBAR ── */}
      <aside className={cn("group/sidebar relative flex shrink-0 flex-col transition-[width] duration-200 ease-out", collapsed ? "w-0 overflow-hidden" : "w-[208px]")}>
        {/* workspace switcher + search / compose (Linear) */}
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <div className="relative min-w-0 flex-1" ref={wsRef}>
            <button
              onClick={() => setWsOpen(o => !o)}
              aria-expanded={wsOpen}
              className="-mx-1 flex min-w-0 w-full items-center gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-black/[0.05]"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]">
                <PetalMark className="size-3.5" />
              </span>
              <span className="truncate text-[14px] font-semibold text-[var(--os-ink)]">Vazant EA</span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-[var(--os-ink-subtle)]" />
            </button>

            {wsOpen && (
              <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[224px] overflow-hidden rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] p-1.5 shadow-[0_10px_34px_rgba(17,17,26,0.13)]">
                <div className="flex items-center gap-2.5 px-2 py-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]"><PetalMark className="size-4" /></span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-[var(--os-ink)]">Vazant EA</div>
                    <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">Antonio Vazquez · EA</div>
                  </div>
                </div>
                <div className="my-1 h-px bg-[var(--os-border)]" />
                {[
                  { label: "Firm settings", href: "/os/settings", icon: Settings },
                  { label: "Members", href: "/os/settings", icon: Users },
                  { label: "Knowledge", href: "/os/knowledge", icon: BookOpen },
                ].map(it => (
                  <Link key={it.label} href={it.href} onClick={() => setWsOpen(false)} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]">
                    <it.icon className="size-4 shrink-0 text-[var(--os-ink-subtle)]" /> {it.label}
                  </Link>
                ))}
                <div className="my-1 h-px bg-[var(--os-border)]" />
                <button onClick={() => setWsOpen(false)} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                  <LogOut className="size-4 shrink-0 text-[var(--os-ink-subtle)]" /> Sign out
                </button>
              </div>
            )}
          </div>

          <Tip label="Collapse sidebar" side="bottom">
          <button
            aria-label="Collapse sidebar"
            onClick={() => setCollapsed(true)}
            className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] opacity-0 transition-all hover:bg-black/[0.05] hover:text-[var(--os-ink)] focus-visible:opacity-100 group-hover/sidebar:opacity-100"
          >
            <PanelLeftClose className="size-[17px]" strokeWidth={1.5} />
          </button>
          </Tip>
          <Tip label="Search · ⌘K" side="bottom">
          <button
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-black/[0.05] hover:text-[var(--os-ink)]"
          >
            <Icon icon={I.search} size={16} />
          </button>
          </Tip>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3 pt-1">
          <div className="space-y-0.5">
            {primary.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}
          </div>
          <div className="mx-1 my-2 h-px bg-[var(--os-border)]" />
          <NavGroup label="Records" icon={<Folder className="size-3.5 shrink-0" />} items={records} isActive={isActive} defaultOpen={false} />
          <NavGroup label="Petal AI" icon={<PetalMark className="size-3.5 shrink-0" />} items={petalAi} isActive={isActive} defaultOpen={false} />
          <div className="mx-1 my-2 h-px bg-[var(--os-border)]" />
          <div className="space-y-0.5">
            {system.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}
          </div>
        </nav>

        {/* bottom - Ask Petal chat zone (Recent · history · New chat); history slides up over the sidebar */}
        <SidebarChat />
      </aside>

      {/* ── MAIN ── */}
      <main className={cn("min-w-0 flex-1 overflow-hidden p-2.5 pt-3 transition-[padding] duration-200 ease-out", collapsed && "pl-11")}>
        <div className="h-full overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-canvas)] shadow-[0_1px_2px_rgba(17,17,26,0.04),0_4px_14px_-6px_rgba(17,17,26,0.07)]">
          {children}
        </div>
      </main>

      {/* notification center — fixed in the top-right corner, above page chrome.
          A surface chip keeps the bell legible over dark headers (e.g. Home's hero). */}
      <div className="fixed right-3 top-[26px] z-30 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)]/90 shadow-[0_1px_2px_rgba(17,17,26,0.06)] backdrop-blur-sm">
        <NotificationBell />
      </div>

      <AnimatePresence>
        {searchOpen && <CommandSearch onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </div>
    </TipProvider>
  );
}
