"use client";

import * as React from "react";

import type { PortalTheme } from "../theme";
import { Body, Button, H1, Row, Screen, Stack } from "../primitives";
import { AntonioNote, IntakeHeader } from "../intake-chrome";
import { AskAntonioBar } from "../ask-antonio";
import {
  BackChevron,
  ContextChip,
  FieldLabel,
  TextField
} from "../form-fields";
import { useIntakeStore } from "@/lib/portal/intake-store";

/**
 * Self-Employment Detail — 1:1 port of self-employment.jsx. 5 text
 * fields + home office / vehicle toggles + pricing-tied cash toggle
 * (emphasis variant shows "+$150 DOCS FEE" hint when on).
 */

/* ─── Inline icons copied verbatim from reference ─── */
function IconHome({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M2.5 7L8 2.5 13.5 7v6.5H2.5V7z" />
      <path d="M6.5 13.5v-4h3v4" />
    </svg>
  );
}
function IconCar({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M2 10.5v-2l1.5-3.5h9L14 8.5v2" />
      <path d="M2 10.5h12v2H2z" />
      <circle cx="5" cy="12.5" r="1" />
      <circle cx="11" cy="12.5" r="1" />
    </svg>
  );
}
function IconCash({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round">
      <rect x="1.5" y="4" width="13" height="8" rx="1" />
      <circle cx="8" cy="8" r="1.8" />
      <path d="M4 8h.5M11.5 8h.5" />
    </svg>
  );
}

function ToggleCard({
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

export function ScreenSelfEmployment({ t }: { t: PortalTheme }) {
  const { selfEmployment, patch, goNext, goPrev } = useIntakeStore();
  const set = (u: Partial<typeof selfEmployment>) =>
    patch({ selfEmployment: { ...selfEmployment, ...u } });

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <IntakeHeader t={t} step={7} label="Self-employment" />

        <div style={{ padding: "22px 24px 0" }}>
          <BackChevron t={t} onClick={goPrev} />
        </div>

        <div style={{ padding: "18px 24px 0" }}>
          <ContextChip t={t}>Because you&apos;re self-employed</ContextChip>
        </div>

        <div style={{ padding: "14px 24px 8px" }}>
          <Stack gap={10}>
            <H1 t={t}>Tell me about your self-employment</H1>
            <Body t={t} size={15}>
              This opens up lots of deductions most people miss.
            </Body>
          </Stack>
        </div>

        <Stack gap={18} style={{ padding: "22px 24px 16px", flex: 1 }}>
          <div>
            <FieldLabel t={t}>Business name</FieldLabel>
            <TextField
              t={t}
              value={selfEmployment.businessName}
              onChange={(v) => set({ businessName: v })}
              placeholder="e.g., Freelance Design LLC"
            />
          </div>

          <div>
            <FieldLabel t={t}>What do you do?</FieldLabel>
            <TextField
              t={t}
              value={selfEmployment.whatYouDo}
              onChange={(v) => set({ whatYouDo: v })}
              placeholder="e.g., Graphic design, consulting"
            />
          </div>

          <div>
            <FieldLabel t={t}>Entity type</FieldLabel>
            <TextField
              t={t}
              value={selfEmployment.entityType}
              onChange={(v) => set({ entityType: v })}
              placeholder="Sole Prop, LLC, S-Corp, or N/A"
            />
          </div>

          <div>
            <FieldLabel t={t}>EIN (if any)</FieldLabel>
            <TextField
              t={t}
              value={selfEmployment.ein}
              onChange={(v) => set({ ein: v })}
              mono
              inputMode="numeric"
              placeholder="XX-XXXXXXX or N/A"
            />
          </div>

          <div>
            <FieldLabel t={t}>Approximate 2025 revenue</FieldLabel>
            <TextField
              t={t}
              value={selfEmployment.revenue}
              onChange={(v) => set({ revenue: v })}
              mono
              inputMode="decimal"
              placeholder="e.g., $50,000"
            />
          </div>

          <div style={{ marginTop: 6 }}>
            <FieldLabel t={t}>Business setup</FieldLabel>
            <Stack gap={10}>
              <ToggleCard
                t={t}
                on={selfEmployment.homeOffice}
                onClick={() => set({ homeOffice: !selfEmployment.homeOffice })}
                icon={<IconHome />}
                label="I use a home office"
                sub="Dedicated space used regularly for work"
              />
              <ToggleCard
                t={t}
                on={selfEmployment.vehicleUse}
                onClick={() => set({ vehicleUse: !selfEmployment.vehicleUse })}
                icon={<IconCar />}
                label="I use a vehicle for business"
                sub="Mileage, parking, tolls for client work"
              />
            </Stack>
          </div>

          <div>
            <FieldLabel
              t={t}
              hint={selfEmployment.cashBusiness ? "+$150 DOCS FEE" : undefined}>
              Documentation
            </FieldLabel>
            <ToggleCard
              t={t}
              on={selfEmployment.cashBusiness}
              onClick={() =>
                set({ cashBusiness: !selfEmployment.cashBusiness })
              }
              icon={<IconCash />}
              label="Is most of my revenue in cash?"
              sub="Cash businesses require more documentation"
              emphasis
            />
          </div>

          <div style={{ marginTop: 6 }}>
            <AntonioNote t={t}>
              Self-employment has dozens of deductions most people miss. Home
              office, mileage, equipment, health insurance, retirement
              contributions. We&apos;ll go through all of them.
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
