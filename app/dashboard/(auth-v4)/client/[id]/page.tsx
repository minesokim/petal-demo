import { WorkspaceView } from "@/components/v4/workspace/workspace-view";

/**
 * Client workspace — Overview tab.
 *
 * Reference: DOCKET-V4-PRD.md §5.2 and
 *            design-references/docket-synthesis.html
 *
 * Phase 3 renders only the Overview tab at /dashboard/client/[id].
 * Other tabs (Documents, Messages, etc.) will get their own routes
 * in later phases; clicking them from TabBar 404s for now.
 */
export default async function ClientWorkspacePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkspaceView clientId={id} activeTab="overview" />;
}
