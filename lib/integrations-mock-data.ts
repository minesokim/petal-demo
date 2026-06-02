/**
 * Integrations registry — the universe of apps a 2026 CPA practice connects to.
 *
 * Single source of truth for:
 *   - The /dashboard/integrations grid (connect / disconnect / re-auth)
 *   - The source chip on every triage card ("from Xero · 4m ago")
 *   - Deep-link generators ("Open in Drake / Lacerte / ProConnect")
 *   - The morning briefing's "what synced overnight" summary
 *
 * Logo handling: we use a colored badge + first letter as a stand-in for the
 * real brand logo (no SVG bloat in mock land). Brand color is from the
 * vendor's primary palette so the chips are recognizable at a glance.
 */

export type IntegrationCategory =
  | "tax_prep"
  | "bookkeeping"
  | "banking"
  | "payroll"
  | "documents"
  | "e_signature"
  | "payments"
  | "spend_mgmt"
  | "calendar"
  | "communication"
  | "tax_research"
  | "tax_planning"
  | "irs"
  | "state_dor"
  | "fincen"
  | "industry_pos"
  | "internal";

export const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  tax_prep: "Tax preparation",
  bookkeeping: "Bookkeeping",
  banking: "Banking & cash",
  payroll: "Payroll",
  documents: "Documents & PBC",
  e_signature: "E-signature",
  payments: "Payments & billing",
  spend_mgmt: "Spend management",
  calendar: "Calendar & scheduling",
  communication: "Communication",
  tax_research: "Tax research",
  tax_planning: "Tax planning & advisory",
  irs: "IRS systems",
  state_dor: "State tax agencies",
  fincen: "FinCEN / BOI",
  industry_pos: "Industry & POS",
  internal: "Internal team",
};

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  /** Short tagline shown on the integrations grid card. */
  description: string;
  /** Primary brand color hex — used for the logo badge background. */
  brandColor: string;
  /** Text color for the badge (white on most brand colors). */
  brandText?: string;
  /** Connected to the firm right now? Drives green dot on the integrations
   *  grid and whether triage cards from this integration appear. */
  connected: boolean;
  /** ISO timestamp of last successful sync. Only meaningful when connected. */
  lastSyncAt?: string;
  /** Whether this integration produces actionable triage cards (vs being
   *  a passive output channel like a tax-prep deep-link target). */
  produces_cards?: boolean;
  /** Optional deep-link generator for a specific client. Used by prep-ready
   *  triage items: "Open Marcus's return in Drake →" */
  deepLinkFor?: (clientId: string) => string;
}

/**
 * The full universe. Order within each category roughly tracks market share
 * — easier to scan when familiar tools come first.
 */
export const INTEGRATIONS: Integration[] = [
  // ── Tax preparation (the actual return) ────────────────────────────
  {
    id: "drake",
    name: "Drake Tax",
    category: "tax_prep",
    description: "Industry-standard tax prep for individual + business returns",
    brandColor: "#0F4C81",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T20:02:00",
    deepLinkFor: (id) => `https://app.drake.tax/returns/${id}`,
  },
  {
    id: "lacerte",
    name: "Lacerte",
    category: "tax_prep",
    description: "Intuit's mid-market tax prep — complex business returns",
    brandColor: "#236CFF",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T18:14:00",
    deepLinkFor: (id) => `https://lacerte.intuit.com/return/${id}`,
  },
  {
    id: "proconnect",
    name: "ProConnect Online",
    category: "tax_prep",
    description: "Intuit's cloud-native tax prep — simple individual returns",
    brandColor: "#0077C5",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T19:48:00",
    deepLinkFor: (id) => `https://proconnect.intuit.com/return/${id}`,
  },
  {
    id: "ultratax",
    name: "UltraTax CS",
    category: "tax_prep",
    description: "Thomson Reuters professional tax suite",
    brandColor: "#FF6900",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "cch_axcess",
    name: "CCH Axcess",
    category: "tax_prep",
    description: "Wolters Kluwer enterprise tax + audit",
    brandColor: "#003B71",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Bookkeeping ────────────────────────────────────────────────────
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    category: "bookkeeping",
    description: "Auto-syncs P&L, balance sheet, and uncategorized transactions",
    brandColor: "#2CA01C",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:42:00",
    produces_cards: true,
  },
  {
    id: "xero",
    name: "Xero",
    category: "bookkeeping",
    description: "Auto-syncs P&L, bank feeds, and reconciliation status",
    brandColor: "#13B5EA",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:38:00",
    produces_cards: true,
  },
  {
    id: "freshbooks",
    name: "FreshBooks",
    category: "bookkeeping",
    description: "Service-business invoicing + bookkeeping",
    brandColor: "#0075DD",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Banking & cash ─────────────────────────────────────────────────
  {
    id: "plaid",
    name: "Plaid",
    category: "banking",
    description: "Bank-feed aggregator — transaction-level data across 11K+ banks",
    brandColor: "#000000",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:50:00",
    produces_cards: true,
  },
  {
    id: "mercury",
    name: "Mercury",
    category: "banking",
    description: "Modern business banking — direct API access",
    brandColor: "#FF715B",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T20:11:00",
    produces_cards: true,
  },

  // ── Payroll ────────────────────────────────────────────────────────
  {
    id: "gusto",
    name: "Gusto",
    category: "payroll",
    description: "Pulls W-2s, 1099s, and payroll register for verification",
    brandColor: "#F45D48",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T17:22:00",
    produces_cards: true,
  },
  {
    id: "adp_run",
    name: "ADP RUN",
    category: "payroll",
    description: "ADP's small-business payroll",
    brandColor: "#D40511",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "paychex",
    name: "Paychex Flex",
    category: "payroll",
    description: "Mid-market payroll + HR",
    brandColor: "#0072BC",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Documents & PBC ────────────────────────────────────────────────
  {
    id: "suralink",
    name: "Suralink",
    category: "documents",
    description: "Provided-by-client (PBC) request lists — pulls uploads automatically",
    brandColor: "#0C5688",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:11:00",
    produces_cards: true,
  },
  {
    id: "smartvault",
    name: "SmartVault",
    category: "documents",
    description: "Secure document vault with bank-level encryption",
    brandColor: "#39A4DC",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "box",
    name: "Box",
    category: "documents",
    description: "Enterprise document collaboration",
    brandColor: "#0061D5",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "google_drive",
    name: "Google Drive",
    category: "documents",
    description: "Sync shared client folders",
    brandColor: "#1FA463",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T20:55:00",
  },

  // ── E-signature ────────────────────────────────────────────────────
  {
    id: "docusign",
    name: "DocuSign",
    category: "e_signature",
    description: "8879s, engagement letters, consents — tracks open + sign status",
    brandColor: "#FFCC22",
    brandText: "#000000",
    connected: true,
    lastSyncAt: "2026-05-25T21:33:00",
    produces_cards: true,
  },
  {
    id: "adobe_sign",
    name: "Adobe Sign",
    category: "e_signature",
    description: "Adobe's enterprise signature service",
    brandColor: "#FF0000",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Payments & billing ─────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    description: "Pulls processing fees + auto-categorizes to Schedule C",
    brandColor: "#635BFF",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:45:00",
    produces_cards: true,
  },
  {
    id: "bill_com",
    name: "Bill.com",
    category: "payments",
    description: "AP/AR — flags overdue invoices and approval queues",
    brandColor: "#E54F1A",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T19:02:00",
    produces_cards: true,
  },
  {
    id: "ignition",
    name: "Ignition",
    category: "payments",
    description: "Engagement letters + recurring payments in one",
    brandColor: "#00C896",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Spend management ──────────────────────────────────────────────
  {
    id: "ramp",
    name: "Ramp",
    category: "spend_mgmt",
    description: "Card spend + auto-categorization for business clients",
    brandColor: "#FFFFFF",
    brandText: "#000000",
    connected: true,
    lastSyncAt: "2026-05-25T21:18:00",
    produces_cards: true,
  },
  {
    id: "brex",
    name: "Brex",
    category: "spend_mgmt",
    description: "Corporate cards + expense management",
    brandColor: "#FE6716",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "expensify",
    name: "Expensify",
    category: "spend_mgmt",
    description: "Receipt OCR + expense reports",
    brandColor: "#1A8E2D",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Calendar & scheduling ──────────────────────────────────────────
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "calendar",
    description: "Auto-pulls meetings + generates pre-call briefings",
    brandColor: "#4285F4",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:55:00",
    produces_cards: true,
  },
  {
    id: "outlook_calendar",
    name: "Outlook Calendar",
    category: "calendar",
    description: "Microsoft 365 calendar sync",
    brandColor: "#0078D4",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "calendar",
    description: "Client-facing scheduling links",
    brandColor: "#006BFF",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Communication ──────────────────────────────────────────────────
  {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    description: "Auto-ingest client emails with attachment classification",
    brandColor: "#EA4335",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:57:00",
    produces_cards: true,
  },
  {
    id: "outlook_mail",
    name: "Outlook Mail",
    category: "communication",
    description: "Microsoft 365 mailbox",
    brandColor: "#0078D4",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    description: "Internal team chat + handoff signals",
    brandColor: "#4A154B",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:51:00",
    produces_cards: true,
  },
  {
    id: "loom",
    name: "Loom",
    category: "communication",
    description: "Async video walkthroughs for client questions",
    brandColor: "#625DF5",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Tax research ───────────────────────────────────────────────────
  {
    id: "checkpoint",
    name: "Checkpoint",
    category: "tax_research",
    description: "Thomson Reuters tax research + Q1 update alerts",
    brandColor: "#003B71",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T06:00:00",
    produces_cards: true,
  },
  {
    id: "bloomberg_tax",
    name: "Bloomberg Tax",
    category: "tax_research",
    description: "BNA portfolios + tax management research",
    brandColor: "#000000",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "cch_answerconnect",
    name: "CCH AnswerConnect",
    category: "tax_research",
    description: "Wolters Kluwer research + AI assistant",
    brandColor: "#003B71",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── Tax planning & advisory ────────────────────────────────────────
  {
    id: "holistiplan",
    name: "Holistiplan",
    category: "tax_planning",
    description: "Tax-return scanning + planning opportunity surfacing",
    brandColor: "#0F766E",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T05:30:00",
    produces_cards: true,
  },
  {
    id: "corvee",
    name: "Corvee",
    category: "tax_planning",
    description: "Tax-planning software for advisory engagements",
    brandColor: "#10B981",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── IRS systems ────────────────────────────────────────────────────
  {
    id: "irs_eservices",
    name: "IRS e-Services",
    category: "irs",
    description: "Transcript delivery, PTIN, EFIN, IDR portal",
    brandColor: "#003366",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T14:08:00",
    produces_cards: true,
  },

  // ── State tax agencies ─────────────────────────────────────────────
  {
    id: "ca_ftb",
    name: "California FTB",
    category: "state_dor",
    description: "CA Franchise Tax Board notices + correspondence",
    brandColor: "#1F4E79",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T13:12:00",
    produces_cards: true,
  },
  {
    id: "ny_dtf",
    name: "NY Tax & Finance",
    category: "state_dor",
    description: "New York State tax notices",
    brandColor: "#003594",
    brandText: "#FFFFFF",
    connected: false,
  },

  // ── FinCEN / BOI ───────────────────────────────────────────────────
  {
    id: "fincen_boi",
    name: "FinCEN BOI",
    category: "fincen",
    description: "Beneficial ownership reporting — required for every small business",
    brandColor: "#1B3A5C",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T08:45:00",
    produces_cards: true,
  },

  // ── Industry & POS ─────────────────────────────────────────────────
  {
    id: "shopify",
    name: "Shopify",
    category: "industry_pos",
    description: "E-commerce sales data for product-business clients",
    brandColor: "#96BF48",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:27:00",
    produces_cards: true,
  },
  {
    id: "toast",
    name: "Toast",
    category: "industry_pos",
    description: "Restaurant POS — gross sales + tip reporting",
    brandColor: "#FF351C",
    brandText: "#FFFFFF",
    connected: true,
    lastSyncAt: "2026-05-25T21:08:00",
    produces_cards: true,
  },
  {
    id: "square",
    name: "Square",
    category: "industry_pos",
    description: "POS + payments for service-business clients",
    brandColor: "#000000",
    brandText: "#FFFFFF",
    connected: false,
  },
  {
    id: "mindbody",
    name: "Mindbody",
    category: "industry_pos",
    description: "Wellness & fitness booking + revenue",
    brandColor: "#2E2E2E",
    brandText: "#FFFFFF",
    connected: false,
  },
];

/** Lookup by id. Returns undefined if unknown. */
export function getIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

/** All integrations grouped by category — drives the integrations page. */
export function integrationsByCategory(): { category: IntegrationCategory; label: string; items: Integration[] }[] {
  const map = new Map<IntegrationCategory, Integration[]>();
  for (const i of INTEGRATIONS) {
    if (!map.has(i.category)) map.set(i.category, []);
    map.get(i.category)!.push(i);
  }
  return Array.from(map.entries()).map(([cat, items]) => ({
    category: cat,
    label: CATEGORY_LABEL[cat],
    items,
  }));
}

/** Connected count — drives "X of Y connected" in header copy. */
export function connectedCount(): { connected: number; total: number } {
  const connected = INTEGRATIONS.filter((i) => i.connected).length;
  return { connected, total: INTEGRATIONS.length };
}

/**
 * Per-client preferred tax-prep tool. In production this is a per-client
 * setting; for the demo we deterministically pick one based on return
 * complexity so each "Open in X" button is plausible.
 *
 * Simple individual → ProConnect Online
 * Mid-complex individual → Drake
 * Business / S-Corp / multi-state → Lacerte
 */
export function preferredTaxPrepFor(client: {
  type: "individual" | "business";
  serviceTier: string;
}): "drake" | "lacerte" | "proconnect" {
  if (client.type === "business") return "lacerte";
  if (client.serviceTier === "Basic") return "proconnect";
  return "drake";
}
