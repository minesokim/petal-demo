"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Appearance</h3>
        <p className="text-sm text-muted-foreground">Customize how Petal looks on your device.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Theme</CardTitle>
          <CardDescription>Choose between light and dark mode, or follow your system preference.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light", label: "Light", icon: Sun, preview: { bg: "bg-white", card: "bg-gray-100", text: "bg-gray-300" } },
              { value: "dark", label: "Dark", icon: Moon, preview: { bg: "bg-slate-900", card: "bg-slate-800", text: "bg-slate-600" } },
              { value: "system", label: "System", icon: Monitor, preview: { bg: "bg-gradient-to-r from-white to-slate-900", card: "bg-gradient-to-r from-gray-100 to-slate-800", text: "bg-gradient-to-r from-gray-300 to-slate-600" } },
            ].map(({ value, label, icon: Icon, preview }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`group rounded-xl border-2 p-1 transition-all ${
                  theme === value ? "border-primary" : "border-transparent hover:border-primary/20"
                }`}
              >
                <div className={`rounded-lg ${preview.bg} p-3 space-y-2`}>
                  <div className={`h-2 w-16 rounded ${preview.card}`} />
                  <div className={`h-2 w-12 rounded ${preview.text}`} />
                  <div className={`h-2 w-20 rounded ${preview.card}`} />
                </div>
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
