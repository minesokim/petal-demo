"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Send, FileText, Users, Calendar,
  MessageSquare, Clock, DollarSign, AlertTriangle,
  Upload, Signature
} from "lucide-react";

function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  short?: string;
  end?: string;
}

const petalActions: Action[] = [
  { id: "1", label: "Missing documents", icon: <FileText className="h-4 w-4 text-red-500" />, description: "14 clients", short: "", end: "Urgent" },
  { id: "2", label: "Send reminder to Priya Sharma", icon: <Send className="h-4 w-4 text-blue-500" />, description: "Collecting docs", short: "", end: "Action" },
  { id: "3", label: "Review Roberto Fuentes 1120S", icon: <FileText className="h-4 w-4 text-amber-500" />, description: "Ready for review", short: "", end: "Review" },
  { id: "4", label: "Schedule call with Vladimir Petrov", icon: <Calendar className="h-4 w-4 text-purple-500" />, description: "Extension discussion", short: "", end: "Calendar" },
  { id: "5", label: "Process 8879 for Rodriguez", icon: <Signature className="h-4 w-4 text-green-500" />, description: "Pay & Sign", short: "", end: "E-Sign" },
  { id: "6", label: "Outstanding invoices", icon: <DollarSign className="h-4 w-4 text-emerald-500" />, description: "$1,650 pending", short: "", end: "Billing" },
  { id: "7", label: "Stale clients", icon: <AlertTriangle className="h-4 w-4 text-red-500" />, description: "2 clients inactive 7+ days", short: "", end: "Alert" },
  { id: "8", label: "Upload documents for David Park", icon: <Upload className="h-4 w-4 text-blue-500" />, description: "2 docs missing", short: "", end: "Docs" },
];

function ActionSearchBar({ actions = petalActions }: { actions?: Action[] }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ actions: Action[] } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (!isFocused) { setResult(null); return; }
    if (!debouncedQuery) { setResult({ actions }); return; }
    const q = debouncedQuery.toLowerCase().trim();
    setResult({ actions: actions.filter((a) => a.label.toLowerCase().includes(q)) });
  }, [debouncedQuery, isFocused, actions]);

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: { opacity: 1, height: "auto", transition: { height: { duration: 0.4 }, staggerChildren: 0.06 } },
    exit: { opacity: 0, height: 0, transition: { height: { duration: 0.3 }, opacity: { duration: 0.2 } } },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
  };

  return (
    <div className="w-full">
      <div className="relative flex flex-col">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search actions, clients, documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { setSelectedAction(null); setIsFocused(true); }}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="pl-3 pr-9 py-1.5 h-9 text-sm rounded-lg focus-visible:ring-offset-0"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
            <AnimatePresence mode="popLayout">
              {query.length > 0 ? (
                <motion.div key="send" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Send className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              ) : (
                <motion.div key="search" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Search className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {isFocused && result && !selectedAction && (
            <motion.div
              className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border bg-background shadow-lg"
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <motion.ul className="max-h-80 overflow-y-auto">
                {result.actions.map((action) => (
                  <motion.li
                    key={action.id}
                    className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
                    variants={item}
                    layout
                    onClick={() => setSelectedAction(action)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{action.icon}</span>
                      <span className="text-sm font-medium">{action.label}</span>
                      <span className="text-xs text-muted-foreground">{action.description}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{action.end}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="border-t px-3 py-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Type to search</span>
                  <span>ESC to close</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { ActionSearchBar };
