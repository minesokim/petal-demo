"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, DollarSign, FileSignature, CreditCard,
  Globe, FileText, BrainCircuit, BellRing, Clock,
  PlugIcon, Palette, ScrollText, Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session-context";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/firm-mock-data";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Optional permission gate. Hidden if the current user lacks it. */
  requires?: Permission;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "Practice",
    items: [
      { title: "Firm Profile", href: "/dashboard/pages/settings/profile", icon: Building2, requires: "manage_settings" },
      { title: "Team", href: "/dashboard/pages/settings/team", icon: Users },
      { title: "Service Tiers", href: "/dashboard/pages/settings/tiers", icon: DollarSign, requires: "manage_billing" },
      { title: "E-Filing & ERO", href: "/dashboard/pages/settings/ero", icon: FileSignature, requires: "sign_returns" },
      { title: "Payments", href: "/dashboard/pages/settings/payments", icon: CreditCard, requires: "manage_billing" },
    ],
  },
  {
    label: "Client Experience",
    items: [
      { title: "Client Portal", href: "/dashboard/pages/settings/portal", icon: Globe, requires: "manage_settings" },
      { title: "Templates", href: "/dashboard/pages/settings/templates", icon: FileText, requires: "manage_settings" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "AI Preferences", href: "/dashboard/pages/settings/ai", icon: BrainCircuit, requires: "manage_settings" },
      { title: "Automated Reminders", href: "/dashboard/pages/settings/reminders", icon: Clock, requires: "manage_settings" },
      { title: "Notifications", href: "/dashboard/pages/settings/notifications", icon: BellRing },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Integrations", href: "/dashboard/pages/settings/integrations", icon: PlugIcon, requires: "manage_settings" },
      { title: "Appearance", href: "/dashboard/pages/settings/appearance", icon: Palette },
      { title: "Audit Trail", href: "/dashboard/pages/settings/audit", icon: ScrollText, requires: "manage_settings" },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  // Filter items by the current user's permissions. Sections that end up
  // empty (e.g., a junior preparer who can't see any Practice items) are
  // dropped entirely so we don't show ghost headings.
  const visible = React.useMemo(() => {
    const perms = ROLE_PERMISSIONS[user.role];
    const can = (p: Permission | undefined) => !p || perms.includes(p);
    return sections
      .map((s) => ({ ...s, items: s.items.filter((i) => can(i.requires)) }))
      .filter((s) => s.items.length > 0);
  }, [user.role]);

  return (
    <nav className="space-y-5">
      {visible.map((section) => (
        <div key={section.label}>
          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {section.label}
          </div>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-primary/8 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
