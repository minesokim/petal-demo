"use client";

// Petal OS tooltip — a thin, on-brand wrapper over Radix Tooltip. Content is
// portaled to <body> (outside the .petal-os var scope), so colors are literal
// (matching --os-primary / --os-primary-fg). Wrap the app once in <TipProvider>.

import * as React from "react";
import { Tooltip as TP } from "radix-ui";
import { cn } from "@/lib/utils";

export function TipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TP.Provider delayDuration={350} skipDelayDuration={250}>
      {children}
    </TP.Provider>
  );
}

/** Wrap any focusable element to give it a hover/focus tooltip.
 *  Renders the child as-is (asChild) when no label is provided. */
export function Tip({
  label,
  side = "top",
  align = "center",
  children,
  className,
}: {
  label?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  children: React.ReactNode;
  className?: string;
}) {
  if (!label) return <>{children}</>;
  return (
    <TP.Root>
      <TP.Trigger asChild>{children}</TP.Trigger>
      <TP.Portal>
        <TP.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-[70] max-w-[260px] select-none rounded-md bg-[#1c1c1e] px-2 py-1 text-[11.5px] font-medium leading-snug text-white shadow-[0_6px_18px_-6px_rgba(17,17,26,0.45)]",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1",
            className,
          )}
        >
          {label}
          <TP.Arrow className="fill-[#1c1c1e]" width={10} height={5} />
        </TP.Content>
      </TP.Portal>
    </TP.Root>
  );
}
