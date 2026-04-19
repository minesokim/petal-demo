import { PortalApp } from "@/components/portal/portal-app";

/**
 * Client portal entry.
 *
 * The v4 PortalApp reads from the Zustand intake store to decide
 * what to render: auth → intake flow → post-login tabs. No URL
 * routing per-step — the portal is a single-page experience keyed
 * off store state, which survives refreshes via localStorage.
 *
 * The v3 single-file 1700-line prototype that previously lived here
 * remains in git history (last commit before this replacement is the
 * baseline to diff against if you ever need to reference the old
 * visual direction).
 */
export default function PortalPage() {
  return <PortalApp />;
}
