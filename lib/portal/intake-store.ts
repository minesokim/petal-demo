"use client";

/**
 * Intake store — single Zustand slice that holds every client-facing
 * answer plus the current step and a coarse auth flag.
 *
 * SECURITY: this state holds raw PII (SSN, bank routing/account, spouse +
 * dependent SSNs). It is held IN MEMORY ONLY and is intentionally NOT
 * persisted — writing it to localStorage would leave plaintext SSN/bank
 * data on the client's disk, readable by any script on the origin and
 * surviving until manually cleared. Resume-after-refresh is therefore not
 * supported here; durable progress lives server-side in the encrypted
 * intake_session (lib/repository/intake.ts saveAnswers, envelope-encrypted).
 *
 * Selectors (getNextStep / getPrevStep / getStepPosition) live in
 * ./intake-flow.ts — this file only owns mutation.
 */

import { create } from "zustand";

import { INITIAL_STATE, type IntakeState, type IntakeStepKey } from "./intake-types";
import { getLandingStep, getNextStep, getPrevStep } from "./intake-flow";

type Store = IntakeState & {
  /** The current step key. Source of truth for which screen renders. */
  currentStep: IntakeStepKey;

  /* ─ Navigation ─ */
  goNext: () => void;
  goPrev: () => void;
  goTo: (step: IntakeStepKey) => void;
  reset: () => void;

  /* ─ Shallow/partial update (merge into state) ─ */
  patch: (partial: Partial<IntakeState>) => void;

  /* ─ Domain actions ─ */
  setPhone: (phone: string) => void;
  verifyPhone: () => void;
  markTutorialSeen: () => void;

  signEngagement: () => void;
  signConsent7216: () => void;
  markDepositPaid: (amount?: number) => void;
};

export const useIntakeStore = create<Store>()(
  (set, get) => ({
    ...INITIAL_STATE,
    currentStep: getLandingStep(INITIAL_STATE),

      goNext: () => {
        const s = get();
        const next = getNextStep(s, s.currentStep);
        if (next) set({ currentStep: next });
      },

      goPrev: () => {
        const s = get();
        const prev = getPrevStep(s, s.currentStep);
        if (prev) set({ currentStep: prev });
      },

      goTo: (step) => set({ currentStep: step }),

      reset: () =>
        set({
          ...INITIAL_STATE,
          currentStep: getLandingStep(INITIAL_STATE)
        }),

      patch: (partial) => set((state) => ({ ...state, ...partial })),

      setPhone: (phone) => set({ phone }),

      verifyPhone: () => set({ phoneVerified: true }),

      markTutorialSeen: () => set({ tutorialSeen: true }),

      signEngagement: () =>
        set((s) => ({
          legal: {
            ...s.legal,
            engagement: { signed: true, signedAt: new Date().toISOString() }
          }
        })),

      signConsent7216: () =>
        set((s) => ({
          legal: {
            ...s.legal,
            consent7216: { signed: true, signedAt: new Date().toISOString() }
          }
        })),

      markDepositPaid: (amount = 50) =>
        set((s) => ({
          deposit: {
            ...s.deposit,
            paid: true,
            paidAt: new Date().toISOString(),
            amount
          }
        }))
  })
);

/** Hook-free access for event handlers / tests. */
export const intakeApi = {
  getState: () => useIntakeStore.getState(),
  subscribe: useIntakeStore.subscribe
};
