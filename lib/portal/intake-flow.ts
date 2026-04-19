/**
 * Intake decision tree.
 *
 * Given the current intake state (user's answers so far) this module
 * computes the full ordered sequence of step keys the user needs to
 * walk through. The UI doesn't need to know about the tree — it just
 * asks:
 *   const next = getNextStep(state, currentStep)
 *   const prev = getPrevStep(state, currentStep)
 *   const { index, total } = getStepPosition(state, currentStep)
 *
 * The tree recomputes every time state changes, so if a client goes
 * back and changes their filing status from Single to MFJ the
 * Spouse Info step appears in the sequence automatically. The step
 * index ("03 of 13") reported in IntakeHeader adjusts accordingly.
 *
 * Branching rules (see design-references/client-portal/components/
 * app-shell.jsx canvas order for the reference ordering):
 *
 *   servicePath === 'biz'     → replace personal path with business
 *                                alt path (businessInfo →
 *                                businessFormation)
 *   servicePath === 'other'   → short consultation path
 *                                (strategicTopics → contactInfo)
 *   filingStatus in [mfj,mfs] → include spouseInfo
 *   dependentCount > 0        → include dependentDetails
 *   incomeSources includes    → include rentalDetail
 *     'rental'
 *   incomeSources includes    → include selfEmploymentDetail
 *     'self1099' OR
 *   servicePath === 'self'
 *
 * The display-facing "Step N of M" counter only considers the
 * numbered portion of the flow (servicePath onward). Auth/welcome/
 * tutorial/legal/deposit screens show their own chrome instead.
 */

import type { IntakeState, IntakeStepKey } from "./intake-types";

/* ─────────────────────── Step metadata ─────────────────────── */

/**
 * Which part of the flow a step belongs to. Affects how header chrome
 * renders (auth screens have no step counter; numbered screens show
 * "N of 13"; legal/final screens show "Final step"; post-login tab
 * screens never go through this flow).
 */
export type StepPhase = "auth" | "numbered" | "final";

export type StepMeta = {
  key: IntakeStepKey;
  phase: StepPhase;
  /** Human label rendered in IntakeHeader eyebrow. */
  label: string;
  /**
   * The abstract step number shown to the user (1..13). Several
   * concrete step keys can share the same step number (e.g. the
   * services A + B sub-steps are both "step 1"); they then
   * differentiate via subStep = "A" | "B".
   */
  stepNumber?: number;
  subStep?: "A" | "B";
};

const META: Record<IntakeStepKey, StepMeta> = {
  login: { key: "login", phase: "auth", label: "Sign in" },
  otp: { key: "otp", phase: "auth", label: "Verify" },
  welcome: { key: "welcome", phase: "auth", label: "Welcome" },
  tutorial: { key: "tutorial", phase: "auth", label: "How this works" },

  servicePath: { key: "servicePath", phase: "numbered", label: "Services", stepNumber: 1, subStep: "A" },
  serviceAddons: { key: "serviceAddons", phase: "numbered", label: "Services", stepNumber: 1, subStep: "B" },
  personalInfo: { key: "personalInfo", phase: "numbered", label: "Personal info", stepNumber: 2 },
  stateAndPriorYear: { key: "stateAndPriorYear", phase: "numbered", label: "State & prior year", stepNumber: 3 },
  filingStatus: { key: "filingStatus", phase: "numbered", label: "Filing status", stepNumber: 4 },
  spouseInfo: { key: "spouseInfo", phase: "numbered", label: "Spouse info", stepNumber: 5 },
  dependentsCount: { key: "dependentsCount", phase: "numbered", label: "Dependents", stepNumber: 6 },
  dependentDetails: { key: "dependentDetails", phase: "numbered", label: "Dependents", stepNumber: 6 },
  incomeSources: { key: "incomeSources", phase: "numbered", label: "Income", stepNumber: 7 },
  rentalDetail: { key: "rentalDetail", phase: "numbered", label: "Rental detail", stepNumber: 7 },
  selfEmploymentDetail: { key: "selfEmploymentDetail", phase: "numbered", label: "Self-employment", stepNumber: 7 },
  taxQuestions: { key: "taxQuestions", phase: "numbered", label: "Tax questions", stepNumber: 8 },
  deductions: { key: "deductions", phase: "numbered", label: "Deductions", stepNumber: 9 },
  lifeEvents: { key: "lifeEvents", phase: "numbered", label: "Life events", stepNumber: 10 },
  refundPreference: { key: "refundPreference", phase: "numbered", label: "Refund", stepNumber: 11 },

  // Business alt path — replaces filing status onward when servicePath = 'biz'.
  // These appear as numbered 2..4 on the business branch.
  businessInfo: { key: "businessInfo", phase: "numbered", label: "Business info", stepNumber: 2 },
  businessFormation: { key: "businessFormation", phase: "numbered", label: "Formation", stepNumber: 3 },

  // Consultation alt path — replaces most of the flow when servicePath = 'other'.
  strategicTopics: { key: "strategicTopics", phase: "numbered", label: "Topics", stepNumber: 2 },
  contactInfo: { key: "contactInfo", phase: "numbered", label: "Contact", stepNumber: 3 },

  docsUpload: { key: "docsUpload", phase: "numbered", label: "Documents", stepNumber: 12 },

  engagement: { key: "engagement", phase: "final", label: "Engagement letter" },
  consent7216: { key: "consent7216", phase: "final", label: "§7216 consent" },
  scheduleAppt: { key: "scheduleAppt", phase: "final", label: "Schedule" },
  deposit: { key: "deposit", phase: "final", label: "Deposit" },
  done: { key: "done", phase: "final", label: "Complete" }
};

export function stepMeta(key: IntakeStepKey): StepMeta {
  return META[key];
}

/* ─────────────────────── Flow computation ─────────────────────── */

/**
 * Produce the ordered sequence of step keys for the current state.
 * Pure function — safe to call from React render.
 */
export function getStepSequence(state: IntakeState): IntakeStepKey[] {
  const seq: IntakeStepKey[] = [];

  // Auth + pre-intake
  if (!state.phoneVerified) {
    seq.push("login", "otp");
  }
  seq.push("welcome");
  if (!state.tutorialSeen) seq.push("tutorial");

  // Services always comes first
  seq.push("servicePath");
  if (state.servicePath && state.servicePath !== "other") {
    seq.push("serviceAddons");
  }

  // Branch on service path
  if (state.servicePath === "biz") {
    seq.push("businessInfo", "businessFormation");
  } else if (state.servicePath === "other") {
    seq.push("strategicTopics", "contactInfo");
  } else {
    // Personal & Self-Employed share the numbered linear flow
    seq.push("personalInfo", "stateAndPriorYear", "filingStatus");

    if (state.filingStatus === "mfj" || state.filingStatus === "mfs") {
      seq.push("spouseInfo");
    }

    seq.push("dependentsCount");
    if (state.dependentCount > 0) {
      seq.push("dependentDetails");
    }

    seq.push("incomeSources");
    if (
      state.incomeSources.includes("rental") ||
      state.addons.includes("rental")
    ) {
      seq.push("rentalDetail");
    }
    if (
      state.servicePath === "self" ||
      state.incomeSources.includes("self1099")
    ) {
      seq.push("selfEmploymentDetail");
    }

    seq.push("taxQuestions", "deductions", "lifeEvents", "refundPreference");
  }

  // Documents (skipped for consultation-only path "other")
  if (state.servicePath !== "other") {
    seq.push("docsUpload");
  }

  // Legal + scheduling + deposit + done
  seq.push("engagement", "consent7216", "scheduleAppt", "deposit", "done");

  return seq;
}

/**
 * Total number of "numbered" steps for the current state. Used as
 * the denominator in the IntakeHeader step counter — e.g. "03 of 13".
 */
export function getNumberedTotal(state: IntakeState): number {
  const seq = getStepSequence(state);
  const numbered = seq.filter((k) => META[k].phase === "numbered");
  // Distinct stepNumber values (1A + 1B collapse to one)
  const distinct = new Set<number>();
  for (const k of numbered) {
    const n = META[k].stepNumber;
    if (typeof n === "number") distinct.add(n);
  }
  return distinct.size;
}

/**
 * Position of `current` in the step sequence. If `current` isn't in
 * the sequence (e.g. the state just mutated and the old step is no
 * longer relevant), returns `{ index: -1 }` and callers should redirect.
 */
export function getStepPosition(
  state: IntakeState,
  current: IntakeStepKey
): { index: number; total: number } {
  const seq = getStepSequence(state);
  const index = seq.indexOf(current);
  return { index, total: seq.length };
}

/**
 * Next step in the sequence, or null if `current` is the final step
 * (or no longer valid).
 */
export function getNextStep(
  state: IntakeState,
  current: IntakeStepKey
): IntakeStepKey | null {
  const seq = getStepSequence(state);
  const i = seq.indexOf(current);
  if (i === -1 || i >= seq.length - 1) return null;
  return seq[i + 1];
}

/**
 * Previous step — null if `current` is the first, or if the step
 * before is an auth/welcome step the user shouldn't re-enter.
 */
export function getPrevStep(
  state: IntakeState,
  current: IntakeStepKey
): IntakeStepKey | null {
  const seq = getStepSequence(state);
  const i = seq.indexOf(current);
  if (i <= 0) return null;
  const prev = seq[i - 1];
  // Don't let users navigate backward into OTP verification — once
  // verified, that's done.
  if (prev === "otp" || prev === "login") return null;
  return prev;
}

/**
 * The first step a returning client should land on. If they're mid-
 * intake (tutorialSeen + not done) we resume at their earliest
 * unsatisfied step; if they haven't verified their phone yet they
 * start at login.
 *
 * For Phase 1 we just return "login" / "welcome" / "servicePath"
 * depending on auth state — a more sophisticated resume strategy
 * would inspect each step's completeness.
 */
export function getLandingStep(state: IntakeState): IntakeStepKey {
  if (!state.phoneVerified) return "login";
  if (!state.tutorialSeen) return "welcome";
  return "servicePath";
}

/**
 * Whether the intake is considered complete enough to unlock the
 * post-login portal home screen. Once deposit is paid and both
 * legal docs are signed, `/portal` lands on ScreenHome.
 */
export function isIntakeComplete(state: IntakeState): boolean {
  return (
    state.legal.engagement.signed &&
    state.legal.consent7216.signed &&
    state.deposit.paid
  );
}
