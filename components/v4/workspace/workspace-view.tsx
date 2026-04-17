"use client";

import * as React from "react";

import { HeaderSlot, useReturnHint, useStatusShortcuts } from "@/components/v4/layout/shell-context";
import type { Shortcut } from "@/components/v4/layout/status-bar";

import { getClientWorkspace } from "@/lib/v4/clients";
import { TRIAGE_ITEMS } from "@/lib/v4/triage-items";

import { ClientHeader } from "./client-header";
import { TabBar } from "./tab-bar";
import { WorkspaceSection } from "./section";
import { InsightCard } from "./insight-card";
import { ProgressStrip4 } from "./progress-strip-4";
import { NextSteps } from "./next-steps";
import { RecentDocs } from "./recent-docs";
import { ContextPanel } from "./context-panel";
import { WorkspaceBreadcrumb } from "./workspace-breadcrumb";

const WORKSPACE_SHORTCUTS: Shortcut[] = [
  { keys: ["⌘K"], label: "search" },
  { keys: ["M"], label: "message" },
  { keys: ["C"], label: "call" },
  { keys: ["R"], label: "respond to insight" },
  { keys: ["Tab"], label: "switch tab" }
];

/**
 * WorkspaceView — top-level client component for the Overview tab.
 *
 * - Mounts WorkspaceBreadcrumb into the header slot
 * - Sets the ⌘T return hint with the remaining triage count
 * - Overrides the StatusBar shortcuts to the workspace set (M/C/R/Tab)
 * - Renders the 3-column grid: main (overview sections) + context panel
 */
export function WorkspaceView({
  clientId,
  activeTab = "overview"
}: {
  clientId: string;
  activeTab?: string;
}) {
  const client = getClientWorkspace(clientId);

  // Determine triage context: if this client is in TRIAGE_ITEMS, show position.
  const triageContext = React.useMemo(() => {
    const idx = TRIAGE_ITEMS.findIndex((t) => t.clientId === clientId);
    if (idx === -1) return null;
    return {
      index: idx + 1,
      total: TRIAGE_ITEMS.length,
      remaining: TRIAGE_ITEMS.length - idx
    };
  }, [clientId]);

  useReturnHint(triageContext?.remaining ?? null);
  useStatusShortcuts(WORKSPACE_SHORTCUTS);

  if (!client) {
    return <WorkspacePlaceholder clientId={clientId} triagePosition={triageContext} />;
  }

  const tabLabel =
    activeTab === "overview"
      ? "Overview"
      : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  return (
    <>
      <HeaderSlot>
        <WorkspaceBreadcrumb
          tabLabel={tabLabel}
          clientName={client.name}
          triagePosition={triageContext}
        />
      </HeaderSlot>

      <div
        className="grid h-full min-h-0"
        style={{ gridTemplateColumns: "minmax(0, 1fr) 320px" }}>
        <div className="flex flex-col overflow-y-auto">
          <ClientHeader client={client} />
          <TabBar clientId={clientId} activeSlug={activeTab} counts={client.tabCounts} />
          <div className="px-7 pt-5 pb-6">
            <WorkspaceSection label={client.insight.sectionLabel} action="expand reasoning · ⇧R">
              <InsightCard insight={client.insight} />
            </WorkspaceSection>

            <WorkspaceSection label="Return snapshot" noDot action="view full return →">
              <ProgressStrip4 cells={client.progress} />
            </WorkspaceSection>

            <WorkspaceSection label="Next steps" noDot action="reorder">
              <NextSteps steps={client.nextSteps} />
            </WorkspaceSection>

            <WorkspaceSection label="Recent documents" noDot action={`all ${client.tabCounts?.documents ?? client.recentDocs.length} →`}>
              <RecentDocs rows={client.recentDocs} />
            </WorkspaceSection>
          </div>
        </div>
        <ContextPanel client={client} />
      </div>
    </>
  );
}

/**
 * Placeholder for clients not yet fleshed out in lib/v4/clients.ts.
 * Phase 3 ships Priya / Marcus / DeShawn; other triage clients land
 * here with the shell + breadcrumb + return-hint still wired so
 * ⌘T / back-chip round-trip works.
 */
function WorkspacePlaceholder({
  clientId,
  triagePosition
}: {
  clientId: string;
  triagePosition: { index: number; total: number; remaining: number } | null;
}) {
  const triageItem = TRIAGE_ITEMS.find((t) => t.clientId === clientId);
  const clientName = triageItem?.clientName ?? clientId;
  return (
    <>
      <HeaderSlot>
        <WorkspaceBreadcrumb
          tabLabel="Overview"
          clientName={clientName}
          triagePosition={triagePosition}
        />
      </HeaderSlot>
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md px-8 text-center">
          <div className="mb-3 font-mono text-[10px] font-medium tracking-[0.12em] text-ink-4 uppercase">
            Phase 3 · Workspace
          </div>
          <h1
            className="font-serif text-[24px] font-medium leading-[1.18] text-ink"
            style={{
              letterSpacing: "-0.018em",
              fontVariationSettings: '"opsz" 144, "SOFT" 30'
            }}>
            {clientName}'s workspace renders <span className="italic text-rust">next phase</span>
          </h1>
          <p className="mt-2 text-[13px] leading-[1.5] text-ink-3">
            Only Priya, Marcus, and DeShawn are fully authored in Phase 3. Press
            ⌘T or click Triage above to return.
          </p>
        </div>
      </div>
    </>
  );
}
