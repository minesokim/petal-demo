"use client";

import * as React from "react";

import { useIntakeStore } from "@/lib/portal/intake-store";
import type { IntakeStepKey } from "@/lib/portal/intake-types";
import { getStepSequence, isIntakeComplete } from "@/lib/portal/intake-flow";

import { ScreenLogin, ScreenOtp, ScreenWelcome } from "./screens/auth";
import { ScreenTutorial } from "./screens/tutorial";
import { ScreenServicePath, ScreenServiceAddons } from "./screens/services";
import {
  ScreenPersonalInfo,
  ScreenStateAndPriorYear,
  ScreenFilingStatus,
  ScreenSpouseInfo,
  ScreenDependentsCount,
  ScreenDependentDetails
} from "./screens/personal";
import {
  ScreenIncomeSources,
  ScreenRentalDetail,
  ScreenSelfEmploymentDetail
} from "./screens/income";
import {
  ScreenTaxQuestions,
  ScreenDeductions,
  ScreenLifeEvents,
  ScreenRefundPreference
} from "./screens/questions";
import {
  ScreenBusinessInfo,
  ScreenBusinessFormation,
  ScreenStrategicTopics,
  ScreenContactInfo
} from "./screens/business";
import { ScreenDocsUpload } from "./screens/docs";
import {
  ScreenEngagement,
  ScreenConsent7216,
  ScreenScheduleAppt,
  ScreenDeposit,
  ScreenDone
} from "./screens/legal";

import { PortalTabBar, type PortalTab } from "./post-login/tab-bar";
import { ScreenHome } from "./post-login/home";
import {
  ScreenDocs,
  ScreenMessages,
  ScreenSignatures,
  ScreenProfile
} from "./post-login/tabs";

/**
 * PortalApp — top-level entry for the v4 client portal.
 *
 * Responsibilities:
 *   1. Hydration gate. Zustand persist restores from localStorage on
 *      mount, so we render a skeleton until it's done — otherwise
 *      server and client would disagree on currentStep.
 *   2. Route into one of two worlds:
 *        intake (pre-completion)  → renders the current IntakeStepKey
 *        post-login (complete)    → renders the tab bar + tab screen
 *      The gate is `isIntakeComplete(state)` — engagement + §7216
 *      signed AND deposit paid.
 *   3. Correct stale currentStep. If the decision tree no longer
 *      includes the persisted step (e.g. user changed filing status
 *      back to Single so spouseInfo dropped out), nudge them to the
 *      nearest valid step.
 *
 * The portal is designed mobile-first (390px canvas in the design
 * reference). On desktop we center a 420px column against the page
 * background so the experience reads like the designed phone screen.
 */
export function PortalApp() {
  const storeState = useIntakeStore();
  const { currentStep, goTo } = storeState;

  // Hydration: persist middleware loads async. `hasHydrated` is part
  // of the middleware store but we read it via a ref in client-only
  // code. Simpler: track mounted flag.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Tab bar state for post-login world
  const [tab, setTab] = React.useState<PortalTab>("home");

  // Sanity: make sure currentStep is still in the sequence. If not
  // (state branch changed), drop to the first valid step.
  React.useEffect(() => {
    if (!mounted) return;
    const seq = getStepSequence(storeState);
    if (!seq.includes(currentStep)) {
      goTo(seq[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentStep, storeState.servicePath, storeState.filingStatus]);

  if (!mounted) {
    return <PortalFrame><PortalSkeleton /></PortalFrame>;
  }

  const complete = isIntakeComplete(storeState);

  if (complete) {
    return (
      <PortalFrame>
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-hidden">
            {tab === "home" ? <ScreenHome onTab={setTab} /> : null}
            {tab === "docs" ? <ScreenDocs /> : null}
            {tab === "messages" ? <ScreenMessages /> : null}
            {tab === "signatures" ? <ScreenSignatures /> : null}
            {tab === "profile" ? <ScreenProfile onTab={setTab} /> : null}
          </div>
          <PortalTabBar
            active={tab}
            onTab={setTab}
            unreadMessages={1}
            pendingSignatures={
              storeState.legal.engagement.signed &&
              storeState.legal.consent7216.signed
                ? 1 /* 8879 pending */
                : 0
            }
          />
        </div>
      </PortalFrame>
    );
  }

  return (
    <PortalFrame>
      <IntakeStepRouter step={currentStep} />
    </PortalFrame>
  );
}

/* ─────────────────────── Step router ─────────────────────── */

function IntakeStepRouter({ step }: { step: IntakeStepKey }) {
  switch (step) {
    case "login":
      return <ScreenLogin />;
    case "otp":
      return <ScreenOtp />;
    case "welcome":
      return <ScreenWelcome />;
    case "tutorial":
      return <ScreenTutorial />;
    case "servicePath":
      return <ScreenServicePath />;
    case "serviceAddons":
      return <ScreenServiceAddons />;
    case "personalInfo":
      return <ScreenPersonalInfo />;
    case "stateAndPriorYear":
      return <ScreenStateAndPriorYear />;
    case "filingStatus":
      return <ScreenFilingStatus />;
    case "spouseInfo":
      return <ScreenSpouseInfo />;
    case "dependentsCount":
      return <ScreenDependentsCount />;
    case "dependentDetails":
      return <ScreenDependentDetails />;
    case "incomeSources":
      return <ScreenIncomeSources />;
    case "rentalDetail":
      return <ScreenRentalDetail />;
    case "selfEmploymentDetail":
      return <ScreenSelfEmploymentDetail />;
    case "taxQuestions":
      return <ScreenTaxQuestions />;
    case "deductions":
      return <ScreenDeductions />;
    case "lifeEvents":
      return <ScreenLifeEvents />;
    case "refundPreference":
      return <ScreenRefundPreference />;
    case "businessInfo":
      return <ScreenBusinessInfo />;
    case "businessFormation":
      return <ScreenBusinessFormation />;
    case "strategicTopics":
      return <ScreenStrategicTopics />;
    case "contactInfo":
      return <ScreenContactInfo />;
    case "docsUpload":
      return <ScreenDocsUpload />;
    case "engagement":
      return <ScreenEngagement />;
    case "consent7216":
      return <ScreenConsent7216 />;
    case "scheduleAppt":
      return <ScreenScheduleAppt />;
    case "deposit":
      return <ScreenDeposit />;
    case "done":
      return <ScreenDone />;
    default: {
      // Exhaustiveness check — TS will error here if a new step is
      // added without a handler.
      const _exhaustive: never = step;
      void _exhaustive;
      return null;
    }
  }
}

/* ─────────────────────── Frame ─────────────────────── */

/**
 * Centers a mobile-width column against the portal bg so the desktop
 * and phone experiences both read like the designed 390px canvas.
 * No phone bezel — this is a real web app; the bezel was only for
 * the design prototype's canvas mode.
 */
function PortalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-portal-bg">
      <div className="mx-auto flex h-screen max-w-[430px] flex-col bg-portal-bg shadow-[0_0_0_1px_var(--portal-border-soft)]">
        {children}
      </div>
    </div>
  );
}

function PortalSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
      <div className="size-16 animate-pulse rounded-full bg-portal-border-soft" />
      <div className="h-4 w-40 animate-pulse rounded-full bg-portal-border-soft" />
      <div className="h-3 w-56 animate-pulse rounded-full bg-portal-border-soft/60" />
    </div>
  );
}
