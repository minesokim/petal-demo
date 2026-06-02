"use client";

/**
 * TriageIssueMenu — the 3-dot overflow menu on the triage detail header.
 *
 * Eight actions, role-gated:
 *   1. Assign to teammate…     (owner + preparer)   → AssignIssueDialog
 *   2. Reassign whole client…  (owner only)         → member submenu
 *   3. Snooze until…           (all)                → date popover → onSnooze
 *   4. Bump priority           (owner + preparer)   → tier submenu → store
 *   5. Convert to flag         (all)                → onConvertToFlag
 *   6. Copy link               (all)                → clipboard
 *   7. View history            (all)                → HistoryDialog
 *   8. Report to Petal…        (all)                → ReportDialog
 *
 * Self-contained: handles assign / reassign / bump / copy / history / report
 * via stores + dialogs internally. Snooze + convert-to-flag dispatch through
 * the parent (they live in the page's session buckets).
 */

import * as React from "react";
import {
  MoreHorizontal,
  UserCog,
  Users,
  Clock,
  ChevronUp,
  Bookmark,
  Link2,
  History,
  Flag,
  Check,
} from "lucide-react";
import { format, addDays, nextMonday } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-notification";
import { useSession } from "@/lib/session-context";
import {
  FIRM,
  ROLE_LABEL,
  memberInitials,
} from "@/lib/firm-mock-data";
import { setAssigneeOverride } from "@/lib/client-assignment-store";
import { setTierOverride } from "@/lib/triage-tier-override-store";
import {
  deriveTimeline,
  TRIAGE_TIERS,
  type TriageIssue,
  type TriageTier,
} from "@/lib/triage-mock-data";
import { AssignIssueDialog } from "@/components/triage/assign-issue-dialog";

interface TriageIssueMenuProps {
  issue: TriageIssue;
  /** Dispatch to the snoozed bucket (date is cosmetic for the demo). */
  onSnooze: () => void;
  /** Quick-flag: bookmark + move to Flagged bucket without the inline form. */
  onConvertToFlag: () => void;
}

const REPORT_REASONS = [
  { id: "wrong_client", label: "Wrong client" },
  { id: "duplicate", label: "Duplicate of another issue" },
  { id: "not_actionable", label: "Not actionable / noise" },
  { id: "misclassified", label: "Wrong category" },
  { id: "resolved_elsewhere", label: "Already handled elsewhere" },
] as const;

export function TriageIssueMenu({ issue, onSnooze, onConvertToFlag }: TriageIssueMenuProps) {
  const { user } = useSession();
  const { showToast } = useToast();

  const canAssign = user.role === "owner" || user.role === "preparer";
  const canReassignClient = user.role === "owner";
  const canBumpPriority = user.role === "owner" || user.role === "preparer";

  const [assignOpen, setAssignOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const humans = FIRM.members.filter((m) => m.role !== "ai" && m.active);

  const handleReassignClient = (memberId: string) => {
    setAssigneeOverride(issue.clientId, memberId);
    const m = FIRM.members.find((x) => x.id === memberId);
    showToast(
      "success",
      "Client reassigned",
      `${issue.clientName}'s entire book now belongs to ${m?.shortName ?? "the new preparer"}.`
    );
  };

  const handleBump = (tier: TriageTier) => {
    setTierOverride(issue.id, tier);
    const label = TRIAGE_TIERS.find((t) => t.key === tier)?.label ?? tier;
    showToast("success", "Priority changed", `Moved to "${label}".`);
  };

  const handleSnoozeUntil = (label: string) => {
    onSnooze();
    showToast("success", `Snoozed until ${label}`, issue.clientName);
  };

  const handleCopyLink = () => {
    const url = `${typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}#${issue.id}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    showToast("success", "Link copied", "Paste into Slack, email, or a note.");
  };

  const snoozePresets: { label: string; full: string }[] = [
    { label: "tomorrow", full: format(addDays(new Date(), 1), "EEE, MMM d") },
    { label: "Monday", full: format(nextMonday(new Date()), "EEE, MMM d") },
    { label: "in a week", full: format(addDays(new Date(), 7), "EEE, MMM d") },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="More"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          {/* ── Delegation group ── */}
          {(canAssign || canReassignClient) && (
            <>
              <DropdownMenuGroup>
                {canAssign && (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setAssignOpen(true);
                    }}
                  >
                    <UserCog className="size-3.5" />
                    Assign to teammate…
                  </DropdownMenuItem>
                )}
                {canReassignClient && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Users className="size-3.5" />
                      Reassign whole client
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="min-w-56">
                        <DropdownMenuLabel className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {issue.clientName} → preparer
                        </DropdownMenuLabel>
                        {humans.map((m) => (
                          <DropdownMenuItem
                            key={m.id}
                            onSelect={(e) => {
                              e.preventDefault();
                              handleReassignClient(m.id);
                            }}
                            className="gap-2"
                          >
                            <Avatar className="size-5 shrink-0">
                              {m.avatar && <AvatarImage src={m.avatar} alt={m.fullName} />}
                              <AvatarFallback className="text-[8px] font-semibold">
                                {memberInitials(m)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex-1 truncate text-[13px]">{m.fullName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {ROLE_LABEL[m.role]}
                            </span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}

          {/* ── Triage state group ── */}
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Clock className="size-3.5" />
                Snooze until…
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {snoozePresets.map((p) => (
                    <DropdownMenuItem
                      key={p.label}
                      onSelect={(e) => {
                        e.preventDefault();
                        handleSnoozeUntil(p.label);
                      }}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="capitalize">{p.label}</span>
                      <span className="text-[10.5px] tabular-nums text-muted-foreground">{p.full}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            {canBumpPriority && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ChevronUp className="size-3.5" />
                  Bump priority
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {TRIAGE_TIERS.map((t) => (
                      <DropdownMenuItem
                        key={t.key}
                        onSelect={(e) => {
                          e.preventDefault();
                          handleBump(t.key);
                        }}
                        className="flex items-center gap-2"
                      >
                        <span className={cn("size-1.5 rounded-full", t.dot)} />
                        <span className="flex-1">{t.label}</span>
                        {issue.tier === t.key && <Check className="size-3.5 text-foreground/60" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onConvertToFlag();
              }}
            >
              <Bookmark className="size-3.5" />
              Convert to flag
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {/* ── Utility group ── */}
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCopyLink(); }}>
              <Link2 className="size-3.5" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setHistoryOpen(true);
              }}
            >
              <History className="size-3.5" />
              View history
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setReportOpen(true);
              }}
            >
              <Flag className="size-3.5" />
              Report to Petal…
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <AssignIssueDialog issue={issue} open={assignOpen} onOpenChange={setAssignOpen} />
      <HistoryDialog issue={issue} open={historyOpen} onOpenChange={setHistoryOpen} />
      <ReportDialog issue={issue} open={reportOpen} onOpenChange={setReportOpen} />
    </>
  );
}

// ── History dialog — renders the issue's derived timeline ──────────────
function HistoryDialog({
  issue,
  open,
  onOpenChange,
}: {
  issue: TriageIssue;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const timeline = React.useMemo(() => (open ? deriveTimeline(issue) : []), [open, issue]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <History className="size-4 text-muted-foreground" />
            Issue history
          </DialogTitle>
          <DialogDescription className="line-clamp-2 text-[12px]">{issue.title}</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {timeline.map((ev, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1 size-2 shrink-0 rounded-full",
                    ev.status === "done"
                      ? "bg-emerald-500"
                      : ev.status === "current"
                        ? "bg-blue-500"
                        : "bg-foreground/20"
                  )}
                />
                {i < timeline.length - 1 && <span className="my-0.5 w-px flex-1 bg-border" />}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <div className="text-[12.5px] font-medium leading-snug">{ev.event}</div>
                <div className="mt-0.5 text-[10.5px] tabular-nums text-muted-foreground/70">
                  {ev.date}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

// ── Report-to-Petal dialog — feedback loop for misclassified issues ────
function ReportDialog({
  issue,
  open,
  onOpenChange,
}: {
  issue: TriageIssue;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { showToast } = useToast();
  const [reason, setReason] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setReason(null);
      setDetail("");
    }
  }, [open]);

  const submit = () => {
    if (!reason) return;
    onOpenChange(false);
    showToast(
      "success",
      "Reported to Petal",
      "Thanks — Petal uses this to tune what surfaces in triage."
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px]">
            <Flag className="size-4 text-muted-foreground" />
            Report to Petal
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Tell Petal why this shouldn&apos;t have surfaced. Improves the classifier.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReason(r.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors",
                reason === r.id
                  ? "bg-foreground/[0.06] ring-1 ring-inset ring-foreground/10"
                  : "hover:bg-muted/50"
              )}
            >
              {r.label}
              {reason === r.id && <Check className="size-3.5 text-foreground/60" />}
            </button>
          ))}
        </div>
        <Textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={2}
          placeholder="Anything else? (optional)"
          className="text-[13px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!reason}>
            Send feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
