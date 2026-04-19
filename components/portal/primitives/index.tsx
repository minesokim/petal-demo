import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Portal primitives — shared layout + typography + form atoms for
 * the v4 client portal (both the intake flow and the post-login
 * tabs). Translated from the Claude-designed reference at
 * design-references/client-portal/components/*.jsx.
 *
 * The portal uses a mobile-first 390px-wide canvas. Every screen is
 * an independent full-height flex column; primitives here are the
 * shared chrome above/below the per-screen content.
 *
 * Visual language:
 *  - bg:     cream paper   (bg-portal-bg)
 *  - card:   white-on-cream (bg-portal-card)
 *  - accent: forest green  (text-forest / bg-forest — distinct from
 *            the preparer-side rust accent so clients and Antonio
 *            see visually different surfaces)
 *  - serif:  Fraunces italic for editorial moments
 *  - sans:   DM Sans for chrome + body
 *  - mono:   DM Sans (monospace role is filled by tight-tracking
 *            uppercase labels, not a separate mono face on the client)
 */

/* ─────────────────────── Layout ─────────────────────── */

export function Screen({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-full w-full flex-col bg-portal-bg text-portal-ink",
        "font-sans",
        className
      )}>
      {children}
    </div>
  );
}

export function Stack({
  children,
  gap = 16,
  className,
  style
}: {
  children: React.ReactNode;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("flex flex-col", className)}
      style={{ gap, ...style }}>
      {children}
    </div>
  );
}

export function Row({
  children,
  gap = 10,
  justify = "start",
  align = "center",
  className,
  style
}: {
  children: React.ReactNode;
  gap?: number;
  justify?: "start" | "center" | "end" | "space-between";
  align?: "start" | "center" | "end" | "baseline";
  className?: string;
  style?: React.CSSProperties;
}) {
  const justifyClass = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    "space-between": "justify-between"
  }[justify];
  const alignClass = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    baseline: "items-baseline"
  }[align];
  return (
    <div
      className={cn("flex", justifyClass, alignClass, className)}
      style={{ gap, ...style }}>
      {children}
    </div>
  );
}

/* ─────────────────────── Typography ─────────────────────── */

export function H1({
  children,
  className,
  style
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <h1
      className={cn(
        "font-serif text-[32px] font-medium leading-[1.08] tracking-[-0.02em] text-portal-ink text-balance",
        className
      )}
      style={{
        fontVariationSettings: '"opsz" 48',
        fontSynthesis: "none",
        ...style
      }}>
      {children}
    </h1>
  );
}

export function H2({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-serif text-[22px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink",
        className
      )}
      style={{
        fontVariationSettings: '"opsz" 24',
        fontSynthesis: "none"
      }}>
      {children}
    </h2>
  );
}

export function Body({
  children,
  size = 15,
  className,
  style
}: {
  children: React.ReactNode;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <p
      className={cn("text-portal-ink-soft leading-[1.5]", className)}
      style={{ fontSize: size, ...style }}>
      {children}
    </p>
  );
}

export function Eyebrow({
  children,
  className,
  color = "muted"
}: {
  children: React.ReactNode;
  className?: string;
  color?: "muted" | "forest";
}) {
  return (
    <span
      className={cn(
        "text-[10px] font-medium uppercase tracking-[0.12em]",
        color === "forest" ? "text-forest-ink" : "text-portal-muted",
        className
      )}>
      {children}
    </span>
  );
}

/* ─────────────────────── Buttons ─────────────────────── */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth,
      className,
      disabled,
      ...rest
    },
    ref
  ) {
    const variantClass = {
      primary: cn(
        "bg-forest text-white",
        "hover:bg-forest-2",
        "disabled:bg-portal-border disabled:text-portal-muted"
      ),
      secondary: cn(
        "border border-portal-border bg-portal-card text-portal-ink",
        "hover:bg-portal-bg-elev",
        "disabled:border-portal-border-soft disabled:text-portal-muted"
      ),
      ghost: cn(
        "text-portal-ink-soft hover:bg-portal-bg-elev",
        "disabled:text-portal-muted"
      )
    }[variant];

    const sizeClass = {
      sm: "px-3 py-2 text-[13px] rounded-[10px]",
      md: "px-5 py-3 text-[14px] rounded-xl",
      lg: "px-[22px] py-4 text-[16px] rounded-[14px]"
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium",
          "transition-colors",
          "disabled:cursor-not-allowed",
          "active:scale-[0.98] transition-transform duration-150",
          fullWidth && "w-full",
          variantClass,
          sizeClass,
          className
        )}
        {...rest}>
        {children}
      </button>
    );
  }
);

/* ─────────────────────── Form fields ─────────────────────── */

export function FieldLabel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-portal-muted",
        className
      )}>
      {children}
    </div>
  );
}

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, className, ...rest }, ref) {
    return (
      <div className="w-full">
        {label ? <FieldLabel>{label}</FieldLabel> : null}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-[14px] border border-portal-border bg-portal-card px-[18px] py-4",
            "text-[16px] text-portal-ink tracking-[0.01em]",
            "outline-none transition-[border-color,box-shadow] duration-150",
            "focus:border-forest focus:shadow-[0_0_0_3px_var(--portal-forest-tint)]",
            "placeholder:text-portal-muted",
            className
          )}
          {...rest}
        />
      </div>
    );
  }
);

/* ─────────────────────── Progress bar ─────────────────────── */

export function ProgressBar({
  value,
  total
}: {
  value: number;
  total: number;
}) {
  const pct = Math.max(0, Math.min((value / Math.max(total, 1)) * 100, 100));
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-portal-border-soft">
      <div
        className="h-full rounded-full bg-forest transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
    </div>
  );
}

/* ─────────────────────── Intake chrome ─────────────────────── */

/**
 * Sticky top chrome on every intake step. Shows the step indicator
 * ("03 of 13") + area label ("Personal info") + progress bar below.
 */
export function IntakeHeader({
  step,
  subStep,
  label,
  total = 13
}: {
  step?: number;
  subStep?: "A" | "B";
  label: string;
  total?: number;
}) {
  if (!step) {
    return (
      <div className="sticky top-0 z-10 border-b border-portal-border-soft bg-portal-bg px-6 pt-3.5 pb-3">
        <Row justify="space-between" className="mb-2.5">
          <Eyebrow>Final step</Eyebrow>
          <Eyebrow>{label}</Eyebrow>
        </Row>
        <ProgressBar value={total} total={total} />
      </div>
    );
  }
  const stepLabel = subStep
    ? `${String(step).padStart(2, "0")}${subStep} of ${total}`
    : `${String(step).padStart(2, "0")} of ${total}`;
  const progressValue = subStep === "B" ? step + 0.5 : step;
  return (
    <div className="sticky top-0 z-10 border-b border-portal-border-soft bg-portal-bg px-6 pt-3.5 pb-3">
      <Row justify="space-between" className="mb-2.5">
        <Eyebrow>{stepLabel}</Eyebrow>
        <Eyebrow>{label}</Eyebrow>
      </Row>
      <ProgressBar value={progressValue} total={total} />
    </div>
  );
}

/**
 * Bottom sticky action bar — gradient fade so content scrolls
 * smoothly underneath. Typically houses Back + Continue buttons.
 */
export function BottomBar({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex gap-2.5 px-6 pt-6 pb-8",
        className
      )}
      style={{
        background:
          "linear-gradient(to top, var(--portal-bg) 70%, transparent)"
      }}>
      {children}
    </div>
  );
}

export function Footer() {
  return (
    <div className="px-6 pt-5 pb-7 text-center text-[10px] font-medium uppercase tracking-[0.05em] text-portal-muted">
      Antonio Vazquez, Enrolled Agent · Claremont, CA
    </div>
  );
}

/**
 * AntonioNote — editorial margin-note used throughout intake steps.
 * A serif italic aside attributed to "— Antonio · EA · Claremont" so
 * the voice carries the signal rather than a filled UI box.
 *
 * The italic uses Fraunces directly (the var(--font-fraunces) stack)
 * with font-synthesis: none, matching the critique fix we did on the
 * triage tagline — P22 Mackinac ships roman-only in our build so any
 * serif italic body text must route through Fraunces for real glyphs.
 */
export function AntonioNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2.5 border-l border-forest-soft pl-4">
      <p
        className="text-portal-ink-soft italic text-[15.5px] leading-[1.55] tracking-[-0.003em] text-balance"
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontVariationSettings: '"opsz" 18',
          fontSynthesis: "none"
        }}>
        {children}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className="font-serif text-[13px] text-portal-muted leading-none"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          aria-hidden>
          —
        </span>
        <Eyebrow color="forest">Antonio</Eyebrow>
        <span
          aria-hidden
          className="h-px max-w-[40px] flex-1 bg-portal-border-soft"
        />
        <span className="text-[9.5px] font-medium uppercase tracking-[0.1em] text-portal-muted">
          EA · Claremont
        </span>
      </div>
    </div>
  );
}

/**
 * AvatarSlot — placeholder for Antonio's portrait (served from
 * /public/assets/antonio.webp once uploaded). Falls back to a forest
 * gradient circle with "A" so the screen always renders.
 */
export function AvatarSlot({
  size = 72,
  className
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full text-white shadow-[0_4px_16px_rgba(51,94,69,0.22)]",
        className
      )}
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, var(--portal-forest) 0%, var(--portal-forest-2) 100%)",
        fontFamily: "var(--font-fraunces), Georgia, serif",
        fontSize: size * 0.42,
        fontWeight: 500,
        fontVariationSettings: '"opsz" 36'
      }}
      aria-label="Antonio Vazquez">
      A
    </div>
  );
}

/* ─────────────────────── Back button ─────────────────────── */

export function BackButton({
  onClick,
  className
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-ml-2 inline-flex items-center gap-1.5 px-2 py-1.5 text-[14px] text-portal-ink-soft",
        "hover:text-portal-ink transition-colors",
        className
      )}>
      <svg
        width="8"
        height="13"
        viewBox="0 0 8 13"
        fill="none"
        aria-hidden>
        <path
          d="M7 1L1 6.5L7 12"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      Back
    </button>
  );
}

/* ─────────────────────── Selectable row ─────────────────────── */

/**
 * OptionRow — the universal "pick one of these" card used by filing
 * status, path, addons, income sources, etc.
 */
export function OptionRow({
  selected,
  onClick,
  icon,
  title,
  sub,
  right,
  disabled,
  className
}: {
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-[14px] border px-[18px] py-[14px] text-left transition-[border-color,background-color,box-shadow] duration-150",
        selected
          ? "border-forest bg-forest-tint shadow-[0_0_0_1px_var(--portal-forest)]"
          : "border-portal-border bg-portal-card hover:bg-portal-bg-elev",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.995] transition-transform",
        className
      )}>
      {icon ? (
        <span
          className={cn(
            "flex size-10 flex-shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-forest text-white" : "bg-portal-bg-elev text-portal-ink-soft"
          )}
          aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[15px] font-medium text-portal-ink">{title}</span>
        {sub ? (
          <span className="text-[13px] leading-[1.4] text-portal-muted">
            {sub}
          </span>
        ) : null}
      </span>
      {right}
    </button>
  );
}
