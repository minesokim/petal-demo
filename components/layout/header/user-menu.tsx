"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

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
import { useSession } from "@/lib/session-context";
import { memberInitials } from "@/lib/firm-mock-data";
import { RoleBadge, UserSwitcherMenuBlock } from "@/components/user-switcher";

export default function UserMenu() {
  const { user } = useSession();
  const initials = memberInitials(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          {user.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
          <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-64" align="end">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-8">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-semibold">{user.fullName}</span>
                {user.credential && (
                  <span className="shrink-0 text-[10.5px] font-medium text-muted-foreground">
                    {user.credential}
                  </span>
                )}
              </div>
              <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
            </div>
            <RoleBadge role={user.role} className="shrink-0" />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/pages/settings/profile">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <UserSwitcherMenuBlock />
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
