"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Moon,
  CheckCircle2,
  Users,
  Columns3,
  FileText,
  Calendar,
  Sparkles,
  Zap,
  Plug,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Nav — 200px left rail, persistent across triage and client workspace.
 *
 * Structure per DOCKET-V4-PRD.md §3.3 and design-references/docket-direction-b-v2.html:
 *   Queue: Triage (urgent count), Snoozed, Done today
 *   Views: Clients, Pipeline, Documents, Calendar, Ask Docket
 *   Firm:  Automations, Integrations, Compliance
 *   Footer: user profile (avatar + name + firm)
 *
 * Active state is derived from pathname. Counts are passed in so Phase 2
 * can wire real queue/doc counts; sensible defaults ship with the component.
 */

type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  count?: number;
  /** Rust-colored count when urgent (e.g. triage > 0). */
  urgent?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export interface NavProps {
  /** Path prefix for nav links. Phase 1 uses /dashboard; override in testing. */
  basePath?: string;
  /** Counts surfaced on nav items. Defaults match the b-v2 mockup. */
  counts?: {
    triage?: number;
    snoozed?: number;
    doneToday?: number;
    clients?: number;
    documents?: number;
  };
  user?: {
    name: string;
    firm: string;
    initials: string;
  };
}

export function Nav({
  basePath = "/dashboard",
  counts,
  user = { name: "Antonio Vazquez", firm: "Vazant Consulting", initials: "AV" }
}: NavProps) {
  const pathname = usePathname();

  const c = {
    triage: counts?.triage ?? 14,
    snoozed: counts?.snoozed ?? 3,
    doneToday: counts?.doneToday ?? 6,
    clients: counts?.clients ?? 23,
    documents: counts?.documents ?? 142
  };

  const sections: NavSection[] = [
    {
      label: "Queue",
      items: [
        { label: "Triage", icon: Inbox, href: `${basePath}/triage`, count: c.triage, urgent: c.triage > 0 },
        { label: "Snoozed", icon: Moon, href: `${basePath}/snoozed`, count: c.snoozed },
        { label: "Done today", icon: CheckCircle2, href: `${basePath}/done`, count: c.doneToday }
      ]
    },
    {
      label: "Views",
      items: [
        { label: "Clients", icon: Users, href: `${basePath}/clients`, count: c.clients },
        { label: "Pipeline", icon: Columns3, href: `${basePath}/pipeline` },
        { label: "Documents", icon: FileText, href: `${basePath}/documents`, count: c.documents },
        { label: "Calendar", icon: Calendar, href: `${basePath}/calendar` },
        { label: "Ask Docket", icon: Sparkles, href: `${basePath}/ask` }
      ]
    },
    {
      label: "Firm",
      items: [
        { label: "Automations", icon: Zap, href: `${basePath}/automations` },
        { label: "Integrations", icon: Plug, href: `${basePath}/integrations` },
        { label: "Compliance", icon: ShieldCheck, href: `${basePath}/compliance` }
      ]
    }
  ];

  return (
    <nav className="flex h-full flex-col gap-px px-2 py-3">
      {sections.map((section, i) => (
        <div key={section.label} className="flex flex-col gap-px">
          <div
            className={cn(
              "px-2.5 pt-3.5 pb-1.5 text-[10px] font-medium uppercase tracking-[0.11em] text-ink-4",
              i === 0 && "pt-0.5"
            )}>
            {section.label}
          </div>
          {section.items.map((item) => (
            <NavItemRow key={item.label} item={item} pathname={pathname} />
          ))}
        </div>
      ))}

      <div className="mt-auto flex items-center gap-2.5 border-t border-hairline px-2.5 pt-2.5 pb-0.5">
        <div className="grid size-[26px] flex-shrink-0 place-items-center rounded-full bg-ink-2 text-[10px] font-medium tracking-[0.02em] text-bg">
          {user.initials}
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[12px] font-medium text-ink-2">{user.name}</span>
          <span className="truncate font-mono text-[10.5px] text-ink-4">{user.firm}</span>
        </div>
      </div>
    </nav>
  );
}

function NavItemRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;

  const body = (
    <>
      <span className="flex min-w-0 items-center gap-[9px]">
        <Icon
          className={cn(
            "size-[13px] flex-shrink-0 stroke-[1.5]",
            active ? "text-ink-2" : "text-ink-4"
          )}
        />
        <span className="truncate">{item.label}</span>
      </span>
      {typeof item.count === "number" ? (
        <span
          className={cn(
            "font-mono text-[11px]",
            active
              ? item.urgent
                ? "font-medium text-rust"
                : "text-ink-2"
              : item.urgent
                ? "text-rust"
                : "text-ink-4"
          )}>
          {item.count}
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "flex items-center justify-between gap-2 rounded px-2.5 py-1.5 text-[13px] font-[450] text-ink-2 transition-colors",
    "hover:bg-surface-2",
    active && "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--hairline)]"
  );

  if (!item.href) {
    return (
      <button type="button" className={cn(className, "cursor-pointer text-left")}>
        {body}
      </button>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {body}
    </Link>
  );
}
