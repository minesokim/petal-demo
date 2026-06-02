"use client";

import { Bell } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { notifications, type Notification } from "./data";

const unreadCount = notifications.filter(n => n.unread_message).length;

const Notifications = () => {
  const isMobile = useIsMobile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="relative text-foreground/80 hover:text-foreground">
          <Bell className={cn("size-[17px]", unreadCount > 0 && "fill-current")} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isMobile ? "center" : "end"}
        sideOffset={8}
        className="flex max-h-[min(420px,72vh)] w-[336px] flex-col overflow-hidden rounded-xl p-0 shadow-lg"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-3.5 py-2">
          <span className="text-[13px] font-semibold tracking-tight">Notifications</span>
          {unreadCount > 0 && (
            <button className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground">
              Mark all read
            </button>
          )}
        </div>

        {/* Scrolling list */}
        <div className="min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto">
          {notifications.map((item: Notification) => (
            <button
              key={item.id}
              className={cn(
                "flex w-full gap-2.5 px-3.5 py-2 text-left transition-colors hover:bg-muted/60",
                item.unread_message && "bg-blue-50/40 dark:bg-blue-950/10"
              )}
            >
              <Avatar className="mt-0.5 size-7 shrink-0">
                <AvatarImage src={item.avatar} alt={item.title} />
                <AvatarFallback className="text-[10px]">{item.title.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("flex-1 truncate text-[13px]", item.unread_message ? "font-semibold" : "font-medium text-foreground/90")}>
                    {item.title}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/70">{item.date}</span>
                  {item.unread_message && <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{item.desc}</p>
                {item.type === "confirm" && (
                  <div className="mt-2">
                    <Button size="xs" className="h-6 px-2.5 text-[11px]">Sign as ERO</Button>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <button className="shrink-0 border-t bg-background py-2 text-center text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
          View all notifications
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
