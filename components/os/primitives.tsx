import { type ReactNode } from "react";
import { type IconSvgElement } from "@hugeicons/react";
import {
  CheckCircle2, Clock3, AlertCircle, CircleDot, CalendarClock, Hourglass, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  taskStatusMeta, stageMeta, skillCategoryMeta, trustTierMeta, TRUST_TIER_ORDER,
  SKILL_CATEGORY_ORDER, daysUntil, fmtDate,
  type TaskStatus, type Stage, type SkillCategory, type TrustTier,
} from "@/lib/fixtures/vocab";
import { memberById, memberInitials, roleMeta } from "@/lib/fixtures/firm";

// ════════════════════════════════════════════════════════════
// Badge — THE small-component family. Soft-fill, square-ish (5px),
// no outline, optional leading icon or dot. One shape everywhere:
// statuses, deadlines, roles, trust tiers, metadata. (ref IMG_7007)
// ════════════════════════════════════════════════════════════

export type Tone = "emerald" | "amber" | "red" | "blue" | "violet" | "slate" | "neutral";

const TONE: Record<Tone, { soft: string; text: string; dot: string; icon: string }> = {
  emerald: { soft: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: "text-emerald-500" },
  amber:   { soft: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   icon: "text-amber-500" },
  red:     { soft: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     icon: "text-red-500" },
  blue:    { soft: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    icon: "text-blue-500" },
  violet:  { soft: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  icon: "text-violet-500" },
  slate:   { soft: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400",   icon: "text-slate-400" },
  neutral: { soft: "bg-[var(--os-selected)]", text: "text-[var(--os-ink-muted)]", dot: "bg-[var(--os-ink-subtle)]", icon: "text-[var(--os-ink-subtle)]" },
};

/** Flagged indicator — a fully-yellow bookmark. The single "flagged" glyph everywhere. */
export function BookmarkFlag({ size = 13, className }: { size?: number; className?: string }) {
  return <Bookmark size={size} className={cn("shrink-0 fill-yellow-400 text-yellow-400", className)} />;
}

export function Badge({
  children, tone = "neutral", icon: IconC, dot, size = "md", className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: React.ComponentType<{ className?: string }>;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] font-medium",
        size === "sm" ? "gap-1 px-1.5 py-px text-[10.5px]" : "gap-1.5 px-2 py-0.5 text-[11.5px]",
        t.soft, t.text, className,
      )}
    >
      {IconC && <IconC className={cn(size === "sm" ? "size-2.5" : "size-3", t.icon)} />}
      {dot && <span className={cn("size-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

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
    <span className={cn("inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5 text-[11px] font-medium", tint, className)}>
      {dot && <span className={cn("size-1.5 rounded-full", dot)} />}
      {label}
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// Canonical-vocabulary primitives (lib/fixtures). One status
// language everywhere — these are the ONLY renderers for it.
// ════════════════════════════════════════════════════════════

/** task status → badge tone + icon. The single status grammar for every surface. */
const STATUS_BADGE: Record<TaskStatus, { tone: Tone; icon: React.ComponentType<{ className?: string }> }> = {
  needs_decision:      { tone: "red",     icon: AlertCircle },
  ready_to_approve:    { tone: "amber",   icon: Clock3 },
  running:             { tone: "blue",    icon: CircleDot },
  scheduled:           { tone: "neutral", icon: CalendarClock },
  waiting_client:      { tone: "slate",   icon: Hourglass },
  waiting_third_party: { tone: "slate",   icon: Hourglass },
  done:                { tone: "emerald", icon: CheckCircle2 },
};

/** Task status as a soft-fill badge with a leading icon. THE status renderer for rows. */
export function StatusPill({ status, size = "md", className }: { status: TaskStatus; size?: "sm" | "md"; className?: string }) {
  const b = STATUS_BADGE[status];
  return <Badge tone={b.tone} icon={b.icon} size={size} className={className}>{taskStatusMeta[status].label}</Badge>;
}

/** Status as a section heading — colored icon + label, no fill. For group/list headers. */
export function StatusHeading({ status, className }: { status: TaskStatus; className?: string }) {
  const b = STATUS_BADGE[status];
  const t = TONE[b.tone];
  const IconC = b.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-semibold", t.text, className)}>
      <IconC className={cn("size-3.5", t.icon)} />
      {taskStatusMeta[status].label}
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

/** Deadline — colored text by proximity (<14d danger, <45d warning, else muted). Calm in dense
 * lists: no fill, urgent dates get a small clock. "Ext" prefix for extended deadlines. */
export function DeadlineChip({ iso, extended, className }: { iso: string; extended?: boolean; className?: string }) {
  const d = daysUntil(iso);
  const tone = d < 14 ? "text-red-600" : d < 45 ? "text-amber-600" : "text-[var(--os-ink-subtle)]";
  return (
    <span title={`${d} days away`} className={cn("inline-flex items-center gap-1 text-[11px] font-medium tabular-nums", tone, className)}>
      {d < 14 && <Clock3 className="size-3" />}
      {extended ? "Ext · " : ""}{fmtDate(iso)}
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
    <span title={m.blurb}>
      <Badge tone="neutral" size="sm" className={className}>{m.code} · {m.label}</Badge>
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

/** "Mine / Firm" segmented toggle — raised white chip on a recessed track. */
export function ScopeToggle({ scope, onChange, className }: { scope: Scope; onChange: (s: Scope) => void; className?: string }) {
  return (
    <Segmented
      className={className}
      value={scope}
      onChange={onChange}
      options={[{ value: "mine", label: "Mine" }, { value: "firm", label: "Firm" }]}
    />
  );
}

/** Generic segmented control — active option rides a raised surface chip. */
export function Segmented<T extends string>({
  options, value, onChange, className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-lg bg-[var(--os-selected)] p-0.5", className)} role="group">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          style={{ height: 26 }}
          className={cn(
            "rounded-md px-2.5 text-[12px] font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
            value === o.value
              ? "bg-[var(--os-surface)] text-[var(--os-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Button — one family. 2 sizes × 4 variants, identical motion.
// ════════════════════════════════════════════════════════════

export function Button({
  children, variant = "secondary", size = "md", icon: IconC, leading, className, ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: React.ComponentType<{ className?: string }>;
  leading?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]",
        size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]",
        variant === "primary" && "bg-[var(--os-primary)] text-[var(--os-primary-fg)] shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-black",
        variant === "secondary" && "border border-[var(--os-border-strong)] bg-[var(--os-surface)] text-[var(--os-ink)] shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-[var(--os-hover)] hover:border-[var(--os-border-hover)]",
        variant === "ghost" && "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
        variant === "danger" && "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        className,
      )}
    >
      {leading}
      {IconC && <IconC className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// FileGlyph — a page shape with a folded corner + type badge.
// ════════════════════════════════════════════════════════════

const FILE_BADGE: Record<string, { badge: string; label: string }> = {
  pdf:  { badge: "bg-red-500",     label: "PDF" },
  docx: { badge: "bg-blue-500",    label: "DOC" },
  xlsx: { badge: "bg-emerald-500", label: "XLS" },
  png:  { badge: "bg-violet-500",  label: "PNG" },
  jpg:  { badge: "bg-amber-500",   label: "JPG" },
};

export function FileGlyph({ kind, size = 36, className }: { kind: string; size?: number; className?: string }) {
  const t = FILE_BADGE[kind] ?? FILE_BADGE.pdf;
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size * 0.82, height: size }}>
      <svg viewBox="0 0 34 42" className="size-full" style={{ width: size * 0.82, height: size }}>
        <path
          d="M3 1.5h18L31.5 12v28a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 40V3A1.5 1.5 0 0 1 3 1.5Z"
          fill="#fff" stroke="var(--os-border-strong)" strokeWidth="1.25"
        />
        <path d="M21 1.5V10.5a1.5 1.5 0 0 0 1.5 1.5H31.5" fill="var(--os-card)" stroke="var(--os-border-strong)" strokeWidth="1.25" />
      </svg>
      <span
        className={cn("absolute left-0 grid place-items-center rounded-[3px] px-1 text-[7px] font-bold tracking-wide text-white", t.badge)}
        style={{ bottom: size * 0.16, height: Math.max(11, size * 0.26) }}
      >
        {t.label}
      </span>
    </span>
  );
}
