"use client";

import { useParams } from "next/navigation";
import { clients } from "@/lib/mock-data";
import { IntakeView } from "@/components/clients/intake-view";

export default function IntakePage() {
  const params = useParams();
  const clientId = params.id as string;
  const client = clients.find(c => c.id === clientId);

  if (!client) return <div className="text-muted-foreground py-10 text-center">Client not found</div>;

  // Single source of truth — the popup uses the same component with variant="popup"
  return <IntakeView clientId={client.id} clientFullName={client.fullName} variant="page" />;
}
