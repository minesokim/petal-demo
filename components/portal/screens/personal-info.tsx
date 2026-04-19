"use client";

import * as React from "react";

import type { PortalTheme } from "../theme";
import { Body, Button, H1, Row, Screen, Stack } from "../primitives";
import { AntonioNote, IntakeHeader } from "../intake-chrome";
import { AskAntonioBar } from "../ask-antonio";
import { useIntakeStore } from "@/lib/portal/intake-store";

/**
 * Personal Info — 1:1 port of
 * design-references/client-portal/components/personal-info.jsx.
 * Form fields bound to the intake store (firstName/lastName/dob/
 * ssn/phone/email/address/city/state/zip).
 */

function FieldLabel({
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

function TextField({
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

function SSNField({
  t,
  ssn,
  onChange
}: {
  t: PortalTheme;
  ssn: string;
  onChange: (v: string) => void;
}) {
  const d = ssn.replace(/\D/g, "").slice(0, 9);
  const last4 = d.length >= 4 ? d.slice(-4) : d.padStart(4, "•");
  const hasAny = d.length > 0;
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
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 14,
            color: t.muted
          }}>
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
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 14,
            color: t.muted
          }}>
          –
        </span>
        <input
          value={last4 === "••••" ? "" : last4}
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
        {hasAny ? "ENCRYPTED" : "ENCRYPTED"}
      </span>
    </div>
  );
}

export function ScreenPersonalInfo({ t }: { t: PortalTheme }) {
  const store = useIntakeStore();
  const { firstName, lastName, dob, ssn, phone, email, address, city, state, zip, patch, goNext, goPrev } = store;
  const fullName = `${firstName} ${lastName}`.trim();

  const setFullName = (v: string) => {
    const parts = v.trim().split(/\s+/);
    const first = parts.shift() ?? "";
    const last = parts.join(" ");
    patch({ firstName: first, lastName: last });
  };

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <IntakeHeader t={t} step={2} label="Personal" />

        <div style={{ padding: "22px 24px 0" }}>
          <button
            onClick={goPrev}
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
        </div>

        <div style={{ padding: "18px 24px 8px" }}>
          <Stack gap={10}>
            <H1 t={t}>Your basic information</H1>
            <Body t={t} size={15}>
              This goes directly onto your return.
            </Body>
          </Stack>
        </div>

        <Stack gap={18} style={{ padding: "22px 24px 16px", flex: 1 }}>
          <div>
            <FieldLabel t={t}>Full legal name</FieldLabel>
            <TextField
              t={t}
              value={fullName}
              onChange={setFullName}
              placeholder="First Middle Last"
            />
          </div>

          <div>
            <FieldLabel t={t}>Date of birth</FieldLabel>
            <TextField
              t={t}
              value={dob}
              onChange={(v) => patch({ dob: v })}
              placeholder="MM / DD / YYYY"
              mono
              inputMode="numeric"
            />
          </div>

          <div>
            <FieldLabel t={t} hint="LAST 4 SHOWN">
              Social Security Number
            </FieldLabel>
            <SSNField t={t} ssn={ssn} onChange={(v) => patch({ ssn: v })} />
          </div>

          <div>
            <FieldLabel t={t}>Phone number</FieldLabel>
            <TextField
              t={t}
              value={phone}
              onChange={(v) => patch({ phone: v })}
              placeholder="(555) 555-5555"
              mono
              inputMode="tel"
            />
          </div>

          <div>
            <FieldLabel t={t}>Email</FieldLabel>
            <TextField
              t={t}
              value={email}
              onChange={(v) => patch({ email: v })}
              placeholder="you@email.com"
              type="email"
              inputMode="email"
            />
          </div>

          <div
            style={{
              marginTop: 14,
              padding: "20px 18px 4px",
              background: t.bgElev,
              border: `1px solid ${t.borderSoft}`,
              borderRadius: t.radius
            }}>
            <div
              style={{
                fontFamily: t.serif,
                fontSize: 15,
                color: t.ink,
                letterSpacing: -0.2,
                marginBottom: 4
              }}>
              Home address
            </div>
            <div style={{ fontSize: 12, color: t.muted, marginBottom: 16 }}>
              Where you lived most of the tax year
            </div>

            <div>
              <FieldLabel t={t}>Street address</FieldLabel>
              <TextField
                t={t}
                value={address}
                onChange={(v) => patch({ address: v })}
                placeholder="Street address"
              />
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <div style={{ flex: 2, minWidth: 0 }}>
                <FieldLabel t={t}>City</FieldLabel>
                <TextField
                  t={t}
                  value={city}
                  onChange={(v) => patch({ city: v })}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FieldLabel t={t}>State</FieldLabel>
                <TextField
                  t={t}
                  value={state}
                  onChange={(v) =>
                    patch({ state: v.toUpperCase().slice(0, 2) as never })
                  }
                  mono
                  style={{ textTransform: "uppercase", letterSpacing: 1 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FieldLabel t={t}>ZIP</FieldLabel>
                <TextField
                  t={t}
                  value={zip}
                  onChange={(v) =>
                    patch({ zip: v.replace(/\D/g, "").slice(0, 5) })
                  }
                  mono
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 6 }}>
            <AntonioNote t={t}>
              Your SSN is encrypted the moment you type it. I only see the last
              4 digits until I&apos;m actively preparing your return.
            </AntonioNote>
          </div>
        </Stack>

        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: `linear-gradient(to top, ${t.bg} 75%, transparent)`,
            padding: "20px 24px 28px",
            marginTop: 12
          }}>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} />
          </div>
          <Row gap={10}>
            <Button
              t={t}
              variant="ghost"
              onClick={goPrev}
              style={{ flex: "0 0 auto" }}>
              Back
            </Button>
            <Button t={t} onClick={goNext} style={{ flex: 1 }}>
              Continue
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}
