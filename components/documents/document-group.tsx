"use client";

import { Badge } from "@/components/ui/badge";
import { DocTypeBadge } from "./doc-type-badge";
import { DocumentRow } from "./document-row";
import { type MockDocument, type ChecklistItem } from "@/lib/documents-mock-data";

interface DocumentGroupProps {
  label: string;
  docs: MockDocument[];
  missing: ChecklistItem[];
  onOpenDocument?: (doc: MockDocument) => void;
}

export function DocumentGroup({ label, docs, missing, onOpenDocument }: DocumentGroupProps) {
  const totalFiles = docs.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <span className="text-muted-foreground text-xs">{totalFiles} {totalFiles === 1 ? "file" : "files"}</span>
      </div>
      <div className="rounded-xl border divide-y">
        {docs.map((doc) => (
          <DocumentRow key={doc.id} doc={doc} showDate onOpen={onOpenDocument} />
        ))}
        {missing.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
            <DocTypeBadge type={
              item.docType === "w2" ? "W2" :
              item.docType.startsWith("1099") ? "1099" :
              item.docType === "id" ? "ID" :
              item.docType === "expense" ? "EXP" :
              item.docType === "return" ? "RET" : "AGR"
            } />
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground text-[13px] italic">{item.label}</div>
              <div className="text-muted-foreground text-xs">Requested {new Date(item.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} &middot; {item.daysSinceRequested}d ago</div>
            </div>
            <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-0 text-[10px]">Missing</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
