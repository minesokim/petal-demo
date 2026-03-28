"use client";

import React from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/layout/header";
import { AIPanelProvider, AIPanel, useAIPanel } from "@/components/ai-panel";

function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useAIPanel();
  return (
    <SidebarInset
      className="transition-[margin] duration-300 ease-in-out"
      style={{ marginRight: isOpen ? 440 : 0 }}
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
  return (
    <AIPanelProvider>
      <MainContent>{children}</MainContent>
      <AIPanel />
    </AIPanelProvider>
  );
}
