"use client";

import * as React from "react";

import { useIntakeStore } from "@/lib/portal/intake-store";
import { getStepSequence } from "@/lib/portal/intake-flow";
import type { IntakeStepKey } from "@/lib/portal/intake-types";

import { t as theme } from "./theme";
import { AskAntonioChat } from "./ask-antonio";

// Ported screens (faithful 1:1 restart)
import { ScreenLogin, ScreenOTP } from "./screens/auth";
import { ScreenWelcome } from "./screens/welcome";
import { ScreenTutorial } from "./screens/tutorial";
import {
  ScreenFilingStatus,
  ScreenServicePath,
  ScreenServiceAddons
} from "./screens/services";
import { ScreenPersonalInfo } from "./screens/personal-info";
import {
  ScreenStateAndPriorYear,
  ScreenRentalDetail
} from "./screens/rental-state";
import { ScreenSpouseInfo } from "./screens/spouse-info";
import {
  ScreenDependentsCount,
  ScreenDependentDetails
} from "./screens/dependents";
import { ScreenIncomeSources } from "./screens/income-sources";
import { ScreenSelfEmployment } from "./screens/self-employment";
import { ScreenTaxQuestions } from "./screens/tax-questions";

/**
 * PortalApp — top-level entry for the v4 client portal.
 *
 * Reads `currentStep` from the Zustand intake store and renders the
 * corresponding ported screen. AskAntonioChat is mounted once at the
 * root so the `ask-antonio:open` custom event (dispatched by every
 * AskAntonioBar on every intake screen) can open the bottom-sheet
 * over any surface.
 *
 * Screens still in flight from the 1:1 restart render a clean
 * "porting in progress" card so the app always builds and runs.
 */
export function PortalApp() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const step = useIntakeStore((s) => s.currentStep);

  if (!mounted) return <PortalFrame>{null}</PortalFrame>;

  return (
    <PortalFrame>
      <RouteStep step={step} />
      <AskAntonioChat t={theme} />
    </PortalFrame>
  );
}

function RouteStep({ step }: { step: IntakeStepKey }) {
  const t = theme;
  switch (step) {
    case "login":
      return <ScreenLogin t={t} />;
    case "otp":
      return <ScreenOTP t={t} />;
    case "welcome":
      return <ScreenWelcome t={t} />;
    case "tutorial":
      return <ScreenTutorial t={t} />;
    case "servicePath":
      return <ScreenServicePath t={t} />;
    case "serviceAddons":
      return <ScreenServiceAddons t={t} />;
    case "personalInfo":
      return <ScreenPersonalInfo t={t} />;
    case "stateAndPriorYear":
      return <ScreenStateAndPriorYear t={t} />;
    case "filingStatus":
      return <ScreenFilingStatus t={t} />;
    case "spouseInfo":
      return <ScreenSpouseInfo t={t} />;
    case "dependentsCount":
      return <ScreenDependentsCount t={t} />;
    case "dependentDetails":
      return <ScreenDependentDetails t={t} />;
    case "incomeSources":
      return <ScreenIncomeSources t={t} />;
    case "rentalDetail":
      return <ScreenRentalDetail t={t} />;
    case "selfEmploymentDetail":
      return <ScreenSelfEmployment t={t} />;
    case "taxQuestions":
      return <ScreenTaxQuestions t={t} />;
    default:
      return <Placeholder step={step} />;
  }
}

/**
 * Mobile-width column centered on desktop, full-bleed on phones.
 * No iOS bezel — per user direction during the restart.
 */
function PortalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: theme.bg,
        fontFamily: theme.sans
      }}>
      <div
        style={{
          margin: "0 auto",
          maxWidth: 430,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: theme.bg,
          boxShadow: `0 0 0 1px ${theme.borderSoft}`,
          position: "relative",
          overflow: "hidden"
        }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Clean placeholder for any step key whose screen hasn't been ported
 * yet in this restart. Uses the same theme surface + typography as
 * a real screen so there's no visual shock — and explicitly lists
 * the step key so it's obvious what's missing.
 */
function Placeholder({ step }: { step: IntakeStepKey }) {
  const t = theme;
  const { goPrev, goNext, goTo } = useIntakeStore.getState();
  const seq = getStepSequence(useIntakeStore.getState());

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "60px 24px 40px",
        color: t.ink,
        fontFamily: t.sans
      }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 16
        }}>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 10,
            color: t.rustInk,
            letterSpacing: 1.2,
            textTransform: "uppercase"
          }}>
          Porting 1:1 · in progress
        </div>
        <div
          style={{
            fontFamily: t.serif,
            fontSize: 30,
            lineHeight: 1.15,
            letterSpacing: -0.6,
            color: t.ink
          }}>
          <span style={{ fontStyle: "italic" }}>{step}</span>
          <br />
          not yet ported
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: t.inkSoft,
            maxWidth: 320
          }}>
          This screen is a faithful 1:1 port of its counterpart in{" "}
          <span
            style={{ fontFamily: t.mono, fontSize: 12, color: t.rustInk }}>
            design-references/client-portal/components/
          </span>
          , still queued in the restart. Use the bottom buttons to walk the
          decision tree with the ported screens.
        </div>
        <div
          style={{
            marginTop: 12,
            padding: "12px 14px",
            background: t.bgElev,
            border: `1px solid ${t.borderSoft}`,
            borderRadius: t.radius,
            fontSize: 12,
            color: t.muted,
            lineHeight: 1.55
          }}>
          <div style={{ marginBottom: 6 }}>
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 10,
                letterSpacing: 1,
                color: t.muted
              }}>
              FULL PATH
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {seq.map((k) => (
              <span
                key={k}
                onClick={() => goTo(k)}
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: `1px solid ${k === step ? t.rust : t.border}`,
                  background: k === step ? t.tintAccent : "transparent",
                  color: k === step ? t.rustInk : t.inkSoft,
                  fontFamily: t.mono,
                  fontSize: 11,
                  cursor: "pointer"
                }}>
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={goPrev}
          style={{
            flex: "0 0 auto",
            padding: "14px 22px",
            borderRadius: 999,
            background: "transparent",
            color: t.ink,
            border: `1px solid ${t.border}`,
            fontFamily: t.sans,
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer"
          }}>
          Back
        </button>
        <button
          onClick={goNext}
          style={{
            flex: 1,
            padding: "14px 22px",
            borderRadius: 999,
            background: t.rust,
            color: "#fff",
            border: `1px solid ${t.rust}`,
            fontFamily: t.sans,
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer"
          }}>
          Continue
        </button>
      </div>
    </div>
  );
}
