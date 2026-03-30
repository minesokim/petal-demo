"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  Building2, DollarSign, FileSignature, CreditCard,
  Globe, FileText, BrainCircuit, BellRing, Clock,
  PlugIcon, Palette, ScrollText, Users
} from "lucide-react";

const sections = [
  {
    label: "Practice",
    items: [
      { title: "Firm Profile", href: "/dashboard/pages/settings/profile", icon: Building2 },
      { title: "Service Tiers", href: "/dashboard/pages/settings/tiers", icon: DollarSign },
      { title: "E-Filing & ERO", href: "/dashboard/pages/settings/ero", icon: FileSignature },
      { title: "Payments", href: "/dashboard/pages/settings/payments", icon: CreditCard },
    ],
  },
  {
    label: "Client Experience",
    items: [
      { title: "Client Portal", href: "/dashboard/pages/settings/portal", icon: Globe },
      { title: "Templates", href: "/dashboard/pages/settings/templates", icon: FileText },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "AI Preferences", href: "/dashboard/pages/settings/ai", icon: BrainCircuit },
      { title: "Automated Reminders", href: "/dashboard/pages/settings/reminders", icon: Clock },
      { title: "Notifications", href: "/dashboard/pages/settings/notifications", icon: BellRing },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Integrations", href: "/dashboard/pages/settings/integrations", icon: PlugIcon },
      { title: "Appearance", href: "/dashboard/pages/settings/appearance", icon: Palette },
      { title: "Audit Trail", href: "/dashboard/pages/settings/audit", icon: ScrollText },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {sections.map((section) => (
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
