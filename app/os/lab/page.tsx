"use client";

/**
 * COMPONENT LAB - scratch surface for crafting the "little things".
 * Proposed variants live INLINE here so we can iterate freely without
 * touching components/os/primitives.tsx. Once a look is locked, we
 * promote the winner into primitives.tsx and delete its lab copy.
 *
 * Not linked in nav for users - reach it at /os/lab.
 */

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock3, AlertCircle, CircleDot, CalendarClock, Hourglass,
  Plus, ArrowRight, X, Check,
} from "lucide-react";

// Current primitives, for side-by-side reference
import {
  StatusPill, DeadlineChip, Pill, TrustTierTag, ScopeToggle, PetalLogo, type Scope,
} from "@/components/os/primitives";
import { TASK_STATUS_ORDER, taskStatusMeta } from "@/lib/fixtures/vocab";

// ════════════════════════════════════════════════════════════
// PROPOSED - Badge (one primitive, soft-fill + optional icon)
// ════════════════════════════════════════════════════════════

type Tone = "emerald" | "amber" | "red" | "blue" | "violet" | "slate" | "neutral";

const TONE: Record<Tone, { soft: string; text: string; ring: string; dot: string; icon: string }> = {
  emerald: { soft: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-600/15", dot: "bg-emerald-500", icon: "text-emerald-500" },
  amber:   { soft: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-600/15",   dot: "bg-amber-500",   icon: "text-amber-500" },
  red:     { soft: "bg-red-50",     text: "text-red-700",     ring: "ring-red-600/15",     dot: "bg-red-500",     icon: "text-red-500" },
  blue:    { soft: "bg-blue-50",    text: "text-blue-700",    ring: "ring-blue-600/15",    dot: "bg-blue-500",    icon: "text-blue-500" },
  violet:  { soft: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-600/15",  dot: "bg-violet-500",  icon: "text-violet-500" },
  slate:   { soft: "bg-slate-100",  text: "text-slate-600",   ring: "ring-slate-500/15",   dot: "bg-slate-400",   icon: "text-slate-400" },
  neutral: { soft: "bg-[var(--os-selected)]", text: "text-[var(--os-ink-muted)]", ring: "ring-black/[0.06]", dot: "bg-[var(--os-ink-subtle)]", icon: "text-[var(--os-ink-subtle)]" },
};

function Badge({
  children, tone = "neutral", icon: IconC, dot, ring = true, size = "md",
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: React.ComponentType<{ className?: string }>;
  dot?: boolean;
  ring?: boolean;
  size?: "sm" | "md";
}) {
  const t = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[5px] font-medium",
        ring && "ring-1 ring-inset",
        size === "sm" ? "gap-1 px-1.5 py-px text-[10.5px]" : "gap-1.5 px-2 py-0.5 text-[11.5px]",
        t.soft, t.text, ring && t.ring,
      )}
    >
      {IconC && <IconC className={cn(size === "sm" ? "size-2.5" : "size-3", t.icon)} />}
      {dot && <span className={cn("size-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

// task status → proposed badge mapping
const STATUS_BADGE: Record<string, { tone: Tone; icon: React.ComponentType<{ className?: string }> }> = {
  needs_decision:      { tone: "red",     icon: AlertCircle },
  ready_to_approve:    { tone: "amber",   icon: Clock3 },
  running:             { tone: "blue",    icon: CircleDot },
  scheduled:           { tone: "neutral", icon: CalendarClock },
  waiting_client:      { tone: "slate",   icon: Hourglass },
  waiting_third_party: { tone: "slate",   icon: Hourglass },
  done:                { tone: "emerald", icon: CheckCircle2 },
};

// ════════════════════════════════════════════════════════════
// PROPOSED - FileGlyph (page shape + folded corner + type badge)
// ════════════════════════════════════════════════════════════

type FileKind = "pdf" | "docx" | "xlsx" | "png" | "jpg";
const FILE_TONE: Record<FileKind, { badge: string; label: string }> = {
  pdf:  { badge: "bg-red-500",     label: "PDF" },
  docx: { badge: "bg-blue-500",    label: "DOC" },
  xlsx: { badge: "bg-emerald-500", label: "XLS" },
  png:  { badge: "bg-violet-500",  label: "PNG" },
  jpg:  { badge: "bg-amber-500",   label: "JPG" },
};

function FileGlyph({ kind, size = 36 }: { kind: FileKind; size?: number }) {
  const t = FILE_TONE[kind];
  const fold = Math.round(size * 0.3);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size * 0.82, height: size }}>
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

// Current Documents glyph, for reference (flat colored square)
function KindTileCurrent({ kind }: { kind: FileKind }) {
  const c = kind === "pdf" ? "bg-red-500" : kind === "docx" ? "bg-blue-500" : kind === "xlsx" ? "bg-emerald-500" : kind === "png" ? "bg-violet-500" : "bg-amber-500";
  return <span className={cn("grid size-9 place-items-center rounded-lg text-[9px] font-bold text-white", c)}>{FILE_TONE[kind].label}</span>;
}

// ════════════════════════════════════════════════════════════
// PROPOSED - Button family (2 sizes × 4 variants, identical states)
// ════════════════════════════════════════════════════════════

function Btn({
  children, variant = "secondary", size = "md", icon: IconC, leading,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: React.ComponentType<{ className?: string }>;
  leading?: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]",
        size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]",
        variant === "primary" && "bg-[var(--os-primary)] text-[var(--os-primary-fg)] shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-black",
        variant === "secondary" && "border border-[var(--os-border-strong)] bg-[var(--os-surface)] text-[var(--os-ink)] shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-[var(--os-hover)] hover:border-[var(--os-border-hover)]",
        variant === "ghost" && "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
        variant === "danger" && "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
      )}
    >
      {leading}
      {IconC && <IconC className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// PROPOSED - Segmented (crisp active state, sliding indicator feel)
// ════════════════════════════════════════════════════════════

function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-[var(--os-selected)] p-0.5">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-6.5 rounded-md px-2.5 text-[12px] font-medium transition-all",
            value === o.value
              ? "bg-[var(--os-surface)] text-[var(--os-ink)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
          )}
          style={{ height: 26 }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Layout scaffolding
// ════════════════════════════════════════════════════════════

function Section({ title, blurb, children }: { title: string; blurb: string; children: ReactNode }) {
  return (
    <section className="border-t border-[var(--os-border)] py-8 first:border-t-0">
      <div className="mb-5">
        <h2 className="text-[15px] font-semibold text-[var(--os-ink)]">{title}</h2>
        <p className="mt-0.5 max-w-2xl text-[12.5px] text-[var(--os-ink-muted)]">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-start gap-4 py-3">
      <div className="pt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--os-ink-subtle)]">{label}</div>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  );
}

const FILE_KINDS: FileKind[] = ["pdf", "docx", "xlsx", "png", "jpg"];

export default function LabPage() {
  const [scope, setScope] = useState<Scope>("firm");
  const [density, setDensity] = useState<"compact" | "cozy" | "comfortable">("cozy");
  const [ringed, setRinged] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-[var(--os-surface)]">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <header className="mb-2">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--os-ink-subtle)]">Internal · scratch surface</div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.01em] text-[var(--os-ink)]">Component lab</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--os-ink-muted)]">
            Current vs. proposed for the little things. We iterate here, then promote the locked
            variants into <code className="rounded bg-[var(--os-selected)] px-1 py-0.5 text-[11.5px]">primitives.tsx</code>.
          </p>
        </header>

        {/* ── BADGES ───────────────────────────────────────── */}
        <Section
          title="Status badges"
          blurb="Today every status is a bare dot + gray text. The proposal: one soft-fill pill with a small leading icon and color-matched text - the same family everywhere (ref: IMG_7007)."
        >
          <Row label="Current">
            {TASK_STATUS_ORDER.map(s => <StatusPill key={s} status={s} />)}
          </Row>
          <Row label="Proposed">
            {TASK_STATUS_ORDER.map(s => {
              const b = STATUS_BADGE[s];
              return <Badge key={s} tone={b.tone} icon={b.icon} ring={ringed}>{taskStatusMeta[s].label}</Badge>;
            })}
          </Row>
          <Row label="Variants">
            <Badge tone="emerald" icon={CheckCircle2} ring={ringed}>Filed</Badge>
            <Badge tone="emerald" dot ring={ringed}>Filed</Badge>
            <Badge tone="emerald" ring={ringed}>Filed</Badge>
            <Badge tone="emerald" size="sm" icon={CheckCircle2} ring={ringed}>Filed</Badge>
            <button
              onClick={() => setRinged(r => !r)}
              className="ml-2 rounded-md border border-[var(--os-border-strong)] px-2 py-1 text-[11px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"
            >
              ring: {ringed ? "on" : "off"}
            </button>
          </Row>
        </Section>

        {/* ── DEADLINE CHIPS ───────────────────────────────── */}
        <Section
          title="Deadline chips"
          blurb="Proximity-colored date pills. The proposal keeps the proximity logic but aligns the chip to the badge family - same radius, same soft-fill, optional clock icon."
        >
          <Row label="Current">
            <DeadlineChip iso="2026-06-30" />
            <DeadlineChip iso="2026-07-20" />
            <DeadlineChip iso="2026-10-15" extended />
          </Row>
          <Row label="Proposed">
            <Badge tone="red" icon={Clock3} ring={ringed}>Jun 30</Badge>
            <Badge tone="amber" icon={Clock3} ring={ringed}>Jul 20</Badge>
            <Badge tone="neutral" ring={ringed}>Ext · Oct 15</Badge>
          </Row>
        </Section>

        {/* ── ROLE / META CHIPS ────────────────────────────── */}
        <Section
          title="Role & meta chips"
          blurb="Role chips already use soft-fill (the closest thing we have to the target). Proposal: same Badge primitive so roles, trust tiers, and metadata all share one shape."
        >
          <Row label="Current">
            <Pill label="Owner" tint="bg-emerald-50 text-emerald-700" dot="bg-emerald-500" />
            <Pill label="Reviewer" tint="bg-violet-50 text-violet-700" dot="bg-violet-500" />
            <Pill label="Preparer" tint="bg-blue-50 text-blue-700" dot="bg-blue-500" />
            <TrustTierTag tier={1} />
          </Row>
          <Row label="Proposed">
            <Badge tone="emerald" dot ring={ringed}>Owner</Badge>
            <Badge tone="violet" dot ring={ringed}>Reviewer</Badge>
            <Badge tone="blue" dot ring={ringed}>Preparer</Badge>
            <Badge tone="neutral" size="sm" ring={ringed}>T1 · Draft</Badge>
          </Row>
        </Section>

        {/* ── FILE GLYPHS ──────────────────────────────────── */}
        <Section
          title="File glyphs"
          blurb="Documents uses flat colored squares - they don't read as files. The proposal: a page shape with a folded corner and the type badge sitting on it (ref: IMG_6999 / 7001 / 7002)."
        >
          <Row label="Current">
            {FILE_KINDS.map(k => <KindTileCurrent key={k} kind={k} />)}
          </Row>
          <Row label="Proposed">
            {FILE_KINDS.map(k => <FileGlyph key={k} kind={k} />)}
          </Row>
          <Row label="In a row">
            <div className="w-full max-w-md divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
              {([["pdf", "2024 Form 1040.pdf", "1.2 MB"], ["xlsx", "Q3 Reconciliation.xlsx", "88 KB"], ["docx", "Engagement Letter.docx", "32 KB"]] as const).map(([k, name, sz]) => (
                <div key={name} className="flex items-center gap-3 px-3 py-2.5">
                  <FileGlyph kind={k as FileKind} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{name}</div>
                    <div className="text-[11px] text-[var(--os-ink-subtle)]">{sz}</div>
                  </div>
                  <Badge tone="emerald" size="sm" icon={Check} ring={ringed}>Have</Badge>
                </div>
              ))}
            </div>
          </Row>
        </Section>

        {/* ── BUTTONS ──────────────────────────────────────── */}
        <Section
          title="Buttons"
          blurb="Today's buttons drift in height, radius, and hover state between surfaces. The proposal is one family: 2 sizes × 4 variants with identical motion (subtle press, consistent shadows)."
        >
          <Row label="Primary">
            <Btn variant="primary" icon={Plus}>New return</Btn>
            <Btn variant="primary" size="sm">Approve & send</Btn>
          </Row>
          <Row label="Secondary">
            <Btn variant="secondary" leading={<PetalLogo size={15} />}>Draft with Petal</Btn>
            <Btn variant="secondary" size="sm">Reschedule</Btn>
          </Row>
          <Row label="Ghost">
            <Btn variant="ghost" icon={ArrowRight}>Open client</Btn>
            <Btn variant="ghost" size="sm">Dismiss</Btn>
          </Row>
          <Row label="Danger">
            <Btn variant="danger" icon={X} size="sm">Decline</Btn>
          </Row>
        </Section>

        {/* ── SEGMENTED ────────────────────────────────────── */}
        <Section
          title="Segmented controls"
          blurb="The Mine/Firm toggle and view switchers are flat. The proposal gives the active segment a raised white chip on a recessed track - crisper, more tactile (ref: IMG_7038–7045)."
        >
          <Row label="Current">
            <ScopeToggle scope={scope} onChange={setScope} />
          </Row>
          <Row label="Proposed">
            <Segmented
              options={[{ value: "mine", label: "Mine" }, { value: "firm", label: "Firm" }]}
              value={scope}
              onChange={setScope}
            />
            <Segmented
              options={[{ value: "compact", label: "Compact" }, { value: "cozy", label: "Cozy" }, { value: "comfortable", label: "Comfortable" }]}
              value={density}
              onChange={setDensity}
            />
          </Row>
        </Section>

        <div className="h-16" />
      </div>
    </div>
  );
}
