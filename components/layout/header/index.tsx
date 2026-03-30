"use client";

import { PanelLeftClose, PanelLeftOpen, MessageSquareTextIcon } from "lucide-react";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import Notifications from "@/components/layout/header/notifications";
import { DocketCommand } from "@/components/docket-command";
import UserMenu from "@/components/layout/header/user-menu";
// theme customizer removed
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useAIPanel } from "@/components/ai-panel";

export function SiteHeader() {
  const { toggleSidebar, open } = useSidebar();
  let aiPanel: { isOpen: boolean; toggle: () => void } = { isOpen: false, toggle: () => {} };
  try { aiPanel = useAIPanel(); } catch {}

  return (
    <header className="bg-background/40 sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center gap-2 border-b backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:rounded-tl-xl md:rounded-tr-xl">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <Button onClick={toggleSidebar} size="icon" variant="ghost">
          {open ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="max-w-sm flex-1">
          <DocketCommand />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={aiPanel.toggle}
            size="sm"
            variant={aiPanel.isOpen ? "default" : "outline"}
            className="gap-1.5 border-white/20 bg-white/40 backdrop-blur-md hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10 data-[variant=default]:border-transparent data-[variant=default]:bg-primary data-[variant=default]:text-primary-foreground"
          >
            <MessageSquareTextIcon className="size-3.5" />
            <span className="hidden lg:inline">Ask Docket</span>
          </Button>
          <Notifications />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
