import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vazant Consulting — Client Portal",
  description: "Securely manage your tax documents, track your return, and message Antonio.",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
