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
  SSNField,
  TextField
} from "../form-fields";
import { useIntakeStore } from "@/lib/portal/intake-store";

/**
 * Spouse Info — 1:1 port of spouse-info.jsx. Short conditional
 * screen with ContextChip ("Because you're filing jointly/separately")
 * and 4 fields.
 */

export function ScreenSpouseInfo({ t }: { t: PortalTheme }) {
  const {
    filingStatus,
    spouseFirstName,
    spouseLastName,
    spouseDob,
    spouseSsn,
    spouseOccupation,
    patch,
    goNext,
    goPrev
  } = useIntakeStore();

  const spouseName = `${spouseFirstName} ${spouseLastName}`.trim();
  const setSpouseName = (v: string) => {
    const parts = v.trim().split(/\s+/);
    const first = parts.shift() ?? "";
    const last = parts.join(" ");
    patch({ spouseFirstName: first, spouseLastName: last });
  };

  const context =
    filingStatus === "mfs"
      ? "Because you're filing separately"
      : "Because you're filing jointly";

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <IntakeHeader t={t} step={5} label="Spouse" />

        <div style={{ padding: "22px 24px 0" }}>
          <BackChevron t={t} onClick={goPrev} />
        </div>

        <div style={{ padding: "18px 24px 0" }}>
          <ContextChip t={t}>{context}</ContextChip>
        </div>

        <div style={{ padding: "14px 24px 8px" }}>
          <Stack gap={10}>
            <H1 t={t}>Tell me about your spouse.</H1>
            <Body t={t} size={15}>
              Basic info for the joint return.
            </Body>
          </Stack>
        </div>

        <Stack gap={20} style={{ padding: "22px 24px 16px", flex: 1 }}>
          <div>
            <FieldLabel t={t}>Spouse&apos;s full legal name</FieldLabel>
            <TextField
              t={t}
              value={spouseName}
              onChange={setSpouseName}
              placeholder="First Middle Last"
            />
          </div>

          <div>
            <FieldLabel t={t}>Date of birth</FieldLabel>
            <TextField
              t={t}
              value={spouseDob}
              onChange={(v) => patch({ spouseDob: v })}
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
              ssn={spouseSsn}
              onChange={(v) => patch({ spouseSsn: v })}
            />
          </div>

          <div>
            <FieldLabel t={t}>Occupation</FieldLabel>
            <TextField
              t={t}
              value={spouseOccupation}
              onChange={(v) => patch({ spouseOccupation: v })}
              placeholder="e.g. High School Math Teacher"
            />
          </div>

          <div style={{ marginTop: 8 }}>
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
