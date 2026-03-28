"use client";

import { Badge } from "@/components/ui/badge";

const typeStyles: Record<string, string> = {
  W2: "",
  "1099": "",
  K1: "",
  ID: "",
  EXP: "",
  RET: "",
  AGR: "",
};

export function DocTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="outline" className="h-6 min-w-[36px] justify-center rounded-md px-1.5 text-[10px] font-semibold tabular-nums">
      {type}
    </Badge>
  );
}
