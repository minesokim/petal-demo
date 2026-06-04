import { type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { autonomyMeta, type Autonomy } from "@/lib/os-agents";
import { trustMeta, type Tier, type Trust } from "@/lib/os-triage";

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

export function AutonomyPill({ autonomy, className }: { autonomy: Autonomy; className?: string }) {
  const m = autonomyMeta[autonomy];
  return <Pill label={m.label} tint={m.pill} dot={m.dot} className={className} />;
}

/**
 * Linear status circle — pie-fill for active tiers, dashed for waiting, check when done.
 * Shared so Tasks, the client record, and any other task surface render an identical glyph.
 */
export function TierGlyph({ tier }: { tier: Tier }) {
  if (tier === "needs_review") {
    return <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden><circle cx="8" cy="8" r="7" fill="#10b981" /><path d="M5 8.3l2 2 4-4.4" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (tier === "waiting") {
    return <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden><circle cx="8" cy="8" r="6.4" fill="none" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="1.8 2" /></svg>;
  }
  const color = tier === "right_now" ? "#ef4444" : "#f59e0b";
  const frac = tier === "right_now" ? 0.8 : 0.45;
  const C = 2 * Math.PI * 3;
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <circle cx="8" cy="8" r="6.4" fill="none" stroke={color} strokeWidth="1.4" />
      <circle cx="8" cy="8" r="3" fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${(C * frac).toFixed(2)} ${C.toFixed(2)}`} transform="rotate(-90 8 8)" />
    </svg>
  );
}

/** Trust tier as a bordered dot + label pill — the Tasks-row grammar. */
export function TrustPill({ trust, className }: { trust: Trust; className?: string }) {
  const m = trustMeta[trust];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-[var(--os-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)]", className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} /> {m.label}
    </span>
  );
}
