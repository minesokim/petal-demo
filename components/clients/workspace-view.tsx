"use client";

/**
 * WorkspaceView — the merged Overview + Engagement surface.
 *
 * Replaces the old scroll-spy-essay engagement view. Layout:
 *   LEFT  — sticky stage spine (status backbone + jump nav). All pipeline
 *           stages shown; current highlighted, past filled, future outlined.
 *           Click a stage to focus it; defaults to the client's current stage.
 *   RIGHT — action-first content for the focused stage:
 *           1. Next action (StageActionCard)
 *           2. Petal's read — ONE tight line, not essays
 *           3. Open flags
 *           4. At a glance (filing · tier · docs · deadline · assignee)
 *           5. Billing snapshot
 *
 * Shared by the client popup dialog and the full client page so the two
 * stay in sync (per CLAUDE.md). Stage-action handlers are passed in so the
 * parent owns the real dialogs (ERO signing, prep workspace, etc.).
 */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import {
  type Client,
  type ReturnStage,
  stageLabels,
} from "@/lib/mock-data";
import { StageActionCard, getStageActionDescriptor } from "@/components/stage-action-card";
import { OpenItemsSection } from "@/components/issues/open-items-section";
import { BillingCard } from "@/components/billing/billing-card";
import { FIRM, memberInitials } from "@/lib/firm-mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffectiveAssignee } from "@/lib/client-assignment-store";

// The linear pipeline shown in the spine. `extended` is a branch off the
// tail, surfaced as a state on the final node rather than its own step.
const SPINE_STAGES: ReturnStage[] = [
  "new_intake",
  "collecting_docs",
  "ready_to_prep",
  "in_preparation",
  "client_review",
  "pay_and_sign",
  "filed",
];

interface WorkspaceViewProps {
  client: Client;
  variant?: "popup" | "full";
  /** Live stage (override store result) — falls back to client.returnStage. */
  effectiveStage?: ReturnStage;
  /** Stage-action handlers — parent owns the real dialogs. */
  onSignEFile?: () => void;
  onBeginPrep?: () => void;
  onCompletePrep?: () => void;
  /** Extra flag items merged into the OpenItemsSection. */
  flaggedItems?: React.ComponentProps<typeof OpenItemsSection>["additionalItems"];
}

/** One-line Petal read per stage, derived from the client's actual data. */
function petalRead(client: Client, stage: ReturnStage): string {
  const missing = Math.max(0, client.documentsRequired - client.documentsSubmitted);
  switch (stage) {
    case "new_intake":
      return client.depositPaid
        ? "Intake complete and deposit in. Ready for you to accept and assign a tier."
        : "Intake submitted but the deposit hasn't landed — I'd confirm before starting work.";
    case "collecting_docs":
      return missing > 0
        ? `Still waiting on ${missing} document${missing === 1 ? "" : "s"}. I've nudged the client; say the word and I'll escalate to a call.`
        : "All documents are in. I can move this to Ready to Prep whenever you are.";
    case "ready_to_prep":
      return "Everything's staged. I've pre-imported the docs and prior-year basis — ready when you are.";
    case "in_preparation":
      return "Prep is underway. I'm running diagnostics in the background and will flag anything that looks off.";
    case "client_review":
      return "Return's with the client for review. I'm tracking opens — I'll nudge if they go quiet.";
    case "pay_and_sign":
      return "Awaiting the 8879 signature. Once it's in, I'll prep the e-file and the defense package.";
    case "filed":
      return "Filed and accepted. The defense package is archived and the engagement is closed out.";
    case "extended":
      return "On extension. I'm tracking the extended deadline and will resurface this well before it.";
    default:
      return "I'm watching this client and will surface anything that needs your call.";
  }
}

/** Short status line per spine node, based on done/current/future + data. */
function spineStatus(client: Client, stage: ReturnStage, state: "done" | "current" | "future"): string {
  if (stage === "collecting_docs") {
    return `${client.documentsSubmitted}/${client.documentsRequired} docs`;
  }
  if (state === "done") return "Done";
  if (state === "future") return "";
  // current
  switch (stage) {
    case "new_intake":
      return client.depositPaid ? "Ready to accept" : "Deposit pending";
    case "ready_to_prep":
      return "Staged";
    case "in_preparation":
      return "In progress";
    case "client_review":
      return "Sent";
    case "pay_and_sign":
      return "Awaiting signature";
    case "filed":
      return "Filed";
    default:
      return "";
  }
}

export function WorkspaceView({
  client,
  variant = "full",
  effectiveStage,
  onSignEFile,
  onBeginPrep,
  onCompletePrep,
  flaggedItems,
}: WorkspaceViewProps) {
  const currentStage: ReturnStage = effectiveStage ?? client.returnStage;
  const isCompact = variant === "popup";

  // The spine index of the client's current stage. `extended` and `filed`
  // both land on the final node.
  const normalizedCurrent: ReturnStage =
    currentStage === "extended" ? "filed" : currentStage;
  const currentIdx = Math.max(0, SPINE_STAGES.indexOf(normalizedCurrent));

  // Which stage is the user focused on (jump-nav). Defaults to current.
  const [focusedStage, setFocusedStage] = React.useState<ReturnStage>(normalizedCurrent);
  React.useEffect(() => {
    setFocusedStage(normalizedCurrent);
  }, [normalizedCurrent]);

  const focusedIdx = SPINE_STAGES.indexOf(focusedStage);
  const isPeeking = focusedStage !== normalizedCurrent;

  const assigneeId = useEffectiveAssignee(client.id, client.assignedTo);
  const assignee = assigneeId ? FIRM.members.find((m) => m.id === assigneeId) : undefined;

  // Stage-action descriptor for the focused stage (defaults to current).
  const stageAction = getStageActionDescriptor({
    stage: focusedStage,
    client,
    onSignEFile: onSignEFile ?? (() => {}),
    onBeginPrep: onBeginPrep ?? (() => {}),
    onCompletePrep: onCompletePrep ?? (() => {}),
  });

  const docsPct = client.documentsRequired
    ? Math.round((client.documentsSubmitted / client.documentsRequired) * 100)
    : 0;

  return (
    <div
      className={cn(
        "grid gap-6",
        isCompact ? "md:grid-cols-[180px_1fr] md:gap-7" : "md:grid-cols-[210px_1fr] md:gap-8"
      )}
    >
      {/* ── LEFT: Stage spine (sticky status backbone + jump nav) ── */}
      <aside className="md:sticky md:top-2 md:self-start">
        <div className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
          Engagement
        </div>
        <ol className="relative">
          {SPINE_STAGES.map((stage, i) => {
            const state: "done" | "current" | "future" =
              i < currentIdx ? "done" : i === currentIdx ? "current" : "future";
            const isFocused = i === focusedIdx;
            const status = spineStatus(client, stage, state);
            const isLast = i === SPINE_STAGES.length - 1;
            // You can look BACK at completed stages and at the current one,
            // but not jump FORWARD into work that hasn't happened yet.
            const isInteractive = state !== "future";
            return (
              <li key={stage} className="relative">
                {/* Connector line */}
                {!isLast && (
                  <span
                    className={cn(
                      "absolute left-[10px] top-[22px] h-[calc(100%-10px)] w-px",
                      i < currentIdx ? "bg-foreground/25" : "bg-border"
                    )}
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  onClick={isInteractive ? () => setFocusedStage(stage) : undefined}
                  disabled={!isInteractive}
                  aria-disabled={!isInteractive}
                  title={isInteractive ? undefined : "Not started yet"}
                  className={cn(
                    "group relative flex w-full items-start gap-2.5 rounded-md py-1.5 pl-0 pr-1.5 text-left transition-colors",
                    isFocused && "bg-muted/50",
                    isInteractive ? "cursor-pointer hover:bg-muted/30" : "cursor-default opacity-55"
                  )}
                >
                  {/* Node dot */}
                  <span
                    className={cn(
                      "z-10 mt-px flex size-[21px] shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                      state === "done"
                        ? "border-transparent bg-foreground text-background"
                        : state === "current"
                          ? "border-foreground bg-background text-foreground ring-2 ring-foreground/15"
                          : "border-border bg-background text-muted-foreground/60"
                    )}
                  >
                    {state === "done" ? <Check className="size-3" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div
                      className={cn(
                        "truncate text-[12.5px] leading-tight",
                        isFocused || state === "current"
                          ? "font-medium text-foreground"
                          : "text-foreground/70"
                      )}
                    >
                      {stageLabels[stage]}
                    </div>
                    {status && (
                      <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                        {status}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>

      {/* ── RIGHT: Action-first content ── */}
      <div className="min-w-0 space-y-4">
        {/* Peeking banner — only ever backwards now (future is locked) */}
        {isPeeking && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
            <span>
              Looking back at <span className="font-medium text-foreground">{stageLabels[focusedStage]}</span> (completed)
            </span>
            <button
              onClick={() => setFocusedStage(normalizedCurrent)}
              className="shrink-0 font-medium text-foreground/70 hover:text-foreground"
            >
              Back to now
            </button>
          </div>
        )}

        {/* 1. Next action */}
        {stageAction && <StageActionCard {...stageAction} />}

        {/* 2. Petal's read — one tight line */}
        <div className="flex items-start gap-2.5 rounded-lg border bg-card px-3.5 py-3">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
            <PetalMark className="size-3 text-foreground/70" />
          </span>
          <p className="text-[13px] leading-relaxed text-foreground/85">
            {petalRead(client, focusedStage)}
          </p>
        </div>

        {/* 3. Open flags */}
        <OpenItemsSection clientId={client.id} additionalItems={flaggedItems} />

        {/* 4. At a glance */}
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
            At a glance
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-3">
            <Fact label="Filing status" value={filingStatusLabel(client)} />
            <Fact label="Service tier" value={`${client.serviceTier} · $${client.feeAmount}`} />
            <Fact
              label="Documents"
              value={`${client.documentsSubmitted}/${client.documentsRequired} (${docsPct}%)`}
            />
            <Fact
              label="Deposit"
              value={client.depositPaid ? "Paid" : "Outstanding"}
              valueClass={client.depositPaid ? "text-emerald-600" : "text-amber-600"}
            />
            <Fact label="Type" value={client.type === "business" ? client.businessName || "Business" : "Individual"} />
            <div>
              <dt className="text-[10.5px] uppercase tracking-wide text-muted-foreground/70">Assignee</dt>
              <dd className="mt-1 flex items-center gap-1.5">
                {assignee ? (
                  <>
                    <Avatar className="size-4">
                      {assignee.avatar && <AvatarImage src={assignee.avatar} alt={assignee.fullName} />}
                      <AvatarFallback className="text-[7px] font-semibold">
                        {memberInitials(assignee)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium text-foreground/85">{assignee.shortName}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* 5. Billing snapshot */}
        <BillingCard client={client} />
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] uppercase tracking-wide text-muted-foreground/70">{label}</dt>
      <dd className={cn("mt-1 truncate font-medium text-foreground/85", valueClass)}>{value}</dd>
    </div>
  );
}

function filingStatusLabel(client: Client): string {
  const map: Record<string, string> = {
    single: "Single",
    mfj: "Married filing jointly",
    mfs: "Married filing separately",
    hoh: "Head of household",
    qw: "Qualifying widow(er)",
  };
  return map[client.filingStatus] ?? client.filingStatus;
}
