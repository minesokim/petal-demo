"use client";

// Returns board — every 2025 engagement across the 7 canonical stages.
// Every number on this surface derives from lib/fixtures/derive at render time.

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { DeadlineChip, SkillPetal } from "@/components/os/primitives";
import {
  STAGE_ORDER, ACTIVE_STAGES, stageMeta, daysUntil, fmtDate, money, type Stage,
} from "@/lib/fixtures/vocab";
import { engagements, tasks, householdById, skillById, type Engagement } from "@/lib/fixtures/firm";
import { stageCounts, feesInPipeline, feesBlockedByDocs, docsOf, engagementDeadline } from "@/lib/fixtures/derive";

type DeadlineWindow = "all" | "14" | "45";

const TAX_YEAR = engagements[0].taxYear;
const FORM_OPTIONS = Array.from(new Set(engagements.map(e => e.form)));

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/** The skill currently running against this engagement, when one is. */
function runningSkillOf(e: Engagement) {
  const t = tasks.find(x => x.engagementId === e.id && x.status === "running");
  return t ? skillById(t.skillId) : undefined;
}

function ReturnCard({ e }: { e: Engagement }) {
  const hh = householdById(e.householdId);
  const docs = docsOf(e.id);
  const skill = runningSkillOf(e);
  const finished = e.stage === "e_filed" || e.stage === "accepted";
  const pct = docs.denom > 0 ? Math.round((docs.inHand / docs.denom) * 100) : 0;

  return (
    <Link
      href={`/os/returns/${e.id}`}
      className={cn(
        "block rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-2.5 shadow-[0_1px_2px_rgba(17,17,26,0.03)] transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]",
        focusRing,
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{hh?.name}</div>
          <div className="truncate text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{e.form} · {e.taxYear}</div>
        </div>
        {skill && (
          <span className="shrink-0" title={`${skill.name} — running`}>
            <SkillPetal category={skill.category} size={16} />
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {finished ? (
          <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">
            {e.acceptedOn ? `Accepted ${fmtDate(e.acceptedOn)}` : e.eFiledOn ? `E-filed ${fmtDate(e.eFiledOn)}` : null}
          </span>
        ) : (
          <DeadlineChip {...engagementDeadline(e)} />
        )}
        <span className="ml-auto text-[12px] font-medium tabular-nums text-[var(--os-ink)]">{money(e.fee)}</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
          <div className="h-full rounded-full bg-[var(--os-ink-muted)]" style={{ width: `${pct}%` }} />
        </div>
        <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--os-ink-muted)]">{docs.label} docs</span>
      </div>

      {e.blockedBy && (
        <div className="mt-1.5 truncate text-[11px] font-medium text-[var(--os-warning)]" title={e.blockedBy}>
          Blocked: {e.blockedBy}
        </div>
      )}
    </Link>
  );
}

function ReturnsBoard() {
  const params = useSearchParams();
  const preselect = params.get("stage");
  const [stage, setStage] = useState<Stage | "all">(
    preselect && (STAGE_ORDER as string[]).includes(preselect) ? (preselect as Stage) : "all",
  );
  const [windowFilter, setWindowFilter] = useState<DeadlineWindow>("all");
  const [form, setForm] = useState<string>("all");
  const [blockedOnly, setBlockedOnly] = useState(false);

  const sc = stageCounts();

  const filtered = useMemo(
    () =>
      engagements.filter(e => {
        if (form !== "all" && e.form !== form) return false;
        if (stage !== "all" && e.stage !== stage) return false;
        if (blockedOnly && !e.blockedBy) return false;
        if (windowFilter !== "all") {
          if (!(ACTIVE_STAGES as Stage[]).includes(e.stage)) return false;
          if (daysUntil(engagementDeadline(e).iso) > Number(windowFilter)) return false;
        }
        return true;
      }),
    [stage, windowFilter, form, blockedOnly],
  );

  const visibleStages: Stage[] = stage === "all" ? STAGE_ORDER : [stage];
  const filtersActive = stage !== "all" || windowFilter !== "all" || form !== "all" || blockedOnly;

  const resetFilters = () => {
    setStage("all");
    setWindowFilter("all");
    setForm("all");
    setBlockedOnly(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Returns</h1>
        <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Every {TAX_YEAR} return across the practice, by stage.</p>
      </div>

      {/* strip: per-stage counts + pipeline money */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-[var(--os-border)] px-8 py-2.5">
        {STAGE_ORDER.map(s => (
          <button
            key={s}
            onClick={() => setStage(stage === s ? "all" : s)}
            aria-pressed={stage === s}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12px] transition-colors",
              focusRing,
              stage === s ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
            )}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", stageMeta[s].dot)} />
            {stageMeta[s].label}
            <span className="tabular-nums text-[var(--os-ink-subtle)]">{sc[s]}</span>
          </button>
        ))}
        <span className="ml-auto text-[12px] tabular-nums text-[var(--os-ink-muted)]">
          Fees in pipeline <span className="font-medium text-[var(--os-ink)]">{money(feesInPipeline())}</span>
          <span className="px-1 text-[var(--os-ink-subtle)]">·</span>
          Blocked by missing docs <span className="font-medium text-[var(--os-warning)]">{money(feesBlockedByDocs())}</span>
        </span>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--os-border)] px-8 py-2">
        <div className="flex items-center gap-0.5 rounded-md border border-[var(--os-border)] p-0.5" role="group" aria-label="Deadline window">
          {(["all", "14", "45"] as const).map(w => (
            <button
              key={w}
              onClick={() => setWindowFilter(w)}
              aria-pressed={windowFilter === w}
              className={cn(
                "h-6 rounded px-2 text-[12px] transition-colors",
                focusRing,
                windowFilter === w ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
              )}
            >
              {w === "all" ? "All" : `${w}d`}
            </button>
          ))}
        </div>

        <select
          value={form}
          onChange={e => setForm(e.target.value)}
          aria-label="Form type"
          className={cn("h-7 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[12px] text-[var(--os-ink)]", focusRing)}
        >
          <option value="all">All forms</option>
          {FORM_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select
          value={stage}
          onChange={e => setStage(e.target.value as Stage | "all")}
          aria-label="Stage"
          className={cn("h-7 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[12px] text-[var(--os-ink)]", focusRing)}
        >
          <option value="all">All stages</option>
          {STAGE_ORDER.map(s => <option key={s} value={s}>{stageMeta[s].label}</option>)}
        </select>

        <button
          onClick={() => setBlockedOnly(b => !b)}
          aria-pressed={blockedOnly}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] transition-colors",
            focusRing,
            blockedOnly
              ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] font-medium text-[var(--os-ink)]"
              : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
          )}
        >
          <Icon icon={I.alert} size={13} /> Blocked only
        </button>

        {filtersActive && (
          <button
            onClick={resetFilters}
            className={cn("h-7 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}
          >
            Clear
          </button>
        )}
      </div>

      {/* board */}
      {filtered.length === 0 ? (
        <div className="grid flex-1 place-items-center px-6 py-10 text-center">
          <div>
            <p className="text-[13px] text-[var(--os-ink-muted)]">
              {windowFilter !== "all"
                ? `Nothing comes due in the next ${windowFilter} days — the extension track has breathing room.`
                : "No returns match these filters."}
            </p>
            <button
              onClick={resetFilters}
              className={cn("mt-3 h-8 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", focusRing)}
            >
              Show all returns
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max gap-3 px-5 py-4">
            {visibleStages.map(s => {
              const group = filtered.filter(e => e.stage === s);
              return (
                <div key={s} className="flex w-[300px] shrink-0 flex-col">
                  <div className="flex items-center gap-2 px-1 py-2">
                    <span className={cn("size-2 shrink-0 rounded-full", stageMeta[s].dot)} />
                    <span className="text-[13px] font-medium text-[var(--os-ink)]">{stageMeta[s].label}</span>
                    <span className="tabular-nums text-[12px] text-[var(--os-ink-subtle)]">{group.length}</span>
                  </div>
                  <div className="flex flex-col gap-2 px-0.5 pb-4">
                    {group.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--os-border)] px-3 py-4 text-center text-[11px] text-[var(--os-ink-subtle)]">
                        None in this stage
                      </div>
                    ) : (
                      group.map(e => <ReturnCard key={e.id} e={e} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense fallback={null}>
      <ReturnsBoard />
    </Suspense>
  );
}
