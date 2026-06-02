"use client";

import { useParams } from "next/navigation";
import { clients } from "@/lib/mock-data";
import { OmniContextView } from "@/components/clients/omnicontext-view";

/**
 * Client Context tab — the knowledge layer: profile facts + intake responses
 * + preparer notes + Ask Petal. "Everything we know about this client."
 *
 * Conversations live in their own Messages tab. Activity is the chronological
 * audit trail. Context is what we *know*.
 */
export default function ClientContextPage() {
  const params = useParams();
  const client = clients.find((c) => c.id === params.id);

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  return <OmniContextView client={client} variant="full" />;
}
