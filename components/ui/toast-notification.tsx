"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, AlertTriangle, File, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type ToastType = "success" | "sent" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface Upload {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, description?: string) => void;
  showUpload: (fileName: string, fileSize: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {}, showUpload: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success" || type === "sent") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <path d="M16.5 8.31V9a7.5 7.5 0 1 1-4.447-6.855M16.5 3 9 10.508l-2.25-2.25" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return <AlertTriangle className="size-[18px] shrink-0 text-amber-500" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);

  const showToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const showUpload = useCallback((fileName: string, fileSize: number) => {
    const id = Math.random().toString(36).slice(2);
    setUploads(prev => [...prev, { id, fileName, fileSize, progress: 0 }]);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 100 } : u));
        setTimeout(() => setUploads(prev => prev.filter(u => u.id !== id)), 2000);
      } else {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, progress } : u));
      }
    }, 400);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    setUploads(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showUpload }}>
      {children}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto"
            >
              <div className="inline-flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3 text-sm shadow-lg">
                <ToastIcon type={toast.type} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-muted-foreground text-xs">{toast.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="close"
                  className="inline-flex shrink-0 active:scale-95 transition text-muted-foreground/50 hover:text-muted-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          {uploads.map(upload => (
            <motion.div
              key={upload.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto"
            >
              <div className={`flex items-center gap-3 rounded-lg border bg-background p-3 shadow-lg ${upload.progress >= 100 ? "border-emerald-500/30" : "border-border/60"}`}>
                {upload.progress >= 100 ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : <File className="size-5 shrink-0 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{upload.fileName}</p>
                  <div className="mt-1.5 space-y-1">
                    <Progress value={upload.progress} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{upload.progress >= 100 ? "Uploaded" : `${Math.round(upload.progress)}%`}</span>
                    </div>
                  </div>
                </div>
                {upload.progress < 100 && (
                  <button onClick={() => dismiss(upload.id)} className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground">
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
