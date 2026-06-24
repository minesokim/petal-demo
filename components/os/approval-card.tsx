"use client";

// One staged agent action awaiting a human commit — rendered inside Tasks (the unified work
// surface). Shows the risk lane, the evidenced artifact (each field → its source, a 30-second
// check), risk factors, and approve/reject. Irreversible external commits (e-file, post journal)
// clear to "ready to submit" — Petal never performs them; the human does. Monochrome chrome per
// docs/DESIGN.md; the only color is the risk/state punctuation.

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { resolveProposalAction } from "@/app/os/agents/proposal-actions";
import type { ReviewArtifact } from "@/lib/agent/review-artifact";
import type { QueuedProposal } from "@/lib/agent/proposal-types";

export type { QueuedProposal };

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

type Resolution = { status: "approved" | "rejected" | "ready_to_submit" } | { error: string };

const LANE_LABEL: Record<string, string> = { review: "Needs review", confirm: "Quick confirm", blocked: "Blocked", auto: "Auto" };

const LEVEL_TONE: Record<string, string> = {
  high: "text-[var(--os-danger)] bg-[color-mix(in_srgb,var(--os-danger)_12%,transparent)]",
  medium: "text-[var(--os-warning)] bg-[color-mix(in_srgb,var(--os-warning)_12%,transparent)]",
  low: "text-[var(--os-ink-muted)] bg-[var(--os-selected)]",
};

function connectorOf(toolName: string): string {
  if (toolName.startsWith("olt_")) return "OLT";
  if (toolName.startsWith("create_xero") || toolName.includes("xero")) return "Xero";
  return "the external system";
}

function RiskChip({ lane, level }: { lane: string | null; level: string | null }) {
  const tone = LEVEL_TONE[level ?? "low"] ?? LEVEL_TONE.low;
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-medium", tone)}>
      {LANE_LABEL[lane ?? "confirm"] ?? "Review"}
    </span>
  );
}

function EvidenceRow({ field }: { field: ReviewArtifact["fields"][number] }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--os-border)] px-3 py-2 last:border-0">
      <div className="min-w-0">
        <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{field.label}</div>
        <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">
          from {field.source.label}{field.source.detail ? ` · ${field.source.detail}` : ""}
        </div>
      </div>
      <div className="shrink-0 text-[13px] tabular-nums text-[var(--os-ink)]">{field.value}</div>
    </div>
  );
}

export function ProposalCard({ p }: { p: QueuedProposal }) {
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [busy, startBusy] = useTransition();
  const artifact = p.reviewArtifact;
  const summary = artifact?.summary || p.rationale;
  const reviewFactors = (p.riskLane === "review" ? p.riskFactors : []).filter((f) => f.name !== "scope");

  const resolve = (decision: "approve" | "reject") => {
    startBusy(async () => {
      const out = await resolveProposalAction(p.id, decision);
      setResolution(out.ok ? { status: out.status } : { error: out.error });
    });
  };

  return (
    <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
      <div className="flex items-center gap-2">
        <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />
        <span className="text-[11px] text-[var(--os-ink-subtle)]">Petal staged this</span>
        <RiskChip lane={p.riskLane} level={p.riskLevel} />
        {p.humanMustSubmit && (
          <span className="text-[11px] text-[var(--os-ink-subtle)]">· draft only, you submit</span>
        )}
      </div>

      <p className="mt-2 text-[13.5px] font-semibold leading-snug text-[var(--os-ink)]">{summary}</p>

      {reviewFactors.length > 0 && (
        <ul className="mt-2 space-y-1">
          {reviewFactors.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
              <Icon icon={I.shield} size={12} className="mt-0.5 shrink-0 text-[var(--os-ink-subtle)]" />
              <span>{f.detail}</span>
            </li>
          ))}
        </ul>
      )}

      {artifact && artifact.fields.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-md border border-[var(--os-border)]">
          {artifact.fields.map((field, i) => <EvidenceRow key={i} field={field} />)}
        </div>
      )}

      {artifact?.research && (
        <div className="mt-2 text-[11.5px] text-[var(--os-ink-subtle)]">
          Research: {artifact.research.bucket}
          {artifact.research.citations.length > 0 && ` · ${artifact.research.citations.map((c) => c.label).join(", ")}`}
        </div>
      )}

      {artifact && artifact.warnings.length > 0 && (
        <ul className="mt-2 space-y-1">
          {artifact.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12px] text-[var(--os-warning)]">
              <Icon icon={I.alert} size={12} className="mt-0.5 shrink-0" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      {p.humanMustSubmit && !resolution && (
        <p className="mt-3 text-[12px] text-[var(--os-ink-muted)]">
          Petal will prepare this draft. After you approve, you perform the final submit in {connectorOf(p.toolName)} yourself.
        </p>
      )}

      {resolution && "status" in resolution ? (
        <div className="mt-3 flex items-center gap-1.5 text-[12.5px]">
          {resolution.status === "ready_to_submit" ? (
            <span className="flex items-center gap-1.5 text-[var(--os-success)]">
              <Icon icon={I.check} size={14} /> Cleared. Submit it in {connectorOf(p.toolName)} when you are ready.
            </span>
          ) : resolution.status === "approved" ? (
            <span className="flex items-center gap-1.5 text-[var(--os-success)]"><Icon icon={I.check} size={14} /> Approved.</span>
          ) : (
            <span className="flex items-center gap-1.5 text-[var(--os-ink-muted)]"><Icon icon={I.close} size={14} /> Rejected.</span>
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => resolve("approve")}
            disabled={busy}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-60", FOCUS)}
          >
            <Icon icon={I.check} size={14} /> {p.humanMustSubmit ? "Approve draft" : "Approve"}
          </button>
          <button
            onClick={() => resolve("reject")}
            disabled={busy}
            className={cn("inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] disabled:opacity-60", FOCUS)}
          >
            Reject
          </button>
          {resolution && "error" in resolution && (
            <span className="text-[12px] text-[var(--os-danger)]">{resolution.error}</span>
          )}
        </div>
      )}
    </div>
  );
}
