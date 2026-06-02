"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-notification";
import { clients } from "@/lib/mock-data";
import { DefensePackageView } from "@/components/clients/defense-package-view";

// ═════════════════════════════════════════════════════════════════════════
// Defense packages — roster + per-client preview.
//
// The preview itself lives in <DefensePackageView> (components/clients/...)
// so the exact same artifact renders here, in the client popup Defense tab,
// and in the client full-page Defense tab.
// ═════════════════════════════════════════════════════════════════════════

export default function DefensePackagePage() {
  const [selectedId, setSelectedId] = useState<string>(clients[0].id);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => c.fullName.toLowerCase().includes(q));
  }, [search]);

  const selected = clients.find((c) => c.id === selectedId) ?? clients[0];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Defense packages</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            One-click audit defense per return · authority chain · 8867 attestation · signature chain · timestamped receipts
          </p>
        </div>
      </div>

      {/* ── 2-column: roster (3) + defense preview (9) ── */}
      <div className="grid gap-5 md:grid-cols-12">
        {/* Roster */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="space-y-3 md:sticky md:top-4 md:self-start">
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find client…"
                className="pl-9 bg-white"
              />
            </div>
            <div className="md:max-h-[calc(100vh-260px)] md:overflow-y-auto md:pr-1">
              <div className="mb-2 px-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
                Roster · {filtered.length}
              </div>
              <ul className="space-y-0.5">
                {filtered.map((c) => {
                  const initials = c.fullName.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
                  const isSelected = c.id === selectedId;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setSelectedId(c.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                          isSelected ? "bg-muted/60 ring-1 ring-inset ring-foreground/10" : "hover:bg-muted/30"
                        )}
                      >
                        <Avatar className="size-7 shrink-0">
                          {c.avatar && <AvatarImage src={c.avatar} alt={c.fullName} />}
                          <AvatarFallback className="bg-foreground/10 text-[9px] font-medium">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px] font-medium text-foreground/90">{c.fullName}</div>
                          <div className="truncate text-[11px] text-muted-foreground">{c.serviceTier} · ${c.feeAmount}</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>

        {/* Defense package preview — shared component (also rendered in
            popup + full-page client Defense tabs). */}
        <main className="md:col-span-8 lg:col-span-9">
          <DefensePackageView
            client={selected}
            onAction={(label) => showToast("success", label, "Coming soon")}
          />
        </main>
      </div>
    </div>
  );
}
