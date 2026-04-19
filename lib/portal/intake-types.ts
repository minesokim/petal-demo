/**
 * Type definitions for the intake flow state.
 *
 * Every answer a client gives during intake is captured here. Keep
 * it serializable — the Zustand store persists to localStorage.
 */

import type { OtherSubId, ServicePathId } from "./service-catalog";

/* ─────────────────────── Step keys ─────────────────────── */

/**
 * Canonical ordering of every possible intake step. The actual
 * sequence a given client walks through is a subset computed by
 * getNextStep / getPrevStep based on their answers.
 */
export type IntakeStepKey =
  // Auth + welcome
  | "login"
  | "otp"
  | "welcome"
  | "tutorial"
  // Services (steps 1A + 1B)
  | "servicePath"
  | "serviceAddons"
  // Personal path — core linear
  | "personalInfo"
  | "stateAndPriorYear"
  | "filingStatus"
  | "spouseInfo" // conditional: MFJ | MFS
  | "dependentsCount"
  | "dependentDetails" // conditional: count > 0
  | "incomeSources"
  | "rentalDetail" // conditional: has rental
  | "selfEmploymentDetail" // conditional: self-path or has 1099
  | "taxQuestions"
  | "deductions"
  | "lifeEvents"
  | "refundPreference"
  // Business alt path
  | "businessInfo"
  | "businessFormation"
  // Consultation alt path
  | "strategicTopics"
  | "contactInfo"
  // Final steps (step 12 + 13)
  | "docsUpload"
  | "engagement"
  | "consent7216"
  | "scheduleAppt"
  | "deposit"
  | "done";

/* ─────────────────────── Domain types ─────────────────────── */

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh" | "qw";

export type StateCode =
  | "AL" | "AK" | "AZ" | "AR" | "CA" | "CO" | "CT" | "DE" | "FL" | "GA"
  | "HI" | "ID" | "IL" | "IN" | "IA" | "KS" | "KY" | "LA" | "ME" | "MD"
  | "MA" | "MI" | "MN" | "MS" | "MO" | "MT" | "NE" | "NV" | "NH" | "NJ"
  | "NM" | "NY" | "NC" | "ND" | "OH" | "OK" | "OR" | "PA" | "RI" | "SC"
  | "SD" | "TN" | "TX" | "UT" | "VT" | "VA" | "WA" | "WV" | "WI" | "WY"
  | "DC";

export type IncomeSourceId =
  | "w2"
  | "self1099"
  | "rental"
  | "interestDiv"
  | "capGains"
  | "retirement"
  | "crypto"
  | "gambling"
  | "other";

export type Dependent = {
  firstName: string;
  lastName: string;
  ssn: string; // stored as entered; masked on render
  dob: string; // YYYY-MM-DD
  relationship: "child" | "stepchild" | "foster" | "sibling" | "parent" | "other";
  monthsInHome: number; // 0..12
  qualifiesForCtc?: boolean;
};

export type RentalProperty = {
  addressLine: string;
  city: string;
  state: StateCode | "";
  zip: string;
  grossRent: number | null;
  expenses: number | null;
  activeParticipation: boolean | null;
};

export type SelfEmployment = {
  businessName: string;
  description: string; // "what you do"
  vehicleUse: boolean | null;
  homeOffice: boolean | null;
  gross: number | null;
  expenses: number | null;
  hasEmployees: boolean | null;
};

export type BusinessEntityType = "scorp" | "partnership" | "llc" | "ccorp" | null;

export type BusinessInfo = {
  entity: BusinessEntityType;
  legalName: string;
  ein: string;
  stateRegistered: StateCode | "";
  yearFormed: number | null;
  ownerCount: number | null;
};

export type LegalConsent = {
  engagement: { signed: boolean; signedAt: string | null };
  consent7216: { signed: boolean; signedAt: string | null };
};

export type AppointmentFormat = "phone" | "video" | "inperson";

/* ─────────────────────── Full state shape ─────────────────────── */

export type IntakeState = {
  // Auth
  phone: string;
  phoneVerified: boolean;
  tutorialSeen: boolean;

  // Step 1 — Service selection
  servicePath: ServicePathId | null;
  otherSub: OtherSubId | null;
  addons: string[];

  // Step 2 — Personal
  firstName: string;
  lastName: string;
  dob: string;
  ssn: string;
  email: string;
  address: string;
  city: string;
  state: StateCode | "";
  zip: string;

  // Step 3 — State & prior year
  residencyState: StateCode | "";
  priorYearFiled: boolean | null;
  priorYearPreparer: string;

  // Step 4 — Filing status
  filingStatus: FilingStatus | null;

  // Step 5 — Spouse
  spouseFirstName: string;
  spouseLastName: string;
  spouseDob: string;
  spouseSsn: string;
  spouseHasIncome: boolean | null;

  // Step 6 — Dependents
  dependentCount: number;
  dependents: Dependent[];

  // Step 7 — Income
  incomeSources: IncomeSourceId[];
  rental: RentalProperty;
  selfEmployment: SelfEmployment;

  // Step 8 — Tax questions
  taxQuestions: {
    digitalAssets: boolean | null;
    foreignAccounts: boolean | null;
    estimatedPayments: boolean | null;
    healthCoverage: "all" | "partial" | "none" | null;
  };

  // Step 9 — Deductions
  deductions: {
    approach: "standard" | "itemize" | "unsure" | null;
    mortgageInterest: boolean;
    charitable: boolean;
    medical: boolean;
    salt: boolean;
  };

  // Step 10 — Life events
  lifeEvents: {
    married: boolean;
    divorced: boolean;
    hadChild: boolean;
    boughtHome: boolean;
    soldHome: boolean;
    movedStates: boolean;
    jobChange: boolean;
    lostSpouse: boolean;
    other: boolean;
  };

  // Step 11 — Refund preference
  refund: {
    method: "direct-deposit" | "paper-check" | null;
    routing: string;
    account: string;
    accountType: "checking" | "savings" | null;
  };

  // Business alt path
  businessInfo: BusinessInfo;
  businessFormation: {
    desiredEntity: BusinessEntityType;
    stateTarget: StateCode | "";
    hasPartners: boolean | null;
  };

  // Consultation alt path
  strategicTopics: string[];
  consultationContact: {
    preferredTime: "morning" | "afternoon" | "evening" | null;
    notes: string;
  };

  // Step 12 — Docs
  docsUploadedAt: string | null;

  // Step 13 — Legal + appointment + deposit
  legal: LegalConsent;
  appointment: {
    format: AppointmentFormat | null;
    slotIso: string | null;
  };
  deposit: {
    paid: boolean;
    paidAt: string | null;
    amount: number; // usually 50
  };
};

export const INITIAL_STATE: IntakeState = {
  phone: "",
  phoneVerified: false,
  tutorialSeen: false,

  servicePath: null,
  otherSub: null,
  addons: [],

  firstName: "",
  lastName: "",
  dob: "",
  ssn: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",

  residencyState: "",
  priorYearFiled: null,
  priorYearPreparer: "",

  filingStatus: null,

  spouseFirstName: "",
  spouseLastName: "",
  spouseDob: "",
  spouseSsn: "",
  spouseHasIncome: null,

  dependentCount: 0,
  dependents: [],

  incomeSources: [],
  rental: {
    addressLine: "",
    city: "",
    state: "",
    zip: "",
    grossRent: null,
    expenses: null,
    activeParticipation: null
  },
  selfEmployment: {
    businessName: "",
    description: "",
    vehicleUse: null,
    homeOffice: null,
    gross: null,
    expenses: null,
    hasEmployees: null
  },

  taxQuestions: {
    digitalAssets: null,
    foreignAccounts: null,
    estimatedPayments: null,
    healthCoverage: null
  },

  deductions: {
    approach: null,
    mortgageInterest: false,
    charitable: false,
    medical: false,
    salt: false
  },

  lifeEvents: {
    married: false,
    divorced: false,
    hadChild: false,
    boughtHome: false,
    soldHome: false,
    movedStates: false,
    jobChange: false,
    lostSpouse: false,
    other: false
  },

  refund: {
    method: null,
    routing: "",
    account: "",
    accountType: null
  },

  businessInfo: {
    entity: null,
    legalName: "",
    ein: "",
    stateRegistered: "",
    yearFormed: null,
    ownerCount: null
  },
  businessFormation: {
    desiredEntity: null,
    stateTarget: "",
    hasPartners: null
  },

  strategicTopics: [],
  consultationContact: {
    preferredTime: null,
    notes: ""
  },

  docsUploadedAt: null,

  legal: {
    engagement: { signed: false, signedAt: null },
    consent7216: { signed: false, signedAt: null }
  },

  appointment: {
    format: null,
    slotIso: null
  },

  deposit: {
    paid: false,
    paidAt: null,
    amount: 50
  }
};
