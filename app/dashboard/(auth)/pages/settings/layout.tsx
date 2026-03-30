import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Settings Page",
    additionalTitle: true,
    description:
      "Manage account settings and preferences.",
    canonical: "/pages/settings"
  });
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl">
      {children}
    </div>
  );
}
