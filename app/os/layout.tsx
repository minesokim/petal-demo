"use client";

import "./os-theme.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { PetalLogo } from "@/components/os/primitives";
import { Icon, I } from "@/components/os/icon";
import { type IconSvgElement } from "@hugeicons/react";
import {
  Search, ChevronsUpDown, ListChecks, Inbox, BarChart3, Users,
  Orbit, BookOpen, Settings, Star, Home, FileText,
} from "lucide-react";

type Item = { label: string; href: string; icon?: React.ComponentType<{ className?: string }>; badge?: number; glyph?: boolean; logo?: boolean; hugeicon?: IconSvgElement };

function NavRow({ item, active }: { item: Item; active: boolean }) {
  const IconC = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-7 items-center gap-2 rounded-md px-2 text-[13px] transition-colors",
        active
          ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]"
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

export default function OsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const primary: Item[] = [
    { label: "Ask Petal", href: "/os/ask", icon: Search, glyph: true },
    { label: "Today", href: "/os/today", icon: Home },
    { label: "Tasks", href: "/os/tasks", icon: ListChecks, badge: 4 },
    { label: "Inbox", href: "/os/inbox", icon: Inbox },
    { label: "Billing", href: "/os/billing", hugeicon: I.billing },
  ];
  const records: Item[] = [
    { label: "Clients", href: "/os/clients", icon: Users },
    { label: "Documents", href: "/os/documents", icon: FileText },
  ];
  const lists: Item[] = [
    { label: "Worklists", href: "/os/lists", icon: Star },
  ];
  const petalAi: Item[] = [
    { label: "Petal Agents", href: "/os/agents", icon: Orbit, logo: true },
    { label: "Knowledge", href: "/os/knowledge", icon: BookOpen },
  ];

  return (
    <div className="petal-os flex h-screen w-full overflow-hidden text-[13px]">
      {/* ── SIDEBAR (240px, 1-to-1 Attio) ── */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-[var(--os-border)] bg-[var(--os-bg-subtle)]">
        {/* workspace switcher */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="grid size-6 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]">
            <PetalMark className="size-3.5" />
          </div>
          <span className="text-[13px] font-semibold">Vazant EA</span>
          <ChevronsUpDown className="ml-auto size-3.5 text-[var(--os-ink-subtle)]" />
        </div>

        {/* quick actions / search */}
        <div className="px-2 pb-2">
          <button className="flex h-8 w-full items-center gap-2 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[var(--os-ink-subtle)]">
            <Search className="size-3.5" />
            <span className="text-[13px]">Quick actions</span>
            <kbd className="ml-auto rounded border border-[var(--os-border)] px-1 text-[10px] text-[var(--os-ink-subtle)]">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          <div className="space-y-0.5">
            {primary.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}
          </div>

          <div className="os-label mb-1 mt-4 px-2">Records</div>
          <div className="space-y-0.5">
            {records.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}
          </div>

          <div className="mt-4 space-y-0.5">
            {lists.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}
          </div>

          <div className="os-label mb-1 mt-4 px-2">Petal AI</div>
          <div className="space-y-0.5">
            {petalAi.map(i => <NavRow key={i.href} item={i} active={isActive(i.href)} />)}
          </div>
        </nav>

        {/* bottom */}
        <div className="border-t border-[var(--os-border)] p-2">
          <NavRow item={{ label: "Reports", href: "/os/reports", icon: BarChart3 }} active={isActive("/os/reports")} />
          <NavRow item={{ label: "Settings", href: "/os/settings", icon: Settings }} active={isActive("/os/settings")} />
          <div className="mt-2 px-2 pb-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--os-ink-subtle)]">
              <span>Usage</span><span className="tabular-nums">62%</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--os-selected)]">
              <div className="h-full w-[62%] rounded-full bg-[var(--os-ink-muted)]" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--os-bg)]">{children}</main>
    </div>
  );
}
