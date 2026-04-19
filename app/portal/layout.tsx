import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vazant Consulting — Client Portal",
  description:
    "Securely manage your tax documents, track your return, and message Antonio."
};

/**
 * The v4 portal inherits fonts (Fraunces, DM Sans, Geist Mono) from
 * app/layout.tsx via next/font — no Google Fonts <link> needed. The
 * old Plus Jakarta Sans override from the v3 prototype has been
 * removed so the portal shares type with the preparer side.
 */
export default function PortalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="portal-root">{children}</div>;
}
