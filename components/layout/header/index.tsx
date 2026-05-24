"use client";

import { PanelLeftClose, PanelLeftOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Separator } from "@/components/ui/separator";
import Notifications from "@/components/layout/header/notifications";
import UserMenu from "@/components/layout/header/user-menu";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { clients } from "@/lib/mock-data";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "",
  default: "Overview",
  clients: "Clients",
  documents: "Documents",
  apps: "Apps",
  calendar: "Calendar",
  chat: "Messages",
  pages: "",
  settings: "Settings",
  actions: "Actions",
  intake: "Intake",
  messages: "Messages",
  activity: "Activity",
  notes: "Notes",
  overview: "Overview",
};

function buildBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return [];
  const crumbs: { label: string; href?: string }[] = [];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    acc += `/${seg}`;
    if (seg === "dashboard") continue;
    // Resolve client id → client name
    if (parts[i - 1] === "clients" && /^[a-z0-9-]+$/i.test(seg) && seg !== "default") {
      const client = clients.find(c => c.id === seg);
      if (client) {
        crumbs.push({ label: client.fullName, href: acc });
        continue;
      }
    }
    const label = SECTION_LABELS[seg];
    if (label) {
      crumbs.push({ label, href: acc });
    }
  }
  return crumbs;
}

export function SiteHeader() {
  const { toggleSidebar, open } = useSidebar();
  const pathname = usePathname();

  // Ask Petal trigger moved from this header to the sidebar nav.
  // See `components/layout/sidebar/nav-main.tsx` for the new entry point.

  const crumbs = buildBreadcrumbs(pathname);

  return (
    <header className="bg-background sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <Button onClick={toggleSidebar} size="icon" variant="ghost">
          {open ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>

        {crumbs.length > 0 && (
          <nav className="ml-2 flex min-w-0 items-center gap-1 text-sm">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={`${c.href}-${i}`} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />}
                  {isLast || !c.href ? (
                    <span className="truncate text-foreground">{c.label}</span>
                  ) : (
                    <Link href={c.href} className="truncate text-muted-foreground hover:text-foreground transition-colors">
                      {c.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Notifications />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
