"use client";

// FeatureCallout — the "crafted moment" panel (DESIGN.md §7): a soft sage→cream
// gradient box with copy + one primary action on the left and a live, slightly
// inset preview of the real artifact on the right. Max one per page.

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";

export function FeatureCallout({
  eyebrow,
  title,
  body,
  action,
  secondary,
  preview,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  body: string;
  action: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** the embedded artifact preview — rendered on the tinted right pane */
  preview: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative grid overflow-hidden rounded-xl border border-[var(--os-border)]",
        "bg-[linear-gradient(105deg,#edf4ec_0%,#f6f5ec_48%,#fbfaf9_100%)]",
        "md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]",
        className,
      )}
    >
      {/* copy + actions */}
      <div className="flex flex-col justify-center gap-1 px-6 py-6 md:py-7">
        {eyebrow && <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]">{eyebrow}</div>}
        <h3 className="os-display text-[18px] font-semibold leading-snug tracking-[-0.01em] text-[var(--os-ink)]">{title}</h3>
        <p className="mt-1 max-w-[36ch] text-[12.5px] leading-relaxed text-[var(--os-ink-muted)]">{body}</p>
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={action.href}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
          >
            {action.label}
            <Icon icon={I.chevronRight} size={13} className="transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="inline-flex h-8 items-center rounded-md px-2.5 text-[13px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>

      {/* embedded artifact preview — deeper tint pane, white card floats on it */}
      <Link
        href={action.href}
        aria-label={action.label}
        className="relative hidden min-h-[170px] items-center justify-center overflow-hidden bg-[#eceadf]/60 px-6 pt-7 md:flex focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]"
      >
        <div className="pointer-events-none w-full max-w-[330px] translate-y-2 select-none rounded-t-lg border border-b-0 border-[var(--os-border)] bg-white px-4 pb-2 pt-3.5 shadow-[0_1px_2px_rgba(17,17,26,0.04),0_12px_28px_-12px_rgba(17,17,26,0.18)] transition-transform duration-200 ease-out group-hover:translate-y-1">
          {preview}
        </div>
      </Link>
    </div>
  );
}
