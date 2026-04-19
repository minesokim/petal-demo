import * as React from "react";

import type { IconKey } from "@/lib/portal/service-catalog";

/**
 * Icon glyphs for service paths / addons / income sources.
 *
 * Translated from the design reference's inline SVGs into a single
 * keyed component so screens can render `<ServiceIcon name="rental"
 * />` without 12 lines of SVG each. 20×20, 1.5 stroke, currentColor.
 */

const SVG = {
  width: 20,
  height: 20,
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

export function ServiceIcon({ name }: { name: IconKey }) {
  switch (name) {
    case "personal":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <path d="M6 8h8M6 11h5" />
        </svg>
      );
    case "self":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <path d="M3 6h14v11H3zM3 6l3-3h8l3 3" />
          <path d="M8 10h4" />
        </svg>
      );
    case "biz":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <rect x="3" y="6" width="14" height="11" rx="1" />
          <path d="M7 6V4h6v2M8 10v4M12 10v4" />
        </svg>
      );
    case "rental":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <path d="M3 10l7-6 7 6v7H3z" />
          <path d="M8 17v-4h4v4" />
        </svg>
      );
    case "crypto":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" />
          <path d="M8 7v6M12 7v6M7 9h5a1.5 1.5 0 010 3H7M7 9l-1 1M7 12l-1 1" />
        </svg>
      );
    case "amend":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <path d="M4 4h9l3 3v9H4z" />
          <path d="M7 11l3 3 5-5" />
        </svg>
      );
    case "states":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <path d="M3 5l4-1 6 2 4-1v11l-4 1-6-2-4 1z" />
          <path d="M7 4v12M13 6v12" />
        </svg>
      );
    case "fbar":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" />
          <path d="M3 10h14M10 3c2.5 2 2.5 12 0 14M10 3c-2.5 2-2.5 12 0 14" />
        </svg>
      );
    case "consult":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <path d="M4 4h12v9H9l-4 3v-3H4z" />
          <path d="M8 8h4M8 10h3" />
        </svg>
      );
    case "formation":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <path d="M5 3h7l3 3v11H5z" />
          <path d="M12 3v4h3M8 11h4M8 13h4" />
        </svg>
      );
    case "books":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <path d="M4 4h5a2 2 0 012 2v11a2 2 0 00-2-2H4zM16 4h-5a2 2 0 00-2 2v11a2 2 0 012-2h5z" />
        </svg>
      );
    case "strategy":
      return (
        <svg {...SVG} viewBox="0 0 20 20">
          <path d="M3 15l4-5 3 2 4-6 3 4" />
          <circle cx="7" cy="10" r="1.2" fill="currentColor" />
          <circle cx="14" cy="6" r="1.2" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Generic 20×20 SVG primitive for inline glyphs that aren't in the
 * service catalog (check, arrow, chevron, etc.). Used by income
 * sources + tax questions + life events.
 */
export function Glyph({
  name,
  className
}: {
  name:
    | "check"
    | "chevronRight"
    | "plus"
    | "minus"
    | "edit"
    | "upload"
    | "camera"
    | "home"
    | "briefcase"
    | "heart"
    | "calendar"
    | "wallet"
    | "lock"
    | "shield"
    | "sparkle";
  className?: string;
}) {
  const p = { ...SVG, viewBox: "0 0 20 20", className };
  switch (name) {
    case "check":
      return (
        <svg {...p}>
          <path d="M4 11 l4 4 l8 -9" />
        </svg>
      );
    case "chevronRight":
      return (
        <svg {...p}>
          <path d="M7 4 l6 6 l-6 6" />
        </svg>
      );
    case "plus":
      return (
        <svg {...p}>
          <path d="M10 4v12M4 10h12" />
        </svg>
      );
    case "minus":
      return (
        <svg {...p}>
          <path d="M4 10h12" />
        </svg>
      );
    case "edit":
      return (
        <svg {...p}>
          <path d="M4 14l8-8 3 3-8 8H4zM12 6l2-2" />
        </svg>
      );
    case "upload":
      return (
        <svg {...p}>
          <path d="M10 13V4m-4 4l4-4 4 4" />
          <path d="M4 15v1h12v-1" />
        </svg>
      );
    case "camera":
      return (
        <svg {...p}>
          <rect x="3" y="6" width="14" height="10" rx="1.5" />
          <path d="M7 6l1.5-2h3L13 6" />
          <circle cx="10" cy="11" r="2.5" />
        </svg>
      );
    case "home":
      return (
        <svg {...p}>
          <path d="M3 10l7-6 7 6v7H3z" />
          <path d="M8 17v-4h4v4" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...p}>
          <rect x="3" y="7" width="14" height="10" rx="1" />
          <path d="M7 7V5h6v2" />
        </svg>
      );
    case "heart":
      return (
        <svg {...p}>
          <path d="M10 16s-6-3.5-6-8 5-4 6-1c1-3 6-3 6 1s-6 8-6 8z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...p}>
          <rect x="3" y="5" width="14" height="12" rx="1.5" />
          <path d="M7 3v4M13 3v4M3 9h14" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...p}>
          <rect x="3" y="6" width="14" height="10" rx="1.5" />
          <circle cx="14" cy="11" r="1.2" fill="currentColor" />
          <path d="M3 9h11" />
        </svg>
      );
    case "lock":
      return (
        <svg {...p}>
          <rect x="5" y="9" width="10" height="7" rx="1" />
          <path d="M7 9V7a3 3 0 016 0v2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M10 3l6 2v5c0 4-3 6-6 7-3-1-6-3-6-7V5z" />
          <path d="M7 10l2 2 4-4" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...p}>
          <path d="M10 3v4m0 6v4m-7-7h4m6 0h4m-9-3l2 2m2 2l2 2m0-6l-2 2m-2 2l-2 2" />
        </svg>
      );
    default:
      return null;
  }
}
