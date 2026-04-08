import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";
import { SettingsSidebar } from "./components/settings-sidebar";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Settings",
    additionalTitle: true,
    description: "Manage your practice preferences.",
    canonical: "/pages/settings"
  });
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-display tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">Manage your practice, integrations, and preferences.</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0">
          <SettingsSidebar />
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
