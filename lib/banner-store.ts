"use client";

// Home banner choice — which hero image shows across the top of Home.
// Session-only (resets on full reload, like the rest of the demo); persists
// across client-side navigation so picking in Settings updates Home.

import { useSyncExternalStore } from "react";

// "aurora" is a CSS-gradient banner (no asset) and the default; the rest are images.
export const AURORA = "aurora";
export const BANNERS: string[] = [AURORA, ...Array.from({ length: 10 }, (_, i) => `/images/banners/banner-${i + 1}.jpg`)];

let selected = AURORA;
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

export const bannerStore = {
  current: () => selected,
  set(src: string) { if (src !== selected) { selected = src; emit(); } },
};

export function useBanner(): string {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => selected,
    () => AURORA,
  );
}
