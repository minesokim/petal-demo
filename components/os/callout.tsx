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
        "group relative grid overflow-hidden rounded-2xl border border-[var(--os-border)]",
        // one continuous sage → cream gradient across the whole panel (no second pane tint)
        "bg-[linear-gradient(115deg,#e9f3e7_0%,#f2f1e8_50%,#efece2_100%)]",
        "md:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]",
        className,
      )}
    >
      {/* copy + actions */}
      <div className="flex flex-col justify-center gap-1 px-7 py-7">
        {eyebrow && <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--os-ink-muted)]">{eyebrow}</div>}
        <h3 className="os-display text-[19px] font-semibold leading-snug tracking-[-0.01em] text-[var(--os-ink)]">{title}</h3>
        <p className="mt-1.5 max-w-[38ch] text-[12.5px] leading-relaxed text-[var(--os-ink-muted)]">{body}</p>
        <div className="mt-5 flex items-center gap-1.5">
          <Link
            href={action.href}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--os-primary)] px-3.5 text-[13px] font-medium text-[var(--os-primary-fg)] shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-all duration-150 ease-out hover:bg-black active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--os-accent)]"
          >
            {action.label}
            <Icon icon={I.chevronRight} size={13} className="transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="inline-flex h-8 items-center rounded-lg px-2.5 text-[13px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--os-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>

      {/* embedded artifact preview — a clean floating card on the same gradient */}
      <Link
        href={action.href}
        aria-label={action.label}
        className="relative hidden items-center justify-center px-7 py-7 md:flex focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]"
      >
        <div className="pointer-events-none w-full max-w-[340px] select-none rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-4 shadow-[0_1px_2px_rgba(17,17,26,0.05),0_14px_32px_-14px_rgba(17,17,26,0.22)] transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
          {preview}
        </div>
      </Link>
    </div>
  );
}
