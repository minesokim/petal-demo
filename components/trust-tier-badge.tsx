"use client";

import { cn } from "@/lib/utils";

/**
 * Trust-tier badge — Pass A's "visible system primitive" for autonomy.
 *
 * Production model (from AGENT-PLATFORM doc): every autonomous action sits
 * at one of four trust tiers. The user sees this as a small colored chip
 * everywhere Petal touches the product.
 *
 *   🟢 Auto    — Petal does it, you see the receipt
 *   🟡 Drafts  — Petal drafts, you approve before send
 *   🟠 Asks    — Petal flags, you make the call
 *   ⚫ Manual  — Petal doesn't touch
 *
 * Used in: Triage cards (header strip), Today's brief (corner badge),
 * Petal activity card (per-row), Receipts/Activity tab (per entry).
 */

export type TrustTier = "auto" | "drafts" | "asks" | "manual";

const TIER_STYLES: Record<TrustTier, { label: string; dot: string; chip: string; long: string }> = {
  auto: {
    label: "Auto",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40",
    long: "Petal handles · you see the receipt",
  },
  drafts: {
    label: "Draft",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-900/40",
    long: "Petal drafts · you approve before send",
  },
  asks: {
    label: "Ask",
    dot: "bg-orange-500",
    chip: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:ring-orange-900/40",
    long: "Petal flags · you make the call",
  },
  manual: {
    label: "Manual",
    dot: "bg-foreground/60",
    chip: "bg-muted text-foreground/65 ring-border",
    long: "Petal doesn't touch · you handle",
  },
};

/** Tiny colored dot — for crowded surfaces like queue cards */
export function TrustTierDot({ tier, className }: { tier: TrustTier; className?: string }) {
  return (
    <span
      className={cn("inline-block size-1.5 shrink-0 rounded-full", TIER_STYLES[tier].dot, className)}
      title={`${TIER_STYLES[tier].label} — ${TIER_STYLES[tier].long}`}
      aria-label={`Autonomy tier: ${TIER_STYLES[tier].label}`}
    />
  );
}

/** Small labeled chip — for detail panels and surfaces that have room */
export function TrustTierChip({ tier, className }: { tier: TrustTier; className?: string }) {
  const s = TIER_STYLES[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider ring-1",
        s.chip,
        className
      )}
      title={s.long}
    >
      <span className={cn("size-1 rounded-full", s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  );
}
