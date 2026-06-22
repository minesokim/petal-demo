import { IntakeFlow } from "@/components/portal/intake-flow";

// Client portal entry. The /os-styled, mobile-first intake flow:
//   Welcome → verify → confirm email → consent → upload (or manual) →
//   calm confirm screens → final review → deposit → handoff → case home.
// Self-contained mockup driven by local step state (see intake-flow.tsx).
export default function PortalPage() {
  return <IntakeFlow />;
}
