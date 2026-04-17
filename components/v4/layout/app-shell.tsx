import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * AppShell — the v4 three-pane layout primitive.
 *
 * Layout (per DOCKET-V4-PRD.md §3 and design-references/docket-direction-b-v2.html):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ header (48px, full width)                    │
 *   ├────────┬──────────────────────────┬──────────┤
 *   │ nav    │ main (flex)              │ context  │
 *   │ 200px  │                          │ 320px    │
 *   │        │                          │ optional │
 *   ├────────┴──────────────────────────┴──────────┤
 *   │ status (28px, full width)                    │
 *   └──────────────────────────────────────────────┘
 *
 * The `main` region can itself be split (e.g. triage uses 440px list + flex detail).
 * The `context` column is optional — triage omits it, client workspace uses it.
 *
 * Rendered via CSS grid with named areas so consumers do not have to know
 * row/column numbers. Height pinned to 100vh; each region scrolls independently.
 */
export interface AppShellProps {
  header: React.ReactNode;
  nav: React.ReactNode;
  status: React.ReactNode;
  children: React.ReactNode;
  /** Optional 320px right-hand context panel (used by client workspace). */
  context?: React.ReactNode;
  className?: string;
}

export function AppShell({
  header,
  nav,
  status,
  children,
  context,
  className
}: AppShellProps) {
  const hasContext = Boolean(context);

  return (
    <div
      data-app-shell=""
      data-has-context={hasContext || undefined}
      className={cn(
        "grid h-screen w-screen overflow-hidden bg-bg text-ink font-sans",
        className
      )}
      style={{
        gridTemplateRows: "48px 1fr 28px",
        gridTemplateColumns: hasContext
          ? "200px minmax(0, 1fr) 320px"
          : "200px minmax(0, 1fr)",
        gridTemplateAreas: hasContext
          ? `"header header header" "nav main context" "status status status"`
          : `"header header" "nav main" "status status"`
      }}>
      <div
        data-shell-region="header"
        className="border-b border-hairline bg-bg"
        style={{ gridArea: "header" }}>
        {header}
      </div>

      <div
        data-shell-region="nav"
        className="overflow-y-auto border-r border-hairline bg-bg"
        style={{ gridArea: "nav" }}>
        {nav}
      </div>

      <main
        data-shell-region="main"
        className="overflow-hidden bg-bg"
        style={{ gridArea: "main" }}>
        {children}
      </main>

      {hasContext ? (
        <aside
          data-shell-region="context"
          className="overflow-y-auto border-l border-hairline bg-surface"
          style={{ gridArea: "context" }}>
          {context}
        </aside>
      ) : null}

      <div
        data-shell-region="status"
        className="border-t border-hairline bg-surface"
        style={{ gridArea: "status" }}>
        {status}
      </div>
    </div>
  );
}
