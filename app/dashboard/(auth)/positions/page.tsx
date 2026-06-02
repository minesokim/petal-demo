"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, SearchIcon, ShieldCheckIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  POSITIONS,
  POSITIONS_BY_TIER,
  TIER_META,
  CATEGORY_META,
  type Position,
  type PositionTier,
  type PositionCategory,
} from "@/lib/positions-mock-data";
import { cn } from "@/lib/utils";

// ═════════════════════════════════════════════════════════════════════════
// Page
// ═════════════════════════════════════════════════════════════════════════

export default function PositionLibraryPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<PositionTier | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<PositionCategory | "all">("all");

  const filtered = useMemo(() => {
    return POSITIONS.filter((p) => {
      if (tierFilter !== "all" && p.tier !== tierFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.iconSection.toLowerCase().includes(q) ||
          p.brief.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, tierFilter, categoryFilter]);

  const totalUsed = POSITIONS.reduce((s, p) => s + p.usedInPractice, 0);
  const totalRefused = POSITIONS.reduce((s, p) => s + (p.refusedCount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Position Library</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground/80 tabular-nums">{POSITIONS.length}</span> tax positions
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="tabular-nums">{totalUsed}</span> applied this season
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="tabular-nums text-red-600">{totalRefused}</span> refused (refusal-floor enforcement)
          </p>
        </div>
      </div>

      {/* ── Editorial intro ── */}
      <div className="rounded-xl border border-foreground/15 bg-card p-5">
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
          <BookOpenIcon className="size-3 text-foreground/60" />
          The cookbook
        </div>
        <p className="text-[13.5px] leading-relaxed text-foreground/85">
          Every tax position Petal can take, each with its authority chain and confidence tier.
          I won&apos;t take anything below <span className="font-medium">Reasonable Basis</span> — that&apos;s the floor.
          When the backing is weak, I refuse and tell you why.
        </p>
      </div>

      {/* ── Tier filter strip with counts ── */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-muted/50 p-1">
        <TierPill label="All" count={POSITIONS.length} active={tierFilter === "all"} onClick={() => setTierFilter("all")} />
        {(Object.keys(TIER_META) as PositionTier[]).map((t) => (
          <TierPill
            key={t}
            label={TIER_META[t].short}
            count={POSITIONS_BY_TIER[t]}
            dot={TIER_META[t].dotClass}
            active={tierFilter === t}
            onClick={() => setTierFilter(t)}
          />
        ))}
      </div>

      {/* ── Search + category filter ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search positions, IRC sections, keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/50 p-1">
          {(["all", ...Object.keys(CATEGORY_META)] as Array<PositionCategory | "all">).map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition-all",
                categoryFilter === c
                  ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.06]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c === "all" ? "All" : CATEGORY_META[c as PositionCategory].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Gallery ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <PositionCard key={p.id} position={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border bg-card text-center">
          <div className="text-[14px] font-medium">No positions match</div>
          <div className="text-[12px] text-muted-foreground">Adjust your filters or search</div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
        Coverage scope published at <span className="font-mono">petal.com/coverage</span> · updated quarterly · refusal floor enforced
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Position card
// ═════════════════════════════════════════════════════════════════════════

function PositionCard({ position }: { position: Position }) {
  const tier = TIER_META[position.tier];
  return (
    <Link
      href={`/dashboard/positions/${position.id}`}
      className="group flex h-full flex-col gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-[10.5px] font-medium uppercase tracking-wider text-foreground/55">
            {position.iconSection}
          </div>
          <div className="mt-0.5 text-[13.5px] font-semibold leading-tight">{position.name}</div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider ring-1",
            tier.chipClass
          )}
        >
          {tier.short}
        </span>
      </div>

      <p className="line-clamp-2 text-[12px] leading-relaxed text-foreground/75">{position.brief}</p>

      <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-2.5 text-[11px]">
        <span className="capitalize text-muted-foreground">{CATEGORY_META[position.category].label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground/75">{position.usedInPractice}</span> in use
          </span>
          {position.refusedCount !== undefined && position.refusedCount > 0 && (
            <span className="text-red-600">
              <span className="font-medium tabular-nums">{position.refusedCount}</span> refused
            </span>
          )}
          <ArrowRightIcon className="size-3 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
        </div>
      </div>
    </Link>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Tier pill
// ═════════════════════════════════════════════════════════════════════════

function TierPill({
  label,
  count,
  dot,
  active,
  onClick,
}: {
  label: string;
  count: number;
  dot?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.06]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
      <span>{label}</span>
      <span className="tabular-nums text-muted-foreground/60">{count}</span>
    </button>
  );
}
