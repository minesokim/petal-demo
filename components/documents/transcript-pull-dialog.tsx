"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText, Download, Check, Loader2, Shield,
  ChevronRight, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type PullState = "input" | "authorizing" | "pulling" | "results";

const mockTranscripts = [
  { year: "2024", type: "Account Transcript", status: "Available", size: "42 KB" },
  { year: "2024", type: "Return Transcript", status: "Available", size: "156 KB" },
  { year: "2024", type: "Wage & Income", status: "Available", size: "23 KB" },
  { year: "2023", type: "Account Transcript", status: "Available", size: "38 KB" },
  { year: "2023", type: "Return Transcript", status: "Available", size: "148 KB" },
  { year: "2022", type: "Account Transcript", status: "Available", size: "35 KB" },
  { year: "2022", type: "Return Transcript", status: "Available", size: "142 KB" },
];

interface TranscriptPullDialogProps {
  clientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TranscriptPullDialog({ clientName = "Marcus Chen", open, onOpenChange }: TranscriptPullDialogProps) {
  const [state, setState] = useState<PullState>("input");
  const [selectedTranscripts, setSelectedTranscripts] = useState<string[]>([]);

  const handlePull = () => {
    setState("authorizing");
    setTimeout(() => setState("pulling"), 1200);
    setTimeout(() => setState("results"), 3000);
  };

  const toggleTranscript = (key: string) => {
    setSelectedTranscripts(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => { setState("input"); setSelectedTranscripts([]); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-4" /> IRS Transcript Pull
          </DialogTitle>
          <DialogDescription>Pull client transcripts directly from the IRS via e-Services TDS</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {state === "input" && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="space-y-3">
                <div><label className="text-xs font-medium text-muted-foreground">Client Name</label><Input defaultValue={clientName} className="mt-1" readOnly /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Client SSN (last 4)</label><Input defaultValue="4521" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Tax Years</label>
                  <div className="mt-1 flex gap-2">
                    {["2024", "2023", "2022", "2021", "2020"].map(y => (
                      <Button key={y} size="sm" variant={selectedTranscripts.includes(y) ? "default" : "outline"} onClick={() => toggleTranscript(y)} className="h-8">{y}</Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="size-3.5 text-primary" />
                  <span>Requires active Power of Attorney (Form 2848) on file with IRS</span>
                </div>
              </div>
              <Button className="w-full" onClick={handlePull} disabled={selectedTranscripts.length === 0}>
                Pull transcripts ({selectedTranscripts.length} years)
              </Button>
            </motion.div>
          )}

          {state === "authorizing" && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-medium">Verifying authorization...</p>
              <p className="text-xs text-muted-foreground">Checking POA status with IRS e-Services</p>
            </motion.div>
          )}

          {state === "pulling" && (
            <motion.div key="pulling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-medium">Pulling transcripts...</p>
              <p className="text-xs text-muted-foreground">Downloading from IRS Transcript Delivery System</p>
            </motion.div>
          )}

          {state === "results" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="size-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{mockTranscripts.length} transcripts pulled</div>
                  <div className="text-xs text-muted-foreground">For {clientName}</div>
                </div>
              </div>
              <div className="space-y-1">
                {mockTranscripts.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <FileText className="size-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-xs font-medium">{t.year} {t.type}</div>
                      <div className="text-[10px] text-muted-foreground">{t.size}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
                      <Check className="mr-0.5 size-2.5" /> Pulled
                    </Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={handleClose}>
                <Download className="size-3.5" /> Save to client documents
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
