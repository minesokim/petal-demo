"use client";

// Hidden acceptance surface: every displayed aggregate next to its derivation.
// Any FAIL here is a build failure. Not linked from nav — visit /os/debug/tie-out.

import { tieOutChecks } from "@/lib/fixtures/derive";
import { DEMO_DATE_LABEL } from "@/lib/fixtures/vocab";
import { cn } from "@/lib/utils";

export default function TieOutPage() {
  const checks = tieOutChecks();
  const bad = checks.filter(c => !c.ok);

  return (
    <div className="petal-os h-full overflow-y-auto bg-[var(--os-canvas)] px-8 py-6 text-[13px] text-[var(--os-ink)]">
      <div className="mx-auto max-w-[980px]">
        <h1 className="os-display text-[20px] font-semibold">Tie-out</h1>
        <p className="mt-1 text-[var(--os-ink-muted)]">
          Demo date {DEMO_DATE_LABEL}. Every displayed aggregate, next to its derivation. A mismatch is a build failure.
        </p>

        <div
          className={cn(
            "mt-4 rounded-lg border px-4 py-3 font-medium",
            bad.length
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[var(--os-border)] bg-[var(--os-card)] text-[var(--os-success)]",
          )}
        >
          {bad.length ? `${bad.length} mismatch(es) — the world does not tie out.` : `All ${checks.length} checks tie out.`}
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-[var(--os-border)]">
          <div className="grid grid-cols-[110px_minmax(180px,1.2fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_minmax(220px,1.4fr)] gap-x-4 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-4 py-2 text-[11px] font-medium text-[var(--os-ink-muted)]">
            <span>Result</span><span>Surface</span><span>Check</span><span>Displayed</span><span>Derivation</span>
          </div>
          {checks.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-[110px_minmax(180px,1.2fr)_minmax(140px,1fr)_minmax(120px,0.9fr)_minmax(220px,1.4fr)] gap-x-4 border-b border-[var(--os-border)] px-4 py-2 last:border-b-0"
            >
              <span className={cn("inline-flex items-center gap-1.5 font-medium", c.ok ? "text-[var(--os-success)]" : "text-[var(--os-danger)]")}>
                <span className={cn("size-1.5 rounded-full", c.ok ? "bg-emerald-500" : "bg-red-500")} />
                {c.ok ? "PASS" : "FAIL"}
              </span>
              <span className="text-[var(--os-ink-muted)]">{c.surface}</span>
              <span>{c.label}</span>
              <span className="tabular-nums font-medium">{c.displayed}</span>
              <span className="text-[var(--os-ink-muted)]">{c.derivation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
