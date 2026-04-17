import { TriageView } from "@/components/v4/triage/triage-view";

/**
 * Triage — the primary home surface.
 *
 * Reference: design-references/docket-direction-b-v2.html
 *            DOCKET-V4-PRD.md §5.1
 *
 * The page is a thin wrapper: TriageView (client component) owns
 * selection state + keyboard handlers. Server data wiring arrives
 * in a later phase; for now it imports TRIAGE_ITEMS directly.
 */
export default function TriagePage() {
  return <TriageView />;
}
