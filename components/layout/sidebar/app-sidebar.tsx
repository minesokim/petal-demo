"use client";

import * as React from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useIsTablet } from "@/hooks/use-mobile";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const isTablet = useIsTablet();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname]);

  useEffect(() => {
    setOpen(!isTablet);
  }, [isTablet]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:text-foreground h-10 group-data-[collapsible=icon]:px-0!" asChild>
              <div>
                <span className="text-foreground text-lg font-bold tracking-tight group-data-[collapsible=icon]:text-sm">
                  Vazant<span className="text-muted-foreground font-normal group-data-[collapsible=icon]:hidden">.</span>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        {/* Tax season countdown */}
        <Card className="gap-3 overflow-hidden py-3 group-data-[collapsible=icon]:hidden">
          <CardHeader className="px-3 py-0">
            <CardTitle className="text-sm">Filing Deadline</CardTitle>
            <CardDescription>
              18 days until April 15. 3 of 20 returns filed.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 py-0">
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div className="bg-primary h-full rounded-full" style={{ width: "44%" }} />
            </div>
          </CardContent>
        </Card>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
