"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Send, Mail, MessageSquare, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clients } from "@/lib/mock-data";
import { checklistItems, type ChecklistItem } from "@/lib/documents-mock-data";
import { useToast } from "@/components/ui/toast-notification";

interface ClientMissingDocs {
  clientId: string;
  clientName: string;
  avatar: string;
  email: string;
  missingDocs: ChecklistItem[];
  daysSinceOldest: number;
  urgency: "critical" | "attention" | "normal";
}

// Generate AI-drafted reminder for a client
function generateReminder(client: ClientMissingDocs): string {
  const firstName = client.clientName.split(" ")[0];
  const docCount = client.missingDocs.length;
  const docList = client.missingDocs.slice(0, 3).map(d => d.docType).join(", ");
  const hasMore = docCount > 3;

  if (client.urgency === "critical") {
    return `Hi ${firstName}, I noticed we're still waiting on ${docCount} document${docCount > 1 ? "s" : ""} for your tax return (${docList}${hasMore ? ", etc." : ""}). To stay on track for the April 15 deadline, it would be great if you could upload these in the next few days. Log into your portal and I'll take care of the rest!`;
  } else if (client.urgency === "attention") {
    return `Hey ${firstName}! Quick check-in on your tax return. We need ${docCount} more item${docCount > 1 ? "s" : ""} from you: ${docList}${hasMore ? ", and a few more" : ""}. Your portal makes it easy to upload. Let me know if you have any questions!`;
  } else {
    return `Hi ${firstName}, just a friendly reminder that we're waiting on ${docCount} document${docCount > 1 ? "s" : ""} for your return. No rush yet, but wanted to keep you in the loop. Check your portal when you get a chance!`;
  }
}

export function BulkReminderPanel() {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Group missing docs by client
  const clientsWithMissing = useMemo(() => {
    const missingItems = checklistItems.filter(c => !c.received);
    const clientMap = new Map<string, ClientMissingDocs>();

    missingItems.forEach(item => {
      const client = clients.find(c => c.id === item.clientId);
      if (!client) return;

      if (!clientMap.has(item.clientId)) {
        clientMap.set(item.clientId, {
          clientId: item.clientId,
          clientName: item.clientName,
          avatar: client.avatar || "",
          email: client.email,
          missingDocs: [],
          daysSinceOldest: 0,
          urgency: "normal",
        });
      }

      const entry = clientMap.get(item.clientId)!;
      entry.missingDocs.push(item);
      entry.daysSinceOldest = Math.max(entry.daysSinceOldest, item.daysSinceRequested);
    });

    // Calculate urgency
    clientMap.forEach(entry => {
      if (entry.daysSinceOldest >= 7) entry.urgency = "critical";
      else if (entry.daysSinceOldest >= 3) entry.urgency = "attention";
    });

    // Sort by urgency then days
    return [...clientMap.values()].sort((a, b) => {
      const urgencyOrder = { critical: 0, attention: 1, normal: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return b.daysSinceOldest - a.daysSinceOldest;
    });
  }, []);

  const criticalCount = clientsWithMissing.filter(c => c.urgency === "critical").length;
  const attentionCount = clientsWithMissing.filter(c => c.urgency === "attention").length;

  // Don't show if fewer than 2 clients with missing docs
  if (clientsWithMissing.length < 2) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === clientsWithMissing.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clientsWithMissing.map(c => c.clientId)));
    }
  };

  const handleSendAll = async () => {
    setSending(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    showToast("success", `Sent ${selectedIds.size} reminder${selectedIds.size > 1 ? "s" : ""}`);
    setSelectedIds(new Set());
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="py-3 px-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Bulk Reminders</CardTitle>
              <p className="text-xs text-muted-foreground">
                {criticalCount > 0 && <span className="text-red-600 font-medium">{criticalCount} critical</span>}
                {criticalCount > 0 && attentionCount > 0 && ", "}
                {attentionCount > 0 && <span className="text-amber-600 font-medium">{attentionCount} need attention</span>}
                {criticalCount === 0 && attentionCount === 0 && `${clientsWithMissing.length} clients waiting`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedIds.size} selected
              </Badge>
            )}
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4 px-4 space-y-3">
              {/* Select all + Send button */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={selectedIds.size === clientsWithMissing.length}
                    onCheckedChange={selectAll}
                  />
                  Select all ({clientsWithMissing.length})
                </label>
                <Button
                  size="sm"
                  disabled={selectedIds.size === 0 || sending}
                  onClick={handleSendAll}
                  className="h-8 gap-1.5"
                >
                  {sending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="size-3" />
                      Send {selectedIds.size > 0 ? selectedIds.size : ""} reminder{selectedIds.size !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Client list */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {clientsWithMissing.map(client => {
                  const isSelected = selectedIds.has(client.clientId);
                  const isPreview = previewId === client.clientId;

                  return (
                    <div key={client.clientId}>
                      <div
                        className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(client.clientId)}
                        />
                        <Avatar className="size-7">
                          <AvatarImage src={client.avatar} />
                          <AvatarFallback className="text-[10px]">
                            {client.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium truncate">{client.clientName}</span>
                            {client.urgency === "critical" && (
                              <span className="size-1.5 rounded-full bg-red-500" />
                            )}
                            {client.urgency === "attention" && (
                              <span className="size-1.5 rounded-full bg-amber-500" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {client.missingDocs.length} doc{client.missingDocs.length > 1 ? "s" : ""} missing
                            {client.daysSinceOldest > 0 && ` · ${client.daysSinceOldest}d`}
                          </span>
                        </div>
                        <button
                          onClick={() => setPreviewId(isPreview ? null : client.clientId)}
                          className="text-[10px] text-primary hover:underline"
                        >
                          {isPreview ? "Hide" : "Preview"}
                        </button>
                      </div>

                      {/* Preview message */}
                      <AnimatePresence>
                        {isPreview && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-9 mr-2 mb-2 rounded-lg bg-muted/50 p-3">
                              <div className="flex items-center gap-1.5 mb-2 text-[10px] text-muted-foreground">
                                <Mail className="size-3" />
                                <span>AI-drafted reminder</span>
                              </div>
                              <p className="text-xs leading-relaxed">
                                {generateReminder(client)}
                              </p>
                              <div className="mt-2 flex gap-2">
                                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
                                  <Mail className="size-2.5" /> Email
                                </Button>
                                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1">
                                  <MessageSquare className="size-2.5" /> SMS
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
