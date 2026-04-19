"use client";

import * as React from "react";

import type { PortalTheme } from "../theme";
import { Body, Button, H1, Row, Screen, Stack } from "../primitives";
import { AntonioNote, IntakeHeader } from "../intake-chrome";
import { AskAntonioBar } from "../ask-antonio";
import { BackChevron, FieldLabel, SSNField, TextField } from "../form-fields";
import { useIntakeStore } from "@/lib/portal/intake-store";

/**
 * Personal Info — 1:1 port of personal-info.jsx. Form fields wired
 * to the intake store; shared FieldLabel / TextField / SSNField in
 * components/portal/form-fields.tsx.
 */

export function ScreenPersonalInfo({ t }: { t: PortalTheme }) {
  const {
    firstName,
    lastName,
    dob,
    ssn,
    phone,
    email,
    occupation,
    address,
    city,
    state,
    zip,
    patch,
    goNext,
    goPrev
  } = useIntakeStore();
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
          <BackChevron t={t} onClick={goPrev} />
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

          <div>
            <FieldLabel t={t}>Occupation</FieldLabel>
            <TextField
              t={t}
              value={occupation}
              onChange={(v) => patch({ occupation: v })}
              placeholder="Registered Nurse"
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
