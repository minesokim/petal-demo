"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { clients } from "@/lib/mock-data";
import { getClientActivity } from "@/lib/activity-mock-data";
import { ActivityFilterBar, type FilterOption } from "@/components/activity/activity-filter-bar";
import { AuditTrailTimeline } from "@/components/activity/audit-trail-timeline";

export default function ClientActivityPage() {
  const params = useParams();
  const client = clients.find((c) => c.id === params.id);
  const [filter, setFilter] = useState<FilterOption>("all");

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const allEvents = getClientActivity(client.id);

  // Compute counts for filter bar
  const counts = useMemo(() => {
    const c: Record<FilterOption, number> = {
      all: allEvents.length,
      antonio: 0,
      client: 0,
      ai: 0,
      system: 0,
    };
    for (const e of allEvents) {
      if (e.actor && e.actor in c) {
        c[e.actor as FilterOption]++;
      }
    }
    return c;
  }, [allEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filter === "all") return allEvents;
    return allEvents.filter((e) => e.actor === filter);
  }, [allEvents, filter]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <ActivityFilterBar active={filter} onChange={setFilter} counts={counts} />

      {/* Timeline */}
      <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
        <AuditTrailTimeline
          events={filteredEvents}
          clientAvatar={client.avatar}
          clientName={client.fullName}
        />
      </div>
    </div>
  );
}
