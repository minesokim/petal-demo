"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic } from "lucide-react";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import { ActionFeed } from "@/components/actions/action-feed";
import { ActionExecutionSheet } from "@/components/actions/action-execution-sheet";
import { IntelligencePanel } from "@/components/actions/intelligence/intelligence-panel";
import { BatchPanel } from "@/components/actions/batch/batch-panel";
import { TodoVoicePanel } from "@/components/actions/todo/todo-voice-panel";
import { VoiceDumpDialog } from "@/components/actions/voice/voice-dump-dialog";
import { feedActions, type FeedAction, complianceAlerts, anomalyAlerts, documentExtractions } from "@/lib/actions-mock-data";

export default function ActionsPage() {
  const [selectedAction, setSelectedAction] = useState<FeedAction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const unresolvedCount = feedActions.filter(a => !a.isResolved).length;
  const intelligenceCount = complianceAlerts.length + anomalyAlerts.length + documentExtractions.length;

  const handleSelectAction = (action: FeedAction) => {
    setSelectedAction(action);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display tracking-tight">Actions</h1>
          <p className="text-muted-foreground text-sm">{unresolvedCount} items need attention</p>
        </div>
        <Button onClick={() => setVoiceOpen(true)}>
          <Mic className="size-4" />
          Voice Notes
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="feed">
        <TabsList variant="line">
          <TabsTrigger value="feed">
            Action Feed
            <Badge variant="secondary" className="ml-1.5 text-[10px]">{unresolvedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="intelligence">
            Intelligence
            <Badge variant="secondary" className="ml-1.5 text-[10px]">{intelligenceCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
          <TabsTrigger value="todo">To-do & Voice</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4">
          <ActionFeed actions={feedActions} onSelectAction={handleSelectAction} />
        </TabsContent>

        <TabsContent value="intelligence" className="mt-4">
          <IntelligencePanel />
        </TabsContent>

        <TabsContent value="batch" className="mt-4">
          <BatchPanel />
        </TabsContent>

        <TabsContent value="todo" className="mt-4">
          <TodoVoicePanel />
        </TabsContent>
      </Tabs>

      {/* Execution Sheet */}
      <ActionExecutionSheet
        action={selectedAction}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Voice Notes Dialog */}
      <VoiceDumpDialog open={voiceOpen} onOpenChange={setVoiceOpen} />
    </div>
  );
}
