"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/layout/header";
import { PetalCommandPalette } from "@/components/petal-command-palette";
import { AIPanel, useAIPanel, useAIPanelAsk } from "@/components/ai-panel";
import { ToastProvider } from "@/components/ui/toast-notification";

function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen, isFullPage } = useAIPanel();
  return (
    <SidebarInset
      className="transition-[margin,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{
        marginRight: isOpen && !isFullPage ? 440 : 0,
        opacity: isFullPage ? 0 : 1,
        pointerEvents: isFullPage ? "none" : "auto",
      }}
    >
      <SiteHeader />
      <div className="bg-muted/40 flex flex-1 flex-col">
        <div className="@container/main p-(--content-padding) xl:group-data-[theme-content-layout=centered]/layout:container xl:group-data-[theme-content-layout=centered]/layout:mx-auto">
          {children}
        </div>
      </div>
    </SidebarInset>
  );
}

export function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  // AIPanelProvider is hoisted to (auth)/layout.tsx so it also wraps the sidebar.
  // SessionProvider is also hoisted to (auth)/layout.tsx so the sidebar nav-user
  // can read it.
  return (
    <ToastProvider>
      <MainContent>{children}</MainContent>
      <AIPanel />
      <PetalCommandPalette />
    </ToastProvider>
  );
}
