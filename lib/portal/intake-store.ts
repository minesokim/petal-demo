"use client";

/**
 * Intake store — single Zustand slice that holds every client-facing
 * answer plus the current step and a coarse auth flag. Persists to
 * localStorage under `petal.v4.portal.intake` so a client who
 * closes their browser mid-intake resumes where they left off.
 *
 * Selectors (getNextStep / getPrevStep / getStepPosition) live in
 * ./intake-flow.ts — this file only owns mutation.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

const PERSIST_KEY = "petal.v4.portal.intake";

export const useIntakeStore = create<Store>()(
  persist(
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
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // SSR — provide a no-op storage so persist doesn't throw
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined
          } as Storage;
        }
        return window.localStorage;
      }),
      version: 1,
      // Include everything — state is small and we want full resume.
      partialize: (s) => s
    }
  )
);

/** Hook-free access for event handlers / tests. */
export const intakeApi = {
  getState: () => useIntakeStore.getState(),
  subscribe: useIntakeStore.subscribe
};
