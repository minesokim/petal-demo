"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// AutoRefresh — invisibly polls the server so an open page picks up new data (e.g. an inbound
// SMS that just hit /api/sms/inbound) without a manual reload. router.refresh() re-runs the
// route's server components (loadFirmData) and hands fresh data to the client tree WHILE
// PRESERVING client state — the selected thread, the composer text, scroll — all survive, only
// the data updates. Renders nothing. Pauses while the tab is hidden so a backgrounded tab
// doesn't poll. Default 10s: an inbound text appears within ~10s of arriving.
export function AutoRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = () => {
      if (timer.current) return;
      timer.current = setInterval(() => {
        if (!document.hidden) router.refresh();
      }, intervalMs);
    };
    const stop = () => {
      if (timer.current) { clearInterval(timer.current); timer.current = null; }
    };
    const onVisibility = () => {
      if (document.hidden) { stop(); }
      else { router.refresh(); start(); } // refresh immediately on return, then resume polling
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [router, intervalMs]);

  return null;
}
