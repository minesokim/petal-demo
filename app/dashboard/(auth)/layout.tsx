import React from "react";
import { cookies } from "next/headers";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { AuthLayoutClient } from "@/components/auth-layout-client";

export default async function AuthLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen =
    cookieStore.get("sidebar_state")?.value === "true" ||
    cookieStore.get("sidebar_state") === undefined;

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 14)",
          "--content-padding": "calc(var(--spacing) * 4)",
          "--content-margin": "calc(var(--spacing) * 1.5)",
          "--content-full-height":
            "calc(100vh - var(--header-height) - (var(--content-padding) * 2) - (var(--content-margin) * 2))"
        } as React.CSSProperties
      }>
      <AppSidebar variant="inset" />
      <AuthLayoutClient>{children}</AuthLayoutClient>
    </SidebarProvider>
  );
}
