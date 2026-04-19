"use client";

import * as React from "react";

import type { PortalTheme } from "./theme";
import { Row } from "./primitives";

/**
 * Shared form field primitives used by multiple intake screens
 * (personal-info, spouse-info, rental, self-employment, business-info,
 * refund-preference). 1:1 port of the inline definitions in the
 * reference JSX files — same padding, border, font, focus behavior.
 */

export function FieldLabel({
  t,
  children,
  hint
}: {
  t: PortalTheme;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <Row justify="space-between" align="baseline" style={{ marginBottom: 6 }}>
      <span
        style={{
          fontFamily: t.sans,
          fontSize: 12,
          color: t.muted,
          fontWeight: 500,
          letterSpacing: 0
        }}>
        {children}
      </span>
      {hint ? (
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.muted,
            letterSpacing: 0.4
          }}>
          {hint}
        </span>
      ) : null}
    </Row>
  );
}

export function TextField({
  t,
  value,
  onChange,
  placeholder,
  mono,
  inputMode,
  style,
  readOnly,
  type = "text"
}: {
  t: PortalTheme;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  style?: React.CSSProperties;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${t.border}`,
        padding: "10px 0 10px",
        fontSize: 16,
        color: t.ink,
        fontFamily: mono ? t.mono : t.sans,
        letterSpacing: mono ? 0.3 : 0,
        outline: "none",
        ...style
      }}
      onFocus={(e) => {
        e.target.style.borderBottomColor = t.rust;
      }}
      onBlur={(e) => {
        e.target.style.borderBottomColor = t.border;
      }}
    />
  );
}

export function SSNField({
  t,
  ssn,
  onChange
}: {
  t: PortalTheme;
  ssn: string;
  onChange: (v: string) => void;
}) {
  const d = ssn.replace(/\D/g, "").slice(0, 9);
  const last4 = d.length >= 4 ? d.slice(-4) : "";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0 10px",
        borderBottom: `1px solid ${t.border}`
      }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flex: 1 }}>
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 14,
            color: t.muted,
            letterSpacing: 2,
            lineHeight: 1
          }}>
          •••
        </span>
        <span style={{ fontFamily: t.mono, fontSize: 14, color: t.muted }}>
          –
        </span>
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 14,
            color: t.muted,
            letterSpacing: 2,
            lineHeight: 1
          }}>
          ••
        </span>
        <span style={{ fontFamily: t.mono, fontSize: 14, color: t.muted }}>
          –
        </span>
        <input
          value={last4}
          onChange={(e) => {
            const rest = d.length > 4 ? d.slice(0, -4) : "";
            onChange(rest + e.target.value.replace(/\D/g, "").slice(0, 4));
          }}
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          style={{
            fontFamily: t.mono,
            fontSize: 19,
            color: t.ink,
            letterSpacing: 1.5,
            fontWeight: 500,
            background: "transparent",
            border: "none",
            outline: "none",
            width: 70
          }}
        />
      </div>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 9px",
          background: t.tintAccent,
          border: `1px solid ${t.rustSoft}`,
          borderRadius: 999,
          fontFamily: t.mono,
          fontSize: 9,
          color: t.rustInk,
          letterSpacing: 0.8
        }}>
        <svg
          width="9"
          height="10"
          viewBox="0 0 9 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3">
          <rect x="1.5" y="4.5" width="6" height="5" rx="0.8" />
          <path d="M3 4.5V3a1.5 1.5 0 013 0v1.5" strokeLinecap="round" />
        </svg>
        ENCRYPTED
      </span>
    </div>
  );
}

/** Reusable tappable back chevron button used above the H1 on most intake screens. */
export function BackChevron({
  t,
  onClick
}: {
  t: PortalTheme;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontSize: 13,
        color: t.muted,
        fontFamily: t.sans
      }}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6">
        <path
          d="M9 3l-4 4 4 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Back
    </button>
  );
}

/** Rust-accent pill used at the top of conditional screens ("Because you're filing jointly"). */
export function ContextChip({
  t,
  children
}: {
  t: PortalTheme;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        background: t.tintAccent,
        border: `1px solid ${t.rustSoft}`,
        borderRadius: 999,
        fontFamily: t.mono,
        fontSize: 9.5,
        color: t.rustInk,
        letterSpacing: 0.9,
        textTransform: "uppercase"
      }}>
      <svg
        width="9"
        height="9"
        viewBox="0 0 9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4">
        <path
          d="M2 5l2 2 3-4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  );
}
