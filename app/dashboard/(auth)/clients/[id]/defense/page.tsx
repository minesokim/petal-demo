"use client";

import { useParams } from "next/navigation";
import { clients } from "@/lib/mock-data";
import { DefensePackageView } from "@/components/clients/defense-package-view";
import { useToast } from "@/components/ui/toast-notification";

/**
 * Client Defense tab — the 7-layer audit-defense package for this client.
 * Mirrors the popup dialog's Defense tab so the two surfaces stay in sync.
 */
export default function ClientDefensePage() {
  const params = useParams();
  const client = clients.find((c) => c.id === params.id);
  const { showToast } = useToast();

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  return (
    <DefensePackageView
      client={client}
      onAction={(label) =>
        showToast("success", label, `Defense package action complete for ${client.fullName.split(" ")[0]}.`)
      }
    />
  );
}
