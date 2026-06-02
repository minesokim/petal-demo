"use client";

import { useParams } from "next/navigation";
import { clients } from "@/lib/mock-data";
import { ClientAskPetal } from "@/components/client-ask-petal";
import { useToast } from "@/components/ui/toast-notification";

export default function ClientAskPetalPage() {
  const params = useParams();
  const clientId = params.id as string;
  const client = clients.find(c => c.id === clientId);
  const { showToast } = useToast();

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  return (
    <div className="flex min-h-[600px] flex-col lg:h-[calc(100vh-220px)]">
      <ClientAskPetal
        client={client}
        hideInsight
        onInsightFlag={(title) =>
          showToast("success", "Flagged for review", `${title} added to your flags`)
        }
      />
    </div>
  );
}
