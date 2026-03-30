"use client";

import * as React from "react";
import { motion } from "motion/react";
import { X, File, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export interface UploadProgressCardProps extends React.HTMLAttributes<HTMLDivElement> {
  fileName: string;
  fileSize: number;
  progress: number;
  status?: "uploading" | "complete" | "error";
  icon?: React.ReactNode;
  onCancel?: () => void;
}

const UploadProgressCard = React.forwardRef<HTMLDivElement, UploadProgressCardProps>(
  ({ className, status = "uploading", fileName, fileSize, progress, icon, onCancel, ...props }, ref) => {
    const uploadedSize = (fileSize * progress) / 100;
    const isComplete = progress === 100;

    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border bg-card p-3.5 text-card-foreground shadow-lg",
          status === "complete" ? "border-emerald-500/30" : status === "error" ? "border-destructive/30" : "border-border",
          className
        )}
        initial={{ opacity: 0, x: 40, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        {...props}
      >
        <div className="shrink-0 text-muted-foreground">
          {isComplete ? (
            <CheckCircle2 className="size-7 text-emerald-500" />
          ) : (
            icon || <File className="size-7" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{fileName}</p>
          <div className="mt-1.5 space-y-1">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{isComplete ? formatFileSize(fileSize) : `${formatFileSize(uploadedSize)} of ${formatFileSize(fileSize)}`}</span>
              <span>{isComplete ? "Complete" : `${Math.round(progress)}%`}</span>
            </div>
          </div>
        </div>
        {!isComplete && onCancel && (
          <Button type="button" variant="ghost" size="icon" className="size-6 shrink-0" onClick={onCancel}>
            <X className="size-3.5" />
          </Button>
        )}
      </motion.div>
    );
  }
);
UploadProgressCard.displayName = "UploadProgressCard";

export { UploadProgressCard };
