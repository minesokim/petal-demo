"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientCard } from "@/components/ui/client-card";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { SearchIcon } from "lucide-react";
import { clients, type Client, type ReturnStage } from "@/lib/mock-data";

const stageTabs: { key: "all" | ReturnStage; label: string }[] = [
  { key: "all", label: "All Clients" },
  { key: "docs_collecting", label: "Collecting Docs" },
  { key: "in_prep", label: "In Prep" },
  { key: "in_review", label: "In Review" },
  { key: "ready_to_sign", label: "Ready to Sign" },
  { key: "filed", label: "Filed" },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | ReturnStage>("all");
  const [detailClient, setDetailClient] = useState<Client | null>(null);

  const filtered = clients
    .filter((c) => {
      if (search && !c.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      if (stageFilter !== "all" && c.returnStage !== stageFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const order = { urgent: 0, high: 1, normal: 2, low: 3 };
      return order[a.urgency] - order[b.urgency];
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground text-sm">{clients.length} total clients</p>
      </div>

      <div className="relative max-w-md">
        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {stageTabs.map((tab) => {
          const count = tab.key === "all" ? clients.length : clients.filter((c) => c.returnStage === tab.key).length;
          return (
            <Button
              key={tab.key}
              variant={stageFilter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStageFilter(tab.key)}
            >
              {tab.label} ({count})
            </Button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onOpenDetail={setDetailClient}
          />
        ))}
      </div>

      <ClientDetailDialog
        client={detailClient}
        open={!!detailClient}
        onOpenChange={(open) => !open && setDetailClient(null)}
      />
    </div>
  );
}
