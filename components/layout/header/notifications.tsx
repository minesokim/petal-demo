import { BellIcon, ClockIcon } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { notifications, type Notification } from "./data";

const unreadCount = notifications.filter(n => n.unread_message).length;

const Notifications = () => {
  const isMobile = useIsMobile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="relative">
          <BellIcon />
          {unreadCount > 0 && (
            <span className="bg-destructive absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white">{unreadCount}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={isMobile ? "center" : "end"} className="ms-4 w-80 p-0">
        <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="text-sm font-semibold">Notifications</div>
            <span className="text-[10px] text-muted-foreground">{unreadCount} unread</span>
          </div>
        </DropdownMenuLabel>

        <ScrollArea className="h-[380px]">
          {notifications.map((item: Notification) => (
            <DropdownMenuItem
              key={item.id}
              className="group flex cursor-pointer items-start gap-3 rounded-none border-b px-4 py-3 focus:bg-muted/50"
            >
              <Avatar className="size-8 shrink-0 mt-0.5">
                <AvatarImage src={item.avatar} alt={item.title} />
                <AvatarFallback className="text-[10px]">{item.title.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[13px] leading-tight ${item.unread_message ? "font-semibold" : "font-medium"}`}>
                    {item.title}
                  </span>
                  {item.unread_message && (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
                {item.type === "confirm" && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="xs">Sign as ERO</Button>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 pt-0.5">
                  <ClockIcon className="size-2.5" />
                  {item.date}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
