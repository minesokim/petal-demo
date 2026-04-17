import * as React from "react";

import { AppShell } from "@/components/v4/layout/app-shell";
import { Nav } from "@/components/v4/layout/nav";
import { Header } from "@/components/v4/layout/header";
import { StatusBar } from "@/components/v4/layout/status-bar";

/**
 * v4 route group layout.
 *
 * Lives alongside the old (auth) layout so v3 dashboard pages keep
 * rendering under the shadcn SidebarProvider. Any route under
 * (auth-v4)/ renders inside the new three-pane shell — triage in
 * Phase 2, client workspace in Phase 3.
 *
 * Header middle slot is empty in the layout; individual pages can
 * set their own breadcrumb/progress content by reaching into a
 * context or (simpler) by rendering the header themselves. Phase 1
 * just stands up the shell chrome.
 */
export default function AuthV4Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={<Header />}
      nav={<Nav basePath="/dashboard" />}
      status={<StatusBar />}>
      {children}
    </AppShell>
  );
}
