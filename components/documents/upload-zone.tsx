"use client";

import { useState } from "react";
import { Upload, FileText, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";

type UploadState = "idle" | "choosing" | "uploading" | "done";

export function UploadZone({ clientName }: { clientName?: string }) {
  const [state, setState] = useState<UploadState>("idle");
  const [selectedType, setSelectedType] = useState<"client" | "firm" | null>(null);

  const handleClick = () => setState("choosing");

  const handleSelect = (type: "client" | "firm") => {
    setSelectedType(type);
    setState("uploading");
    setTimeout(() => setState("done"), 1500);
    setTimeout(() => { setState("idle"); setSelectedType(null); }, 3000);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-8 transition-colors hover:border-primary/30 hover:bg-muted/30"
      >
        <Upload className="text-muted-foreground mb-2 size-6" />
        <p className="text-sm font-medium">
          {clientName ? `Upload for ${clientName}` : "Upload documents"}
        </p>
        <p className="text-muted-foreground text-xs">Drop files or tap to browse</p>
      </button>

      <Dialog open={state !== "idle"} onOpenChange={(open) => { if (!open) { setState("idle"); setSelectedType(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {state === "choosing" && (
              <motion.div
                key="choosing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 py-2"
              >
                <button
                  onClick={() => handleSelect("client")}
                  className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Client document</div>
                    <div className="text-xs text-muted-foreground">W-2, 1099, ID, expenses, etc.</div>
                  </div>
                </button>
                <button
                  onClick={() => handleSelect("firm")}
                  className="flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Firm document</div>
                    <div className="text-xs text-muted-foreground">Templates, WISP, internal files</div>
                  </div>
                </button>
              </motion.div>
            )}

            {state === "uploading" && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-8"
              >
                <motion.div
                  className="size-8 rounded-full border-2 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  Uploading {selectedType === "firm" ? "firm document" : "client document"}...
                </p>
              </motion.div>
            )}

            {state === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="size-6 text-white" />
                </div>
                <p className="mt-3 text-sm font-medium">Document uploaded</p>
                <p className="text-xs text-muted-foreground">AI is classifying and organizing it now</p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
