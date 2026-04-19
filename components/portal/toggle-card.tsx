"use client";

import * as React from "react";

import type { PortalTheme } from "./theme";

/**
 * ToggleCard — 1:1 port of the ToggleCard defined in the reference's
 * self-employment.jsx and reused in tax-questions.jsx + life-events.jsx.
 * Emphasis variant (used for the cash-business + foreign-accounts
 * toggles) uses t.rust instead of t.ink for the filled state.
 */
export function ToggleCard({
  t,
  on,
  onClick,
  icon,
  label,
  sub,
  emphasis
}: {
  t: PortalTheme;
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  emphasis?: boolean;
}) {
  const borderColor = on ? (emphasis ? t.rust : t.ink) : t.border;
  const bg = on ? (emphasis ? t.tintAccent : t.bgElev) : t.card;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "14px 16px",
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: t.radius,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: t.sans,
        transition: "border-color 120ms, background 120ms"
      }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: on ? (emphasis ? t.rust : t.ink) : t.bgElev,
          border: `1px solid ${on ? "transparent" : t.borderSoft}`,
          color: on ? "#fff" : t.inkSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            color: t.ink,
            fontWeight: 500,
            letterSpacing: -0.1,
            marginBottom: sub ? 2 : 0
          }}>
          {label}
        </div>
        {sub ? (
          <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.35 }}>
            {sub}
          </div>
        ) : null}
      </div>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `1.5px solid ${on ? (emphasis ? t.rust : t.ink) : t.border}`,
          background: on ? (emphasis ? t.rust : t.ink) : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
        {on ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="#fff"
            strokeWidth="2">
            <path
              d="M2.5 6.5l2.5 2.5 4.5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </div>
    </button>
  );
}
