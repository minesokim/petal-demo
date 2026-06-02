"use client";

/**
 * AssignIssueDialog — delegate a single triage issue to a teammate.
 *
 * Four fields, two required (assignee + due), two optional (note + approval
 * gate). See docs/TRIAGE_CAPABILITIES.md §"Assign sheet" for the rationale.
 *
 * Role-filtering: owners can assign to anyone; preparers can assign to peers
 * (no upward delegation to the owner). Petal (ai) is never an assignee.
 *
 * Mutation: writes to the session-only triage-issue-assignment-store. In
 * production this is a Convex mutation that also emits an activity event +
 * notifies the assignee.
 */

import * as React from "react";
import { Check, UserCog, CalendarClock, ShieldCheck } from "lucide-react";
import { format, addDays, nextFriday, parseISO } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  FIRM,
  ROLE_LABEL,
  memberInitials,
  type FirmMember,
} from "@/lib/firm-mock-data";
import { useSession } from "@/lib/session-context";
import { setIssueAssignment, getIssueAssignment } from "@/lib/triage-issue-assignment-store";
import { useToast } from "@/components/ui/toast-notification";
import type { TriageIssue } from "@/lib/triage-mock-data";

interface AssignIssueDialogProps {
  issue: TriageIssue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignIssueDialog({ issue, open, onOpenChange }: AssignIssueDialogProps) {
  const { user } = useSession();
  const { showToast } = useToast();

  // Who can this user delegate to?
  //  - owner → anyone (except Petal, except themselves)
  //  - preparer/others → peers (no upward delegation to the owner)
  const candidates = React.useMemo(() => {
    const humans = FIRM.members.filter((m) => m.role !== "ai" && m.id !== user.id && m.active);
    if (user.role === "owner") return humans;
    return humans.filter((m) => m.role !== "owner");
  }, [user.id, user.role]);

  const existing = getIssueAssignment(issue.id);

  // ── Field state ──────────────────────────────────────────────────
  const [assigneeId, setAssigneeId] = React.useState<string | undefined>(
    existing?.assigneeId
  );
  // Smart default for "due": +1 day at 5pm. Production would parse the
  // issue's needsResponseBy / deadline; for the demo +1 day is a sane anchor.
  const defaultDue = React.useMemo(() => {
    if (existing?.dueAt) return existing.dueAt.slice(0, 10);
    return format(addDays(new Date(), 1), "yyyy-MM-dd");
  }, [existing?.dueAt]);
  const [dueDate, setDueDate] = React.useState(defaultDue);
  const [note, setNote] = React.useState(existing?.note ?? issue.recommendation ?? "");
  const [approvalGate, setApprovalGate] = React.useState(
    existing?.approvalGate ?? Boolean(issue.recommendedReply)
  );

  // Reset state whenever a different issue opens.
  React.useEffect(() => {
    if (!open) return;
    const ex = getIssueAssignment(issue.id);
    setAssigneeId(ex?.assigneeId);
    setDueDate(ex?.dueAt ? ex.dueAt.slice(0, 10) : format(addDays(new Date(), 1), "yyyy-MM-dd"));
    setNote(ex?.note ?? issue.recommendation ?? "");
    setApprovalGate(ex?.approvalGate ?? Boolean(issue.recommendedReply));
  }, [open, issue.id, issue.recommendation, issue.recommendedReply]);

  const duePresets: { label: string; value: string }[] = [
    { label: "Today", value: format(new Date(), "yyyy-MM-dd") },
    { label: "Tomorrow", value: format(addDays(new Date(), 1), "yyyy-MM-dd") },
    { label: "Friday", value: format(nextFriday(new Date()), "yyyy-MM-dd") },
  ];

  const canSubmit = Boolean(assigneeId && dueDate);

  const submit = () => {
    if (!assigneeId || !dueDate) return;
    setIssueAssignment({
      issueId: issue.id,
      assigneeId,
      assignedBy: user.id,
      dueAt: new Date(`${dueDate}T17:00:00`).toISOString(),
      note: note.trim(),
      approvalGate,
    });
    const assignee = FIRM.members.find((m) => m.id === assigneeId);
    onOpenChange(false);
    showToast(
      "success",
      "Assigned",
      `${assignee?.shortName ?? "Teammate"} owns this · due ${format(parseISO(`${dueDate}T17:00:00`), "MMM d")}${approvalGate ? " · your approval required before send" : ""}.`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <UserCog className="size-4 text-muted-foreground" />
            Assign to a teammate
          </DialogTitle>
          <DialogDescription className="line-clamp-2 text-[12px]">
            {issue.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assignee */}
          <div>
            <label className="text-[11.5px] font-medium text-muted-foreground">Assignee</label>
            <div className="mt-1.5 grid gap-1">
              {candidates.length === 0 ? (
                <p className="rounded-md bg-muted/40 px-3 py-2 text-[12px] text-muted-foreground">
                  No teammates available to delegate to from your role.
                </p>
              ) : (
                candidates.map((m) => (
                  <AssigneeRow
                    key={m.id}
                    member={m}
                    selected={assigneeId === m.id}
                    onSelect={() => setAssigneeId(m.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Due */}
          <div>
            <label className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
              <CalendarClock className="size-3" />
              Due
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 rounded-md border bg-background px-2 text-[13px] outline-none focus:border-foreground/30"
              />
              <div className="flex items-center gap-1">
                {duePresets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setDueDate(p.value)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                      dueDate === p.value
                        ? "bg-foreground/[0.08] text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[11.5px] font-medium text-muted-foreground">
              Note to assignee
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Context for whoever picks this up…"
              className="mt-1.5 text-[13px]"
            />
          </div>

          {/* Approval gate */}
          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-foreground/60" />
              <div>
                <div className="text-[12.5px] font-medium">Require my approval before send</div>
                <p className="text-[11px] text-muted-foreground">
                  {issue.recommendedReply
                    ? "Assignee drafts, but routes back to you before anything goes to the client."
                    : "Assignee completes, but checks with you before marking done."}
                </p>
              </div>
            </div>
            <Switch checked={approvalGate} onCheckedChange={setApprovalGate} className="mt-0.5" />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {existing ? "Update assignment" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssigneeRow({
  member,
  selected,
  onSelect,
}: {
  member: FirmMember;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
        selected ? "bg-foreground/[0.06] ring-1 ring-inset ring-foreground/10" : "hover:bg-muted/50"
      )}
    >
      <Avatar className="size-7 shrink-0">
        {member.avatar && <AvatarImage src={member.avatar} alt={member.fullName} />}
        <AvatarFallback className="text-[10px] font-semibold">
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
      {selected && <Check className="size-3.5 shrink-0 text-foreground/70" />}
    </button>
  );
}
