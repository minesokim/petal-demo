import { type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import {
  taskStatusMeta, stageMeta, skillCategoryMeta, trustTierMeta, TRUST_TIER_ORDER,
  SKILL_CATEGORY_ORDER, daysUntil, fmtDate,
  type TaskStatus, type Stage, type SkillCategory, type TrustTier,
} from "@/lib/fixtures/vocab";
import { memberById, memberInitials, roleMeta } from "@/lib/fixtures/firm";

/** Each agent's petal mark, keyed by its identity gradient. */
const PETAL_BY_GRADIENT: Record<string, string> = {
  "from-indigo-500 to-violet-500": "/petals/purplepetal.png",
  "from-emerald-500 to-teal-500": "/petals/cyanpetal.png",
  "from-amber-500 to-orange-500": "/petals/orangepetal.png",
  "from-sky-500 to-blue-600": "/petals/bluepetal.png",
  "from-rose-500 to-pink-500": "/petals/redpetal.png",
  "from-violet-500 to-fuchsia-500": "/petals/yellowpetal.png",
};

/**
 * Agent identity avatar — each agent owns a colored petal on a white app-icon.
 * Keyed off the agent's `gradient`, so every call site updates with no changes.
 */
export function AgentAvatar({
  gradient,
  size = 28,
  rounded = 8,
  bare = false,
  className,
}: {
  gradient: string;
  icon?: IconSvgElement;
  size?: number;
  rounded?: number;
  /** render just the petal (no white icon / border); white bg is knocked out via multiply */
  bare?: boolean;
  className?: string;
}) {
  const petal = PETAL_BY_GRADIENT[gradient] ?? "/petals/purplepetal.png";
  if (bare) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={petal} alt="" className={cn("shrink-0 object-contain mix-blend-multiply", className)} style={{ width: size, height: size }} />;
  }
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center overflow-hidden bg-white ring-1 ring-inset ring-[var(--os-border)]", className)}
      style={{ width: size, height: size, borderRadius: rounded }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={petal} alt="" className="size-full object-contain" style={{ padding: Math.round(size * 0.1) }} />
    </span>
  );
}

/** The full colorful Petal mark (the logo flower) — used for the Petal Agents surface. */
export function PetalLogo({ size = 18, className }: { size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/petals/petalagents.png" alt="" className={cn("shrink-0 object-contain mix-blend-multiply", className)} style={{ width: size, height: size }} />;
}

/** Linear-style tinted pill: soft bg + colored text + colored dot. */
export function Pill({
  label,
  tint,
  dot,
  className,
}: {
  label: string;
  /** e.g. "bg-emerald-50 text-emerald-700" */
  tint: string;
  /** e.g. "bg-emerald-500" */
  dot?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", tint, className)}>
      {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
      {label}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// Canonical-vocabulary primitives (lib/fixtures). One status
// language everywhere — these are the ONLY renderers for it.
// ════════════════════════════════════════════════════════════

/** Task status: small dot + neutral label. The single status grammar for every surface. */
export function StatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const m = taskStatusMeta[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}

/** Engagement stage: dot + label. */
export function StageTag({ stage, className }: { stage: Stage; className?: string }) {
  const m = stageMeta[stage];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink)]", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}

/** Deadline chip — color by proximity (<14d danger, <45d warning, else muted). "Ext" prefix for extended deadlines. */
export function DeadlineChip({ iso, extended, className }: { iso: string; extended?: boolean; className?: string }) {
  const d = daysUntil(iso);
  const tone =
    d < 14 ? "border-red-200 bg-red-50 text-red-700"
    : d < 45 ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-[var(--os-border)] text-[var(--os-ink-muted)]";
  return (
    <span
      title={`${d} days away`}
      className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums", tone, className)}
    >
      {extended ? "Ext " : ""}{fmtDate(iso)}
    </span>
  );
}

/** The AI layer's identity: a petal colored by skill category (see the legend). */
export function SkillPetal({ category, size = 16, className }: { category: SkillCategory; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={skillCategoryMeta[category].petal}
      alt={skillCategoryMeta[category].label}
      title={skillCategoryMeta[category].label}
      className={cn("shrink-0 object-contain mix-blend-multiply", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** The six petal colors, mapped — render wherever petals appear without context. */
export function PetalLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {SKILL_CATEGORY_ORDER.map(c => (
        <span key={c} className="inline-flex items-center gap-1.5 text-[11px] text-[var(--os-ink-muted)]">
          <SkillPetal category={c} size={13} /> {skillCategoryMeta[c].label}
        </span>
      ))}
    </div>
  );
}

/** Trust tier as a 4-step dial (T0 Suggest → T3 Act & report). Read-only without onChange. */
export function TrustDial({ tier, onChange, className }: { tier: TrustTier; onChange?: (t: TrustTier) => void; className?: string }) {
  return (
    <div className={cn("inline-flex items-center rounded-md border border-[var(--os-border)] p-0.5", className)} role="radiogroup" aria-label="Trust tier">
      {TRUST_TIER_ORDER.map(t => {
        const m = trustTierMeta[t];
        const active = t === tier;
        return (
          <button
            key={t}
            role="radio"
            aria-checked={active}
            disabled={!onChange}
            onClick={() => onChange?.(t)}
            title={`${m.code} ${m.label} — ${m.blurb}`}
            className={cn(
              "rounded px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
              active ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "text-[var(--os-ink-muted)]",
              onChange && !active && "hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
            )}
          >
            {m.code}
          </button>
        );
      })}
    </div>
  );
}

/** Compact trust-tier tag for menus and rows. */
export function TrustTierTag({ tier, className }: { tier: TrustTier; className?: string }) {
  const m = trustTierMeta[tier];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-[var(--os-border)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--os-ink-muted)]", className)} title={m.blurb}>
      {m.code} · {m.label}
    </span>
  );
}

// ── Team / firm-wide ──────────────────────────────────────────

/** Flat initials avatar for a firm member (records stay monochrome). */
export function MemberAvatar({ memberId, size = 22, className }: { memberId?: string; size?: number; className?: string }) {
  const m = memberById(memberId);
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full bg-[var(--os-selected)] font-semibold text-[var(--os-ink-muted)]", className)}
      style={{ width: size, height: size, fontSize: size <= 20 ? 9 : 10 }}
      title={m ? `${m.name}${m.credential ? ` · ${m.credential}` : ""} — ${roleMeta[m.role].label}` : "Unassigned"}
    >
      {memberInitials(memberId)}
    </span>
  );
}

export type Scope = "mine" | "firm";

/** "Mine / Firm" segmented toggle — the firm-wide view control. */
export function ScopeToggle({ scope, onChange, className }: { scope: Scope; onChange: (s: Scope) => void; className?: string }) {
  return (
    <div className={cn("flex items-center rounded-md border border-[var(--os-border)] p-0.5", className)} role="group" aria-label="View scope">
      {(["mine", "firm"] as const).map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          aria-pressed={scope === s}
          className={cn(
            "h-6 rounded px-2 text-[12px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
            scope === s ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
          )}
        >
          {s === "mine" ? "Mine" : "Firm"}
        </button>
      ))}
    </div>
  );
}
