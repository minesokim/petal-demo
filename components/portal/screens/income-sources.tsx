"use client";

import * as React from "react";

import type { PortalTheme } from "../theme";
import {
  Body,
  Button,
  Card,
  H1,
  Row,
  Screen,
  Stack
} from "../primitives";
import { AntonioNote, IntakeHeader } from "../intake-chrome";
import { AskAntonioBar } from "../ask-antonio";
import { BackChevron } from "../form-fields";
import { useIntakeStore } from "@/lib/portal/intake-store";
import type { IncomeSourceId } from "@/lib/portal/intake-types";

/**
 * Income Sources — 1:1 port of intake-screens.jsx L1813–1926
 * (IncomeIcon + ScreenIncomeSources). 5 multi-select options with
 * per-option inline SVG icons (w2 / self / rental / invest / retire).
 */

function IncomeIcon({
  t,
  kind
}: {
  t: PortalTheme;
  kind: "w2" | "self" | "rental" | "invest" | "retire";
}) {
  const s = {
    width: 20,
    height: 20,
    stroke: t.rustInk,
    strokeWidth: 1.4,
    fill: "none" as const
  };
  switch (kind) {
    case "w2":
      return (
        <svg {...s} viewBox="0 0 20 20">
          <rect
            x="3"
            y="5"
            width="14"
            height="11"
            rx="1.5"
            strokeLinejoin="round"
          />
          <path d="M3 9h14M7 5V3h6v2" strokeLinecap="round" />
        </svg>
      );
    case "self":
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path d="M3 6h14v11H3zM3 6l3-3h8l3 3" strokeLinejoin="round" />
          <path d="M8 10h4" strokeLinecap="round" />
        </svg>
      );
    case "rental":
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path d="M3 10l7-6 7 6v7H3z" strokeLinejoin="round" />
          <path d="M8 17v-4h4v4" />
        </svg>
      );
    case "invest":
      return (
        <svg {...s} viewBox="0 0 20 20">
          <path
            d="M3 15l4-4 3 2 7-8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path d="M13 5h4v4" strokeLinecap="round" />
        </svg>
      );
    case "retire":
      return (
        <svg {...s} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" />
          <path
            d="M10 6v4l3 2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

// Maps the reference's 5-option toggle to the richer
// IncomeSourceId enum used by the decision tree. The decision tree
// keys on 'rental' and 'self1099' to branch into the rental / SE
// detail screens; other options just record interest.
const OPTIONS: {
  id: "w2" | "self" | "rental" | "invest" | "retire";
  storeIds: IncomeSourceId[];
  name: string;
  sub: string;
}[] = [
  { id: "w2", storeIds: ["w2"], name: "W-2 Employee", sub: "Regular paycheck from an employer" },
  { id: "self", storeIds: ["self1099"], name: "Self-Employed / 1099", sub: "Freelance, gig work, contracting" },
  { id: "rental", storeIds: ["rental"], name: "Rental Property", sub: "Income from property you own" },
  {
    id: "invest",
    storeIds: ["interestDiv", "capGains", "crypto"],
    name: "Investments / Crypto",
    sub: "Stocks, crypto, capital gains"
  },
  { id: "retire", storeIds: ["retirement"], name: "Retirement / Social Security", sub: "Pension, IRA distributions, SSA" }
];

export function ScreenIncomeSources({ t }: { t: PortalTheme }) {
  const { incomeSources, patch, goNext, goPrev } = useIntakeStore();

  const isOn = (opt: (typeof OPTIONS)[number]) =>
    opt.storeIds.some((id) => incomeSources.includes(id));

  const toggle = (opt: (typeof OPTIONS)[number]) => {
    const on = isOn(opt);
    const next = on
      ? incomeSources.filter((id) => !opt.storeIds.includes(id as IncomeSourceId))
      : [...new Set([...incomeSources, ...opt.storeIds])];
    patch({ incomeSources: next });
  };

  const canContinue = incomeSources.length > 0;

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <IntakeHeader t={t} step={7} label="Income" />
        <div style={{ padding: "32px 24px 8px" }}>
          <Row gap={10} align="center" style={{ marginBottom: 18 }}>
            <BackChevron t={t} onClick={goPrev} />
          </Row>
          <Stack gap={10}>
            <H1 t={t}>How do you earn income?</H1>
            <Body t={t} size={15}>
              Select all that apply.
            </Body>
          </Stack>
        </div>

        <Stack gap={10} style={{ padding: "20px 24px 16px", flex: 1 }}>
          {OPTIONS.map((o) => {
            const on = isOn(o);
            return (
              <Card
                key={o.id}
                t={t}
                onClick={() => toggle(o)}
                selected={on}
                tinted={on}
                style={{ padding: "14px 16px" }}>
                <Row gap={14} align="center">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: on ? t.rustSoft : t.bgElev,
                      border: `1px solid ${on ? t.rust : t.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                    <IncomeIcon t={t} kind={o.id} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: t.ink,
                        marginBottom: 2
                      }}>
                      {o.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: t.muted,
                        lineHeight: 1.4
                      }}>
                      {o.sub}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 5,
                      border: `1.5px solid ${on ? t.rust : t.border}`,
                      background: on ? t.rust : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                    {on ? (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path
                          d="M1 4.5l2.8 2.8L10 1"
                          stroke="#fff"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </div>
                </Row>
              </Card>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <AntonioNote t={t}>
              Don&apos;t overthink this. If you got paid for it, select it.
              I&apos;ll sort out the forms.
            </AntonioNote>
          </div>
        </Stack>

        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: `linear-gradient(to top, ${t.bg} 75%, transparent)`,
            padding: "18px 24px 28px"
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
              style={{ flex: 1 }}
              disabled={!canContinue}>
              Continue
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}
