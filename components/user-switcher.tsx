"use client";

/**
 * UserSwitcher — demo-only persona flipper.
 *
 * In a real product the signed-in user is fixed (auth session). Petal's demo
 * needs to show how the UI changes per role (owner vs preparer vs junior vs
 * bookkeeper vs reviewer), so we surface a switcher that lets a stakeholder
 * flip personas in-place.
 *
 * Rendered inside the header user-menu and the sidebar nav-user dropdowns.
 * Reads/writes the active user via SessionContext.
 */

import * as React from "react";
import { Check, UserCog } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/session-context";
import {
  ROLE_LABEL,
  ROLE_TINT,
  memberInitials,
  type FirmMember,
} from "@/lib/firm-mock-data";
import { cn } from "@/lib/utils";

/** Compact role badge — picks a tint per role family. */
function RoleBadge({ role, className }: { role: FirmMember["role"]; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ring-1",
        ROLE_TINT[role],
        className
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}

/** A single switcher row. */
function MemberRow({ member, active, onPick }: {
  member: FirmMember;
  active: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        onPick(member.id);
      }}
      className="flex items-center gap-2 py-1.5"
    >
      <Avatar className="size-7 shrink-0">
        {member.avatar && <AvatarImage src={member.avatar} alt={member.fullName} />}
        <AvatarFallback className="rounded-lg text-[10px] font-semibold">
          {memberInitials(member)}
        </AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 leading-tight">
        <span className="truncate text-[13px] font-medium">{member.fullName}</span>
        <span className="truncate text-[10.5px] text-muted-foreground">
          {member.credential ? `${member.credential} · ` : ""}
          {ROLE_LABEL[member.role]}
        </span>
      </div>
      {active ? (
        <Check className="size-3.5 shrink-0 text-foreground/70" aria-label="Active user" />
      ) : (
        <span className="w-3.5 shrink-0" aria-hidden="true" />
      )}
    </DropdownMenuItem>
  );
}

/** The switcher block — drop this inside a DropdownMenuContent. */
export function UserSwitcherMenuBlock() {
  const { user, firm, setUserId } = useSession();
  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="flex items-center justify-between gap-2 py-1">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Switch persona
        </span>
        <span
          className="inline-flex items-center gap-1 text-[9.5px] font-medium text-muted-foreground/70"
          title="Demo only — flip personas to preview role-gated UI"
        >
          <UserCog className="size-3" />
          Demo
        </span>
      </DropdownMenuLabel>
      <DropdownMenuGroup className="max-h-72 overflow-y-auto">
        {firm.members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            active={m.id === user.id}
            onPick={setUserId}
          />
        ))}
      </DropdownMenuGroup>
    </>
  );
}

export { RoleBadge };
