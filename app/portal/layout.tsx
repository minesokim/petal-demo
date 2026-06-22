import type { Metadata } from "next";

// The client portal now shares the /os design language: same tokens (Inter,
// near-monochrome, PetalMark green, hairline borders, low radius), scoped via
// .petal-os. Mobile-first — a phone-width column on desktop, full-bleed on a phone.
import "../os/os-theme.css";

export const metadata: Metadata = {
  title: "Vazant Tax — Client Portal",
  description: "Upload last year's return and Petal fills in most of it. You just check the work.",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="petal-os min-h-[100dvh] w-full">{children}</div>;
}
