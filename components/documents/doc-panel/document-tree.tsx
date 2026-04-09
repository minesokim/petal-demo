"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CategoryHeader } from "./category-header";
import {
  groupDocumentsByCategory,
  getClientChecklist,
  type MockDocument,
  type ChecklistItem,
} from "@/lib/documents-mock-data";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  FileText,
  XCircle,
} from "lucide-react";

interface DocumentTreeProps {
  clientId: string;
  selectedDocId: string | null;
  onSelectDocument: (docId: string) => void;
}

// Status icon logic
function DocStatusIcon({ doc }: { doc: MockDocument }) {
  if (doc.status === "signed") {
    return <CheckCircle2 className="size-3 text-emerald-500" />;
  }
  if (doc.status === "ready_for_review") {
    return <Eye className="size-3 text-blue-500" />;
  }
  if (!doc.viewedByPreparer) {
    return <div className="size-1.5 rounded-full bg-blue-500" />;
  }
  return <CheckCircle2 className="size-3 text-emerald-500/60" />;
}

export function DocumentTree({ clientId, selectedDocId, onSelectDocument }: DocumentTreeProps) {
  const groups = groupDocumentsByCategory(clientId);
  const checklist = getClientChecklist(clientId);

  // Initialize all categories as expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.category))
  );

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-2 size-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No documents yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {groups.map((group) => {
        const isOpen = expandedCategories.has(group.category);
        const totalForCategory = group.docs.length + group.missing.length;
        const receivedForCategory = group.docs.length;

        return (
          <div key={group.category}>
            <CategoryHeader
              category={group.category}
              label={group.label}
              received={receivedForCategory}
              total={totalForCategory}
              isOpen={isOpen}
              onToggle={() => toggleCategory(group.category)}
            />

            {isOpen && (
              <div className="ml-3 border-l border-border/40 pl-2">
                {/* Received documents */}
                {group.docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      selectedDocId === doc.id
                        ? "bg-primary/5 text-foreground"
                        : "text-foreground/80 hover:bg-muted/50"
                    )}
                  >
                    <DocStatusIcon doc={doc} />
                    <span className="flex-1 truncate text-xs leading-tight">
                      {doc.fileName.replace(/_/g, " ").replace(/\.[^.]+$/, "")}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">
                      {doc.fileSize}
                    </span>
                  </button>
                ))}

                {/* Missing items */}
                {group.missing.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs"
                  >
                    <Clock className="size-3 text-amber-500/70" />
                    <span className="flex-1 truncate italic text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-amber-600/70">
                      {item.daysSinceRequested}d
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
