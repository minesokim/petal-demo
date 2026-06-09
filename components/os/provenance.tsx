"use client";

// "Sources & reasoning" — the provenance affordance every Petal-produced artifact carries.
// Rendering an AI artifact without this panel is a bug (see docs/superpowers/plans/2026-06-09-petal-os-overhaul.md §3.4).

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { SkillPetal } from "@/components/os/primitives";
import { runById, skillById } from "@/lib/fixtures/firm";
import { trustTierMeta } from "@/lib/fixtures/vocab";

const CONFIDENCE_BAR = 0.95;

export function ProvenancePanel({
  runId,
  defaultOpen = false,
  className,
}: {
  runId: string;
  /** Review mode keeps it open; cards keep it collapsed */
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const run = runById(runId);
  if (!run) return null;
  const skill = skillById(run.skillId);
  const tier = trustTierMeta[run.trustTierAtRun];

  return (
    <div className={cn("rounded-lg border border-[var(--os-border)] bg-[var(--os-card)]", className)}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
      >
        <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
        <span className="text-[12px] font-medium text-[var(--os-ink)]">Sources & reasoning</span>
        <span className="ml-auto flex items-center gap-2 text-[11px] text-[var(--os-ink-muted)]">
          {skill && <span className="inline-flex items-center gap-1"><SkillPetal category={skill.category} size={12} /> {skill.name}</span>}
          <Icon icon={I.chevronDown} size={13} className={cn("transition-transform", !open && "-rotate-90")} />
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-[var(--os-border)] px-3 py-3 text-[12px]">
          {/* sources */}
          <div>
            <div className="os-label mb-1 text-[11px] font-medium text-[var(--os-ink-muted)]">Sources</div>
            <ul className="space-y-0.5">
              {run.inputs.map((s, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[var(--os-ink)]">
                  <Icon icon={I.file} size={12} className="shrink-0 text-[var(--os-ink-subtle)]" />
                  {s.ref}{s.page ? <span className="text-[var(--os-ink-subtle)]"> · {s.page}</span> : null}
                </li>
              ))}
            </ul>
          </div>

          {/* extracted fields with per-field confidence */}
          {run.extracted && run.extracted.length > 0 && (
            <div>
              <div className="os-label mb-1 text-[11px] font-medium text-[var(--os-ink-muted)]">Extracted fields</div>
              <div className="overflow-hidden rounded-md border border-[var(--os-border)] bg-white">
                {run.extracted.map((f, i) => {
                  const low = f.flag || f.confidence < CONFIDENCE_BAR;
                  return (
                    <div key={i} className={cn("flex items-center justify-between gap-3 border-b border-[var(--os-border)] px-2.5 py-1.5 last:border-b-0", low && "bg-amber-50/60")}>
                      <span className="text-[var(--os-ink-muted)]">{f.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">{f.value}</span>
                        <span className={cn("tabular-nums text-[10.5px]", low ? "font-medium text-amber-700" : "text-[var(--os-ink-subtle)]")}>
                          {Math.round(f.confidence * 100)}%{low ? " · review" : ""}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* the rule or comparison used */}
          {run.rule && (
            <div>
              <div className="os-label mb-1 text-[11px] font-medium text-[var(--os-ink-muted)]">Rule applied</div>
              <p className="text-[var(--os-ink)]">{run.rule}</p>
            </div>
          )}

          {/* reasoning */}
          <div>
            <div className="os-label mb-1 text-[11px] font-medium text-[var(--os-ink-muted)]">Reasoning</div>
            <p className="leading-relaxed text-[var(--os-ink)]">{run.reasoning}</p>
          </div>

          {/* run facts */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--os-border)] pt-2 text-[11px] text-[var(--os-ink-muted)]">
            <span>Run {run.startedAt}</span>
            <span>·</span>
            <span>{tier.code} {tier.label} at run time</span>
            {run.confidence != null && (<><span>·</span><span className="tabular-nums">Confidence {Math.round(run.confidence * 100)}%</span></>)}
            {run.approvedBy && (<><span>·</span><span>Approved by {run.approvedBy}{run.approvedAt ? ` · ${run.approvedAt}` : ""}</span></>)}
            <Link
              href={`/os/activity?run=${run.id}`}
              className="ml-auto inline-flex items-center gap-1 text-[var(--os-accent)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              View in activity log <Icon icon={I.chevronRight} size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
