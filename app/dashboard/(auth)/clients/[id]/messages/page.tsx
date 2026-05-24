"use client";

import { useParams } from "next/navigation";
import { clients } from "@/lib/mock-data";
import { ClientMessagesView } from "@/components/messaging/client-messages-view";

export default function ClientMessagesPage() {
  const params = useParams();
  const clientId = params.id as string;
  const client = clients.find(c => c.id === clientId);

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  return <ClientMessagesView client={client} />;
}
