"use client";

// "Sources & reasoning" - the provenance affordance every Petal-produced artifact carries.
// Collapsed, it is a single quiet text line (no box - boxes-in-boxes read as noise);
// the bordered panel draws only when opened. Rendering an AI artifact without this
// affordance is a bug (docs/superpowers/plans/2026-06-09-petal-os-overhaul.md §3.4).

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
    <div className={cn("min-w-0", className)}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={cn(
          "-mx-1.5 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] font-medium transition-colors",
          "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink-muted)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
          open && "text-[var(--os-ink-muted)]",
        )}
      >
        <PetalMark className="size-3 shrink-0" />
        Sources &amp; reasoning
        <Icon icon={I.chevronDown} size={12} className={cn("shrink-0 transition-transform duration-150", !open && "-rotate-90")} />
      </button>

      {open && (
        <div className="mt-1.5 space-y-3 rounded-lg border border-[var(--os-border)] bg-white px-3.5 py-3 text-[12px]">
          {/* run byline */}
          {skill && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]">
              <SkillPetal category={skill.category} size={12} /> {skill.name}
              <span className="font-normal text-[var(--os-ink-subtle)]">· run {run.startedAt}</span>
            </div>
          )}

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
              <div className="overflow-hidden rounded-md border border-[var(--os-border)]">
                {run.extracted.map((f, i) => {
                  const low = f.flag || f.confidence < CONFIDENCE_BAR;
                  return (
                    <div key={i} className={cn("flex items-center justify-between gap-3 border-b border-[var(--os-border)] px-2.5 py-1.5 last:border-b-0", low && "bg-amber-50/60")}>
                      <span className="text-[var(--os-ink-muted)]">{f.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium tabular-nums text-[var(--os-ink)]">{f.value}</span>
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
            <span>{tier.code} {tier.label} at run time</span>
            {run.confidence != null && (<><span>·</span><span className="tabular-nums">Confidence {Math.round(run.confidence * 100)}%</span></>)}
            {run.approvedBy && (<><span>·</span><span>Approved by {run.approvedBy}{run.approvedAt ? ` · ${run.approvedAt}` : ""}</span></>)}
            <Link
              href={`/os/activity?run=${run.id}`}
              className="ml-auto inline-flex items-center gap-1 text-[var(--os-link)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              View in activity log <Icon icon={I.chevronRight} size={11} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
