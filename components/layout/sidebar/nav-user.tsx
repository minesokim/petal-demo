"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { BellIcon, LogOutIcon, SettingsIcon } from "lucide-react";
import { DotsVerticalIcon } from "@radix-ui/react-icons";
import Link from "next/link";

import { useSession } from "@/lib/session-context";
import { memberInitials } from "@/lib/firm-mock-data";
import { RoleBadge, UserSwitcherMenuBlock } from "@/components/user-switcher";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user } = useSession();
  const initials = memberInitials(user);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="rounded-full">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-medium">{user.fullName}</span>
                  {user.credential && (
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {user.credential}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
              </div>
              <DotsVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium">{user.fullName}</span>
                    {user.credential && (
                      <span className="shrink-0 text-[10.5px] font-medium text-muted-foreground">
                        {user.credential}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground truncate text-[11px]">{user.email}</span>
                </div>
                <RoleBadge role={user.role} className="shrink-0" />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/pages/settings/profile">
                  <SettingsIcon />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <UserSwitcherMenuBlock />
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
