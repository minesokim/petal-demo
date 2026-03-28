"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Check, Send, FileText, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { batchOperations, type BatchItem, type BatchOperation } from "@/lib/actions-mock-data";

function BatchOperationCard({ operation }: { operation: BatchOperation }) {
  const [items, setItems] = useState<BatchItem[]>(operation.items);
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const completedCount = items.filter(i => i.status === "complete").length;
  const allDone = completedCount === items.length;

  const handleApproveAll = async () => {
    setProcessing(true);
    for (let i = 0; i < items.length; i++) {
      setCurrentIndex(i);
      setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: "processing" } : item));
      await new Promise(r => setTimeout(r, 400));
      setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: "complete" } : item));
    }
    setCurrentIndex(-1);
    setProcessing(false);
  };

  const icon = operation.type === "reminders" ? Send :
               operation.type === "invoices" ? FileText : ArrowRight;
  const Icon = icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4" />
          {operation.title}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className="text-[10px]">{items.length} items</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{operation.description}</p>

        {processing && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Processing {Math.min(currentIndex + 1, items.length)} of {items.length}...</span>
              <span>{completedCount}/{items.length}</span>
            </div>
            <Progress value={(completedCount / items.length) * 100} className="h-1.5" />
          </div>
        )}

        <div className="space-y-1">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                item.status === "complete" ? "bg-emerald-50/50 dark:bg-emerald-950/10" :
                item.status === "processing" ? "bg-primary/5 border-primary/20" : ""
              }`}
              animate={item.status === "complete" ? { backgroundColor: ["hsl(142 76% 36% / 0.1)", "transparent"] } : {}}
              transition={{ duration: 0.8 }}
            >
              <Avatar className="size-7 shrink-0">
                <AvatarImage src={item.avatar} alt={item.clientName} />
                <AvatarFallback className="text-[9px]">{item.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium">{item.clientName}</div>
                <div className="text-[10px] text-muted-foreground">{item.detail}</div>
              </div>
              <div className="shrink-0">
                {item.status === "complete" ? (
                  <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
                    <Check className="size-3 text-white" />
                  </div>
                ) : item.status === "processing" ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>

        {!allDone && (
          <Button className="w-full" onClick={handleApproveAll} disabled={processing}>
            {processing ? (
              <><Loader2 className="size-3.5 animate-spin" /> Processing...</>
            ) : (
              <><Check className="size-3.5" /> Approve all ({items.length})</>
            )}
          </Button>
        )}

        {allDone && (
          <div className="flex items-center gap-2 rounded-lg border bg-emerald-50 p-3 dark:bg-emerald-950/20">
            <Check className="size-4 text-emerald-600" />
            <span className="text-sm font-medium">All {items.length} items processed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BatchPanel() {
  return (
    <div className="space-y-4">
      {batchOperations.map(op => <BatchOperationCard key={op.id} operation={op} />)}
    </div>
  );
}
