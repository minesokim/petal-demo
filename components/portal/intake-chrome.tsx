"use client";

import * as React from "react";

import type { PortalTheme } from "./theme";
import { Eyebrow, ProgressBar, Row } from "./primitives";

/**
 * Intake chrome — 1:1 port of the shared bits in
 * design-references/client-portal/components/intake-screens.jsx
 * (IntakeHeader, AntonioNote, BottomBar, Footer).
 */

export function IntakeHeader({
  t,
  step,
  subStep,
  label,
  total = 13
}: {
  t: PortalTheme;
  step?: number;
  subStep?: "A" | "B";
  label: string;
  total?: number;
}) {
  const wrapStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    zIndex: 5,
    background: t.bg,
    padding: "14px 24px 12px",
    borderBottom: `1px solid ${t.borderSoft}`
  };
  if (!step) {
    return (
      <div style={wrapStyle}>
        <Row justify="space-between" style={{ marginBottom: 10 }}>
          <Eyebrow t={t}>Final step</Eyebrow>
          <Eyebrow t={t}>{label}</Eyebrow>
        </Row>
        <ProgressBar t={t} value={total} total={total} />
      </div>
    );
  }
  const stepLabel = subStep
    ? `${String(step).padStart(2, "0")}${subStep} of ${total}`
    : `${String(step).padStart(2, "0")} of ${total}`;
  const progressValue = subStep === "B" ? step + 0.5 : step;
  return (
    <div style={wrapStyle}>
      <Row justify="space-between" style={{ marginBottom: 10 }}>
        <Eyebrow t={t}>{stepLabel}</Eyebrow>
        <Eyebrow t={t}>{label}</Eyebrow>
      </Row>
      <ProgressBar t={t} value={progressValue} total={total} />
    </div>
  );
}

export function AntonioNote({
  t,
  children
}: {
  t: PortalTheme;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 10,
        paddingLeft: 16,
        borderLeft: `1px solid ${t.rustSoft}`
      }}>
      <div
        style={{
          fontFamily: t.serif,
          fontStyle: "italic",
          fontSize: 15.5,
          lineHeight: 1.55,
          color: t.inkSoft,
          textWrap: "pretty",
          letterSpacing: -0.1
        }}>
        {children}
      </div>
      <div
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
        <span
          style={{
            fontFamily: t.serif,
            fontSize: 13,
            color: t.muted,
            lineHeight: 1
          }}>
          —
        </span>
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: t.rustInk
          }}>
          Antonio
        </span>
        <span
          style={{
            flex: 1,
            height: 1,
            background: t.borderSoft,
            maxWidth: 40
          }}
        />
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 9.5,
            letterSpacing: 1,
            color: t.muted,
            textTransform: "uppercase"
          }}>
          EA · Claremont
        </span>
      </div>
    </div>
  );
}

export function BottomBar({
  t,
  children
}: {
  t: PortalTheme;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: `linear-gradient(to top, ${t.bg} 70%, transparent)`,
        padding: "24px 24px 32px",
        display: "flex",
        gap: 10
      }}>
      {children}
    </div>
  );
}

export function Footer({ t }: { t: PortalTheme }) {
  return (
    <div
      style={{
        padding: "20px 24px 28px",
        textAlign: "center",
        fontFamily: t.mono,
        fontSize: 10,
        color: t.muted,
        letterSpacing: 0.5
      }}>
      ANTONIO VAZQUEZ, ENROLLED AGENT · CLAREMONT, CA
    </div>
  );
}
