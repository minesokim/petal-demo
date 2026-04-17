"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

/**
 * RouteTransition — 200ms ease slide between (auth-v4) surfaces.
 *
 * Triage → workspace: triage slides out to the left (-x) and workspace
 * slides in from the right (+x). Workspace → triage reverses.
 *
 * Other pages (placeholder, future surfaces) fade in place.
 *
 * The AnimatePresence key is the pathname, so Next's route transitions
 * trigger enter/exit animations. `mode="wait"` ensures the outgoing
 * page finishes collapsing before the incoming one slides in — matches
 * the PRD's "collapses to the left edge, queue slides in" spec.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const direction = directionFor(pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        data-route-transition=""
        initial={direction.from}
        animate={{ x: 0, opacity: 1 }}
        exit={direction.to}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="h-full min-h-0">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Decide how a given pathname animates on enter/exit.
 *
 * Workspace pages slide in from +x (right) and out to +x.
 * Triage slides in from -x (left) and out to -x.
 * Everything else fades.
 */
function directionFor(pathname: string): {
  from: { x: number; opacity: number };
  to: { x: number; opacity: number };
} {
  const isTriage = pathname.startsWith("/dashboard/triage");
  const isWorkspace = pathname.startsWith("/dashboard/client/");

  if (isTriage) {
    return { from: { x: -24, opacity: 0 }, to: { x: -24, opacity: 0 } };
  }
  if (isWorkspace) {
    return { from: { x: 24, opacity: 0 }, to: { x: 24, opacity: 0 } };
  }
  return { from: { x: 0, opacity: 0 }, to: { x: 0, opacity: 0 } };
}
