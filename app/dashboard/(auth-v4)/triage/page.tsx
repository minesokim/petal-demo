/**
 * Phase 1 placeholder for the triage surface.
 *
 * Exists so the (auth-v4) shell has something to render at
 * /dashboard/triage for visual review of Phase 1. The real queue list
 * + detail pane arrives in Phase 2 — see DOCKET-V4-PRD.md §5.1 and
 * design-references/docket-direction-b-v2.html.
 */
export default function TriagePlaceholderPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md px-8 text-center">
        <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.12em] text-ink-4 uppercase">
          Phase 1 · Shell
        </div>
        <h1
          className="font-serif text-[24px] font-medium leading-[1.18] text-ink"
          style={{
            letterSpacing: "-0.018em",
            fontVariationSettings: '"opsz" 144, "SOFT" 30'
          }}>
          Triage renders <span className="italic text-rust">here</span>
        </h1>
        <p className="mt-2 text-[13px] leading-[1.5] text-ink-3">
          The queue list and detail pane arrive in Phase 2. This page exists so the
          header, nav, and status bar can be reviewed in place.
        </p>
      </div>
    </div>
  );
}
