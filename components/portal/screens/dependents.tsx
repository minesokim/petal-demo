"use client";

import * as React from "react";

import type { PortalTheme } from "../theme";
import { Body, Button, H1, Row, Screen, Stack } from "../primitives";
import { AntonioNote, IntakeHeader } from "../intake-chrome";
import { AskAntonioBar } from "../ask-antonio";
import { BackChevron, FieldLabel, SSNField, TextField } from "../form-fields";
import { useIntakeStore } from "@/lib/portal/intake-store";
import type { Dependent } from "@/lib/portal/intake-types";

/**
 * Dependents Count + Details — 1:1 port of dependents-count.jsx and
 * dependent-details.jsx. "None" path skips the details screen via
 * the decision-tree flow (dependentDetails only appears when
 * dependentCount > 0).
 */

/* ─── Count ─── */

function DependentCard({
  t,
  selected,
  onClick,
  label,
  sub,
  icon
}: {
  t: PortalTheme;
  selected: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "18px 18px",
        background: selected ? t.tintAccent : t.card,
        border: `1px solid ${selected ? t.rust : t.border}`,
        borderRadius: t.radius,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: t.sans,
        transition: "border-color 120ms, background 120ms"
      }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: selected ? t.rust : t.bgElev,
          border: `1px solid ${selected ? t.rust : t.borderSoft}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: t.serif,
          fontSize: 20,
          fontWeight: 500,
          color: selected ? "#fff" : t.ink,
          letterSpacing: -0.4
        }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            color: t.ink,
            fontWeight: 500,
            letterSpacing: -0.1,
            marginBottom: 2
          }}>
          {label}
        </div>
        <div style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.35 }}>
          {sub}
        </div>
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `1.5px solid ${selected ? t.rust : t.border}`,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}>
        {selected ? (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: t.rust
            }}
          />
        ) : null}
      </div>
    </button>
  );
}

export function ScreenDependentsCount({ t }: { t: PortalTheme }) {
  const { dependentCount, patch, goNext, goPrev } = useIntakeStore();
  const sel =
    dependentCount === 0
      ? "none"
      : dependentCount === 1
        ? "one"
        : dependentCount === 2
          ? "two"
          : dependentCount >= 3
            ? "more"
            : null;

  const options = [
    {
      id: "none" as const,
      label: "No dependents",
      sub: "Just me (and spouse, if applicable)",
      icon: "0"
    },
    {
      id: "one" as const,
      label: "1 dependent",
      sub: "One child, parent, or other",
      icon: "1"
    },
    {
      id: "two" as const,
      label: "2 dependents",
      sub: "Two qualifying individuals",
      icon: "2"
    },
    {
      id: "more" as const,
      label: "3 or more",
      sub: "We'll capture the full list next",
      icon: "3+"
    }
  ];

  const pick = (id: "none" | "one" | "two" | "more") => {
    const count = id === "none" ? 0 : id === "one" ? 1 : id === "two" ? 2 : 3;
    const existing = useIntakeStore.getState().dependents;
    const resized: Dependent[] = Array.from({ length: count }, (_, i) =>
      existing[i] ?? {
        firstName: "",
        lastName: "",
        ssn: "",
        dob: "",
        relationship: "child" as const,
        monthsInHome: 12
      }
    );
    patch({ dependentCount: count, dependents: resized });
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
        <IntakeHeader t={t} step={6} label="Dependents" />

        <div style={{ padding: "22px 24px 0" }}>
          <BackChevron t={t} onClick={goPrev} />
        </div>

        <div style={{ padding: "18px 24px 8px" }}>
          <Stack gap={10}>
            <H1 t={t}>Do you have any dependents?</H1>
            <Body t={t} size={15}>
              Children, elderly parents, or anyone who depends on you
              financially.
            </Body>
          </Stack>
        </div>

        <Stack gap={10} style={{ padding: "22px 24px 16px", flex: 1 }}>
          {options.map((o) => (
            <DependentCard
              key={o.id}
              t={t}
              selected={sel === o.id}
              onClick={() => pick(o.id)}
              label={o.label}
              sub={o.sub}
              icon={o.icon}
            />
          ))}
          <div style={{ marginTop: 10 }}>
            <AntonioNote t={t}>
              Dependents unlock credits like the Child Tax Credit ($2,000+ per
              child). Even if you&apos;re not sure someone qualifies, mention
              them.
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
            <Button
              t={t}
              onClick={goNext}
              disabled={!sel}
              style={{ flex: 1, opacity: sel ? 1 : 0.45 }}>
              Continue
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

/* ─── Details ─── */

function DependentCardDetails({
  t,
  index,
  dep,
  onChange
}: {
  t: PortalTheme;
  index: number;
  dep: Dependent;
  onChange: (next: Dependent) => void;
}) {
  const fullName = `${dep.firstName} ${dep.lastName}`.trim();
  const setName = (v: string) => {
    const parts = v.trim().split(/\s+/);
    const first = parts.shift() ?? "";
    const last = parts.join(" ");
    onChange({ ...dep, firstName: first, lastName: last });
  };
  return (
    <div
      style={{
        padding: "18px 18px 6px",
        background: t.bgElev,
        border: `1px solid ${t.borderSoft}`,
        borderRadius: t.radius
      }}>
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          color: t.rustInk,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          marginBottom: 14
        }}>
        Dependent {index}
      </div>

      <Stack gap={16}>
        <div>
          <FieldLabel t={t}>Full name</FieldLabel>
          <TextField
            t={t}
            value={fullName}
            onChange={setName}
            placeholder="First and last name"
          />
        </div>

        <div>
          <FieldLabel t={t}>Date of birth</FieldLabel>
          <TextField
            t={t}
            value={dep.dob}
            onChange={(v) => onChange({ ...dep, dob: v })}
            placeholder="MM / DD / YYYY"
            mono
            inputMode="numeric"
          />
        </div>

        <div>
          <FieldLabel t={t} hint="LAST 4 SHOWN">
            Social Security Number
          </FieldLabel>
          <SSNField
            t={t}
            ssn={dep.ssn}
            onChange={(v) => onChange({ ...dep, ssn: v })}
          />
        </div>

        <div>
          <FieldLabel t={t}>Relationship</FieldLabel>
          <TextField
            t={t}
            value={dep.relationship}
            onChange={(v) =>
              onChange({
                ...dep,
                relationship: (v || "other") as Dependent["relationship"]
              })
            }
            placeholder="Son, Daughter, Parent"
          />
        </div>

        <div>
          <FieldLabel t={t}>Months living with you in 2025</FieldLabel>
          <TextField
            t={t}
            value={String(dep.monthsInHome)}
            onChange={(v) => {
              const n = Math.max(0, Math.min(12, Number(v.replace(/\D/g, "")) || 0));
              onChange({ ...dep, monthsInHome: n });
            }}
            placeholder="12"
            mono
            inputMode="numeric"
          />
        </div>
      </Stack>
    </div>
  );
}

export function ScreenDependentDetails({ t }: { t: PortalTheme }) {
  const { dependents, patch, goNext, goPrev } = useIntakeStore();

  const setAt = (i: number, next: Dependent) => {
    patch({
      dependents: dependents.map((d, j) => (j === i ? next : d))
    });
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
        <IntakeHeader t={t} step={6} label="Dependents" />

        <div style={{ padding: "22px 24px 0" }}>
          <BackChevron t={t} onClick={goPrev} />
        </div>

        <div style={{ padding: "18px 24px 8px" }}>
          <Stack gap={10}>
            <H1 t={t}>Tell me about your dependents</H1>
            <Body t={t} size={15}>
              Just the basics. I&apos;ll sort out who qualifies.
            </Body>
          </Stack>
        </div>

        <Stack gap={12} style={{ padding: "22px 24px 16px", flex: 1 }}>
          {dependents.map((dep, i) => (
            <DependentCardDetails
              key={i}
              t={t}
              index={i + 1}
              dep={dep}
              onChange={(next) => setAt(i, next)}
            />
          ))}
          <div style={{ marginTop: 10 }}>
            <AntonioNote t={t}>
              If you have a child under 13 and pay for daycare, that&apos;s a
              big credit we don&apos;t want to miss — I&apos;ll ask about that
              next.
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
