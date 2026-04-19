"use client";

import * as React from "react";
import type { PortalTheme } from "./theme";

/**
 * Primitive components — 1:1 port of design-references/client-portal/
 * components/tokens.jsx. Styles are inline (not Tailwind) so they
 * stay pixel-identical to the reference.
 */

/* ─── Layout ─── */

export function Screen({
  t,
  children,
  style
}: {
  t: PortalTheme;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: t.bg,
        color: t.ink,
        fontFamily: t.sans,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitFontSmoothing: "antialiased",
        ...style
      }}>
      {children}
    </div>
  );
}

export function Stack({
  gap = 12,
  children,
  style
}: {
  gap?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  );
}

export function Row({
  gap = 8,
  align = "center",
  justify = "flex-start",
  children,
  style
}: {
  gap?: number;
  align?: React.CSSProperties["alignItems"];
  justify?: React.CSSProperties["justifyContent"];
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: align,
        justifyContent: justify,
        gap,
        ...style
      }}>
      {children}
    </div>
  );
}

export function Card({
  t,
  children,
  style,
  onClick,
  selected,
  tinted
}: {
  t: PortalTheme;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  selected?: boolean;
  tinted?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: tinted ? t.tintAccent : t.card,
        border: `1px solid ${selected ? t.rust : t.border}`,
        borderRadius: t.radius,
        padding: t.pad,
        transition: "all 0.15s ease",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}>
      {children}
    </div>
  );
}

export function Button({
  t,
  variant = "primary",
  children,
  onClick,
  disabled,
  style,
  icon,
  type = "button"
}: {
  t: PortalTheme;
  variant?: "primary" | "success" | "ghost" | "dark";
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  type?: "button" | "submit";
}) {
  const base = {
    primary: { bg: t.rust, fg: "#fff", border: t.rust },
    success: { bg: t.green, fg: "#fff", border: t.green },
    ghost: { bg: "transparent", fg: t.ink, border: t.border },
    dark: { bg: t.ink, fg: t.bgElev, border: t.ink }
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? t.borderSoft : base.bg,
        color: disabled ? t.muted : base.fg,
        border: `1px solid ${disabled ? t.border : base.border}`,
        borderRadius: 999,
        padding: "14px 22px",
        fontFamily: t.sans,
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: -0.1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style
      }}>
      {children}
      {icon}
    </button>
  );
}

export function Eyebrow({
  t,
  children,
  style
}: {
  t: PortalTheme;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: t.sans,
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: 0.2,
        color: t.muted,
        ...style
      }}>
      {children}
    </div>
  );
}

export function H1({
  t,
  children,
  style
}: {
  t: PortalTheme;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <h1
      style={{
        fontFamily: t.serif,
        fontWeight: 400,
        fontSize: 34,
        lineHeight: 1.12,
        letterSpacing: -0.8,
        margin: 0,
        color: t.ink,
        textWrap: "pretty",
        ...style
      }}>
      {children}
    </h1>
  );
}

export function H2({
  t,
  children,
  style
}: {
  t: PortalTheme;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <h2
      style={{
        fontFamily: t.serif,
        fontWeight: 400,
        fontSize: 24,
        lineHeight: 1.2,
        letterSpacing: -0.4,
        margin: 0,
        color: t.ink,
        textWrap: "pretty",
        ...style
      }}>
      {children}
    </h2>
  );
}

export function Body({
  t,
  muted,
  mono,
  size = 15,
  children,
  style
}: {
  t: PortalTheme;
  muted?: boolean;
  mono?: boolean;
  size?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        fontFamily: mono ? t.mono : t.sans,
        fontSize: size,
        lineHeight: 1.5,
        color: muted ? t.muted : t.inkSoft,
        margin: 0,
        textWrap: "pretty",
        ...style
      }}>
      {children}
    </p>
  );
}

/* ProgressBar — module-level memory so it animates across screen remounts. */
const __progressLast = { pct: 0, total: 0 };

export function ProgressBar({
  t,
  value,
  total = 100
}: {
  t: PortalTheme;
  value: number;
  total?: number;
}) {
  const target = Math.min(100, Math.max(0, (value / total) * 100));
  const [pct, setPct] = React.useState<number>(() =>
    __progressLast.total === total ? __progressLast.pct : 0
  );
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setPct(target));
    __progressLast.pct = target;
    __progressLast.total = total;
    return () => cancelAnimationFrame(id);
  }, [target, total]);
  return (
    <div
      style={{
        height: 3,
        background: t.borderSoft,
        borderRadius: 999,
        overflow: "hidden"
      }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: t.rust,
          transition: "width 720ms cubic-bezier(0.22, 0.61, 0.36, 1)"
        }}
      />
    </div>
  );
}

/**
 * AvatarSlot — Antonio's real photo (cropped to circle).
 * Image served from /public/assets/antonio.webp.
 */
export function AvatarSlot({
  t,
  size = 56,
  label = "A",
  style
}: {
  t: PortalTheme;
  size?: number;
  label?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: `1px solid ${t.border}`,
        flexShrink: 0,
        background: t.bgElev,
        ...style
      }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/antonio.webp"
        alt={label}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "50% 22%",
          display: "block"
        }}
      />
    </div>
  );
}
