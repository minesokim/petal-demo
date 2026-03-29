"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientCard } from "@/components/ui/client-card";
import { ClientDetailDialog } from "@/components/client-detail-dialog";
import { SearchIcon } from "lucide-react";
import { clients, stageLabels, type Client, type ReturnStage } from "@/lib/mock-data";

const stageTabs: { key: "all" | ReturnStage; label: string }[] = [
  { key: "all", label: "All Clients" },
  { key: "docs_collecting", label: "Collecting Docs" },
  { key: "in_prep", label: "In Prep" },
  { key: "in_review", label: "In Review" },
  { key: "ready_to_sign", label: "Ready to Sign" },
  { key: "filed", label: "Filed" },
];

// Group clients by urgency for color-coded sections
function groupByUrgency(clientList: Client[]) {
  const groups: { key: string; label: string; bg: string; dot: string; clients: Client[] }[] = [
    { key: "urgent", label: "Urgent", bg: "bg-red-50 dark:bg-red-950/20", dot: "bg-red-500", clients: [] },
    { key: "high", label: "High priority", bg: "bg-amber-50 dark:bg-amber-950/20", dot: "bg-amber-500", clients: [] },
    { key: "normal", label: "Active", bg: "", dot: "", clients: [] },
    { key: "low", label: "Complete", bg: "bg-emerald-50 dark:bg-emerald-950/20", dot: "bg-emerald-500", clients: [] },
  ];

  for (const client of clientList) {
    const group = groups.find(g => g.key === client.urgency);
    if (group) group.clients.push(client);
  }

  return groups.filter(g => g.clients.length > 0);
}

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

  const urgencyGroups = groupByUrgency(filtered);

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

      {/* Grouped by urgency with color coding */}
      {urgencyGroups.map((group) => (
        <div key={group.key}>
          {group.dot && (
            <div className={`mb-3 rounded-xl ${group.bg} p-3`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={`size-2 rounded-full ${group.dot}`} />
                {group.label} &middot; {group.clients.length}
              </div>
            </div>
          )}
          {!group.dot && (
            <div className="mb-3 text-xs font-semibold text-muted-foreground">
              {group.label} &middot; {group.clients.length}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onOpenDetail={setDetailClient}
                defaultExpanded
              />
            ))}
          </div>
        </div>
      ))}

      <ClientDetailDialog
        client={detailClient}
        open={!!detailClient}
        onOpenChange={(open) => !open && setDetailClient(null)}
      />
    </div>
  );
}
