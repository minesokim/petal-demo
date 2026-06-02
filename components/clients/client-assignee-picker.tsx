"use client";

/**
 * ClientAssigneePicker — small dropdown that shows the current assignee
 * (avatar + name + role chip) and, for users with the right permission,
 * lets them reassign to a different firm member.
 *
 * Used in the client detail full-page header AND the popup dialog. Both
 * surfaces must stay in sync per CLAUDE.md.
 *
 * Mutation policy: the picker is presentation + behavior; the parent owns
 * the persisted assignment. For the demo this is local state (assignment
 * overrides), which mirrors how stage-overrides work elsewhere.
 */

import * as React from "react";
import { Check, ChevronDown, UserCircle2, UserCog } from "lucide-react";

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
import { cn } from "@/lib/utils";
import {
  FIRM,
  ROLE_LABEL,
  memberInitials,
  type FirmMember,
} from "@/lib/firm-mock-data";
import { useCanPerform, useSession } from "@/lib/session-context";

interface ClientAssigneePickerProps {
  /** Current assignee id (firm member id). Undefined = unassigned. */
  assigneeId: string | undefined;
  /** Called when the user picks a new assignee. Passing undefined unassigns. */
  onChange: (memberId: string | undefined) => void;
  /** Visual variant. `compact` is used in tight spaces (popup header rows);
   *  `default` is used on the full client page. */
  variant?: "default" | "compact";
  className?: string;
}

export function ClientAssigneePicker({
  assigneeId,
  onChange,
  variant = "default",
  className,
}: ClientAssigneePickerProps) {
  const { user } = useSession();
  // Reassigning a client requires the same permission as editing the client
  // (no separate "assign clients" permission yet — keep it tied to edit).
  const canReassign = useCanPerform("edit_clients");
  const assignee = assigneeId ? FIRM.members.find((m) => m.id === assigneeId) : undefined;
  const humans = FIRM.members.filter((m) => m.role !== "ai");

  // Read-only chip for non-editors
  if (!canReassign) {
    return <AssigneeChip member={assignee} variant={variant} className={className} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-md transition-colors",
            variant === "compact"
              ? "h-7 px-1.5 hover:bg-muted/50"
              : "h-8 px-2 hover:bg-muted/50",
            className
          )}
          title={assignee ? `Reassign — currently ${assignee.fullName}` : "Assign to a team member"}
        >
          <AssigneeChip member={assignee} variant={variant} bare />
          <ChevronDown
            className={cn(
              "shrink-0 text-muted-foreground/60 transition-transform group-data-[state=open]:rotate-180",
              variant === "compact" ? "size-3" : "size-3.5"
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-60">
        <DropdownMenuLabel className="flex items-center gap-1.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          <UserCog className="size-3" />
          Assign to
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-72 overflow-y-auto">
          {humans.map((m) => {
            const isMe = m.id === user.id;
            const isActive = m.id === assigneeId;
            return (
              <DropdownMenuItem
                key={m.id}
                onSelect={(e) => {
                  e.preventDefault();
                  onChange(m.id);
                }}
                className="flex items-center gap-2 py-1.5"
              >
                <Avatar className="size-7 shrink-0">
                  {m.avatar && <AvatarImage src={m.avatar} alt={m.fullName} />}
                  <AvatarFallback className="text-[10px] font-semibold">
                    {memberInitials(m)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium">{m.fullName}</span>
                    {isMe && (
                      <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                        You
                      </span>
                    )}
                  </div>
                  <span className="truncate text-[10.5px] text-muted-foreground">
                    {m.credential ? `${m.credential} · ` : ""}
                    {ROLE_LABEL[m.role]}
                  </span>
                </div>
                {isActive ? (
                  <Check className="size-3.5 shrink-0 text-foreground/70" />
                ) : (
                  <span className="w-3.5 shrink-0" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        {assigneeId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onChange(undefined);
              }}
              className="text-muted-foreground"
            >
              <UserCircle2 className="size-3.5" />
              Unassign
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AssigneeChip({
  member,
  variant,
  className,
  bare = false,
}: {
  member: FirmMember | undefined;
  variant: "default" | "compact";
  className?: string;
  bare?: boolean;
}) {
  const avatarSize = variant === "compact" ? "size-5" : "size-6";
  const fallbackText = variant === "compact" ? "text-[9px]" : "text-[10px]";
  const labelSize = variant === "compact" ? "text-[11.5px]" : "text-[12.5px]";

  if (!member) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-muted-foreground",
          labelSize,
          !bare && "px-1",
          className
        )}
      >
        <UserCircle2 className={cn("shrink-0", variant === "compact" ? "size-4" : "size-4")} />
        Unassigned
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5", !bare && "px-1", className)}>
      <Avatar className={cn(avatarSize, "shrink-0")}>
        {member.avatar && <AvatarImage src={member.avatar} alt={member.fullName} />}
        <AvatarFallback className={cn(fallbackText, "font-semibold")}>
          {memberInitials(member)}
        </AvatarFallback>
      </Avatar>
      <span className={cn("truncate font-medium text-foreground/80", labelSize)}>
        {member.shortName}
      </span>
    </span>
  );
}
