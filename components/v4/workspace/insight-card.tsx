import * as React from "react";
import { cn } from "@/lib/utils";
import { SerifWithAccent } from "@/components/v4/text";
import type { ClientInsight } from "@/lib/v4/clients";

/**
 * InsightCard (workspace variant) — rust-left-border card with
 * grounding meta row, serif body with italic rust accents, 4-column
 * data strip, and an action button row across the bottom.
 *
 * Visually similar to triage's DetailPane insight block but slightly
 * larger (16px body vs 15.5px) and includes its own action bar.
 */
export function InsightCard({ insight }: { insight: ClientInsight }) {
  return (
    <div className="rounded-[5px] border border-hairline border-l-2 border-l-rust bg-surface px-5 py-4">
      <div className="mb-2.5 flex items-center gap-2.5 font-mono text-[10px]">
        <span className="flex items-center gap-1.5 font-[600] tracking-[0.12em] text-rust uppercase before:block before:size-[5px] before:rounded-full before:bg-rust">
          Insight
        </span>
        <span className="tracking-[0.02em] text-ink-4">
          {insight.grounding.map((g, i) => (
            <React.Fragment key={g}>
              {g}
              {i < insight.grounding.length - 1 ? <span className="mx-1 text-ink-5">·</span> : null}
            </React.Fragment>
          ))}
        </span>
      </div>

      <p
        className="mb-3.5 font-serif text-[16px] leading-[1.55] text-ink"
        style={{
          letterSpacing: "-0.003em",
          fontVariationSettings: '"opsz" 14, "SOFT" 50'
        }}>
        <SerifWithAccent text={insight.body} />
      </p>

      <div className="mb-3.5 grid grid-cols-4 border-t border-hairline pt-3.5">
        {insight.stats.map((s, i) => (
          <div
            key={s.label}
            className={cn("pr-4", i < insight.stats.length - 1 && "border-r border-hairline")}>
            <div className="mb-[3px] font-mono text-[9.5px] font-medium tracking-[0.11em] text-ink-4 uppercase">
              {s.label}
            </div>
            <div
              className={cn(
                "font-mono text-[17px] font-medium tabular-nums",
                s.rust ? "text-rust" : "text-ink"
              )}
              style={{ letterSpacing: "-0.005em" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 border-t border-hairline pt-3">
        {insight.actions.map((a, i) => (
          <InsightButton key={a.label} primary={a.primary || (i === 0 && !insight.actions.some((x) => x.primary))}>
            {a.label}
            {a.kbd ? (
              <InsightKbd primary={a.primary || (i === 0 && !insight.actions.some((x) => x.primary))}>
                {a.kbd}
              </InsightKbd>
            ) : null}
          </InsightButton>
        ))}
      </div>
    </div>
  );
}

function InsightButton({
  children,
  primary
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-[7px] rounded-[4px] border px-[11px] py-[6px] text-[12.5px] font-medium transition-colors",
        "border-hairline bg-surface text-ink-2 hover:bg-surface-2",
        primary && "border-ink bg-ink text-bg hover:bg-ink-2"
      )}
      style={{ letterSpacing: "-0.003em" }}>
      {children}
    </button>
  );
}

function InsightKbd({ children, primary }: { children: React.ReactNode; primary?: boolean }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded-[2px] border px-1 font-mono text-[9.5px] tracking-[0.02em]",
        primary
          ? "border-white/15 bg-white/[0.08] text-white/75"
          : "border-hairline bg-bg text-ink-3"
      )}
      style={{ lineHeight: "14px" }}>
      {children}
    </kbd>
  );
}
