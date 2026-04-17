"use client";

import * as React from "react";

import { AppShell } from "@/components/v4/layout/app-shell";
import { Nav } from "@/components/v4/layout/nav";
import { Header } from "@/components/v4/layout/header";
import { StatusBar } from "@/components/v4/layout/status-bar";
import { ShellProvider, useShell } from "@/components/v4/layout/shell-context";

/**
 * v4 route group layout.
 *
 * Wraps all (auth-v4)/* pages with the three-pane AppShell and a ShellProvider
 * so individual pages can inject content into the Header middle slot and the
 * StatusBar return hint (see components/v4/layout/shell-context.tsx).
 *
 * Old (auth)/layout.tsx is untouched — v3 pages keep their shadcn sidebar.
 */
export default function AuthV4Layout({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <ShellInner>{children}</ShellInner>
    </ShellProvider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { headerContent, returnHint } = useShell();

  return (
    <AppShell
      header={<Header>{headerContent}</Header>}
      nav={<Nav basePath="/dashboard" />}
      status={<StatusBar returnHint={returnHint} />}>
      {children}
    </AppShell>
  );
}
