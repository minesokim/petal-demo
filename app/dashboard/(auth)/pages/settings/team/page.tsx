"use client";

/**
 * Team settings — list firm members, manage roles, invite new members.
 *
 * Role-gated: only owners can change roles or invite. Non-owners see the
 * read-only roster + their own membership row highlighted.
 *
 * Petal (the AI) is shown in a dedicated card below the human roster — she
 * counts as a team member in capacity views and activity attribution but her
 * role cannot be changed.
 */

import * as React from "react";
import Link from "next/link";
import {
  CircleDot,
  Mail,
  MoreHorizontal,
  Plus,
  Shield,
  ShieldOff,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast-notification";
import { cn } from "@/lib/utils";
import { useSession, useCanPerform } from "@/lib/session-context";
import {
  ASSIGNABLE_ROLES,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  ROLE_TINT,
  memberInitials,
  type FirmMember,
  type FirmRole,
} from "@/lib/firm-mock-data";
import { RoleBadge } from "@/components/user-switcher";

export default function TeamSettingsPage() {
  const { user, firm } = useSession();
  const canManage = useCanPerform("manage_team");
  const { showToast } = useToast();

  // Local-only mutations for the mock (firm-mock-data is read-only at runtime).
  // In production these go through Convex; for now we mirror the shape so the
  // UI feels real and the demo can flip a role and see the role-gated UI react.
  const [members, setMembers] = React.useState<FirmMember[]>(firm.members);
  const [showInvite, setShowInvite] = React.useState(false);

  // Keep local state in sync if the upstream firm changes (e.g., persona switch
  // — switcher doesn't mutate the firm but useEffect is the safe default).
  React.useEffect(() => {
    setMembers(firm.members);
  }, [firm.members]);

  const humans = members.filter((m) => m.role !== "ai");
  const petal = members.find((m) => m.role === "ai");
  const activeHumans = humans.filter((m) => m.active).length;
  const inactiveHumans = humans.filter((m) => !m.active).length;

  const changeRole = (memberId: string, nextRole: FirmRole) => {
    if (!canManage) return;
    if (memberId === user.id && nextRole !== "owner") {
      showToast(
        "warning",
        "You can't demote yourself",
        "Transfer ownership to another member first."
      );
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: nextRole } : m))
    );
    const target = members.find((m) => m.id === memberId);
    showToast(
      "success",
      "Role updated",
      `${target?.shortName ?? "Member"} is now ${ROLE_LABEL[nextRole]}.`
    );
  };

  const toggleActive = (memberId: string) => {
    if (!canManage) return;
    if (memberId === user.id) {
      showToast("warning", "You can't deactivate yourself");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, active: !m.active } : m))
    );
  };

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Team</h3>
            <p className="text-sm text-muted-foreground">
              People who can access {firm.name}. Roles control what each
              member can see and do.
            </p>
          </div>
          {canManage && (
            <Dialog open={showInvite} onOpenChange={setShowInvite}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="size-3.5" />
                  Invite member
                </Button>
              </DialogTrigger>
              <InviteDialog onClose={() => setShowInvite(false)} />
            </Dialog>
          )}
        </div>

        {/* Read-only banner for non-owners */}
        {!canManage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200/70 bg-amber-50/60 px-3 py-2.5 text-[12.5px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <ShieldOff className="mt-0.5 size-3.5 shrink-0" />
            <div>
              <div className="font-medium">View only</div>
              <p className="text-amber-900/80 dark:text-amber-200/70">
                Only the firm owner can change roles or invite new members.
                Ask {firm.members.find((m) => m.role === "owner")?.fullName ?? "the owner"} if you need a change.
              </p>
            </div>
          </div>
        )}

        {/* Roster summary line */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CircleDot className="size-3 text-emerald-500" />
            {activeHumans} active
          </span>
          {inactiveHumans > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <CircleDot className="size-3 text-stone-400" />
              {inactiveHumans} inactive
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3 text-violet-500" />
            Petal AI included
          </span>
        </div>

        {/* Human members */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Members</CardTitle>
            <CardDescription className="text-[12px]">
              Click a member's role to change it. Inactive members keep
              historical attribution but lose access.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {humans.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isMe={m.id === user.id}
                  canManage={canManage}
                  onRoleChange={(r) => changeRole(m.id, r)}
                  onToggleActive={() => toggleActive(m.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Petal — separate card to set her apart from humans */}
        {petal && (
          <Card className="border-violet-200/60 bg-violet-50/30 dark:border-violet-900/30 dark:bg-violet-950/10">
            <CardContent className="flex items-center gap-3 py-4">
              <Avatar className="size-9 ring-2 ring-violet-200/60 dark:ring-violet-900/40">
                {petal.avatar && <AvatarImage src={petal.avatar} alt={petal.fullName} />}
                <AvatarFallback className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                  {memberInitials(petal)}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-semibold">{petal.fullName}</span>
                  <RoleBadge role="ai" />
                </div>
                <span className="truncate text-[11.5px] text-muted-foreground">
                  {ROLE_DESCRIPTION.ai}
                </span>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/pages/settings/ai">Configure</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Role legend — collapsible help */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Role permissions</CardTitle>
            <CardDescription className="text-[12px]">
              What each role can do. Roles are firm-wide; per-client assignment
              is enforced separately.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-[12.5px]">
              {ASSIGNABLE_ROLES.map((r) => (
                <div key={r} className="flex items-start gap-3 px-4 py-2.5">
                  <RoleBadge role={r} className="mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{ROLE_DESCRIPTION[r]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Member row
// ─────────────────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isMe,
  canManage,
  onRoleChange,
  onToggleActive,
}: {
  member: FirmMember;
  isMe: boolean;
  canManage: boolean;
  onRoleChange: (role: FirmRole) => void;
  onToggleActive: () => void;
}) {
  const initials = memberInitials(member);

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3", !member.active && "opacity-60")}>
      <Avatar className="size-9 shrink-0">
        {member.avatar && <AvatarImage src={member.avatar} alt={member.fullName} />}
        <AvatarFallback className="text-[11px] font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] font-semibold">{member.fullName}</span>
          {member.credential && (
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              {member.credential}
            </span>
          )}
          {isMe && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              You
            </span>
          )}
          {!member.active && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Inactive
            </span>
          )}
        </div>
        <span className="truncate text-[11.5px] text-muted-foreground">{member.email}</span>
      </div>

      {/* Capacity hint */}
      {typeof member.returnsThisSeason === "number" && (
        <div className="hidden text-right md:block">
          <div className="font-display text-[13px] tabular-nums">{member.returnsThisSeason}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Returns</div>
        </div>
      )}

      {/* Role chip — clickable when manageable */}
      {canManage ? (
        <Select
          value={member.role === "ai" ? undefined : member.role}
          onValueChange={(v) => onRoleChange(v as FirmRole)}
          disabled={member.role === "ai"}
        >
          <SelectTrigger
            className={cn(
              "h-7 w-auto min-w-[120px] gap-1 border-none px-2 py-0 text-[10.5px] font-semibold uppercase tracking-wider ring-1",
              ROLE_TINT[member.role]
            )}
          >
            <SelectValue placeholder={ROLE_LABEL[member.role]} />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ROLE_LABEL[r]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <RoleBadge role={member.role} />
      )}

      {/* Row menu */}
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-7">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuLabel className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              {member.fullName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Mail className="size-3.5" />
                Resend invite
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleActive}>
                {member.active ? <ShieldOff className="size-3.5" /> : <Shield className="size-3.5" />}
                {member.active ? "Deactivate" : "Reactivate"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Invite dialog (UI-only stub — wires to Convex later)
// ─────────────────────────────────────────────────────────────────────────

function InviteDialog({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<FirmRole>("preparer");
  const [pending, setPending] = React.useState(false);

  const submit = () => {
    if (!email.trim()) return;
    setPending(true);
    setTimeout(() => {
      setPending(false);
      onClose();
      showToast(
        "sent",
        "Invite sent",
        `${email} will get an email with a link to join as ${ROLE_LABEL[role]}.`
      );
      setEmail("");
      setRole("preparer");
    }, 400);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Invite a team member</DialogTitle>
        <DialogDescription>
          They'll get an email to set a password and join the firm.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <label className="text-[11.5px] font-medium text-muted-foreground">Email</label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
            autoFocus
          />
        </div>
        <div>
          <label className="text-[11.5px] font-medium text-muted-foreground">Role</label>
          <Select value={role} onValueChange={(v) => setRole(v as FirmRole)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{ROLE_LABEL[r]}</span>
                    <span className="text-[11px] text-muted-foreground">{ROLE_DESCRIPTION[r]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!email.trim() || pending}>
          {pending ? "Sending..." : "Send invite"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
