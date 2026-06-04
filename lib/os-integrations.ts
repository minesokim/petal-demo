// Petal OS — Integrations catalog. The place to connect the firm's stack:
// accounting, banks, payroll, e-file, e-sign, email, payments. Petal reads from these
// to draft work and keep records in sync (writes stay gated by trust tiers).

import type { IconSvgElement } from "@hugeicons/react";
import {
  TaxesIcon, Exchange01Icon, Mail01Icon, Calendar03Icon, PencilEdit01Icon,
  UserMultipleIcon, InvoiceIcon, MessageAdd01Icon, File02Icon, SecurityCheckIcon,
} from "@hugeicons/core-free-icons";

export interface Integration {
  id: string;
  name: string;
  category: string;
  desc: string;
  status: "connected" | "available";
  gradient: string;
  glyph: IconSvgElement;
  /** when connected: the linked account + last sync */
  account?: string;
  lastSync?: string;
}

export const integrationCategories = [
  "Accounting",
  "Banking & payroll",
  "Tax & e-file",
  "Documents & e-sign",
  "Email & calendar",
  "Payments",
  "Communication",
];

export const integrations: Integration[] = [
  // Accounting
  { id: "qbo", name: "QuickBooks Online", category: "Accounting", desc: "Sync invoices, bills, contacts, and payments both ways.", status: "connected", gradient: "from-emerald-500 to-green-600", glyph: TaxesIcon, account: "Vazant EA", lastSync: "2h ago" },
  { id: "xero", name: "Xero", category: "Accounting", desc: "Two-way sync of ledgers and contacts.", status: "connected", gradient: "from-sky-500 to-blue-600", glyph: Exchange01Icon, account: "Vazant EA", lastSync: "Today" },
  { id: "qbd", name: "QuickBooks Desktop", category: "Accounting", desc: "Connect the desktop edition over the web connector.", status: "available", gradient: "from-emerald-600 to-teal-700", glyph: TaxesIcon },

  // Banking & payroll
  { id: "plaid", name: "Bank feeds (Plaid)", category: "Banking & payroll", desc: "Live bank + card transactions for reconciliation.", status: "connected", gradient: "from-indigo-500 to-violet-600", glyph: Exchange01Icon, account: "3 accounts", lastSync: "1h ago" },
  { id: "gusto", name: "Gusto", category: "Banking & payroll", desc: "Pull payroll runs and contractor payments.", status: "connected", gradient: "from-orange-500 to-amber-600", glyph: UserMultipleIcon, account: "Park Dental +2", lastSync: "Yesterday" },

  // Tax & e-file
  { id: "olt", name: "OLT Pro", category: "Tax & e-file", desc: "Transmit returns and read e-file acknowledgments.", status: "connected", gradient: "from-slate-600 to-slate-800", glyph: InvoiceIcon, account: "EFIN ••2231", lastSync: "Live" },
  { id: "irs", name: "IRS e-Services", category: "Tax & e-file", desc: "Pull transcripts and CAF authorizations.", status: "available", gradient: "from-blue-600 to-indigo-700", glyph: SecurityCheckIcon },

  // Documents & e-sign
  { id: "docusign", name: "DocuSign", category: "Documents & e-sign", desc: "Send 8879s for signature and track envelopes.", status: "connected", gradient: "from-amber-500 to-yellow-600", glyph: PencilEdit01Icon, account: "antonio@vazant.tax", lastSync: "Live" },
  { id: "gdrive", name: "Google Drive", category: "Documents & e-sign", desc: "Back up client documents to a shared drive.", status: "available", gradient: "from-emerald-500 to-teal-600", glyph: File02Icon },

  // Email & calendar
  { id: "gmail", name: "Gmail", category: "Email & calendar", desc: "Draft and send client emails from your address.", status: "connected", gradient: "from-rose-500 to-red-600", glyph: Mail01Icon, account: "antonio@vazant.tax", lastSync: "Live" },
  { id: "gcal", name: "Google Calendar", category: "Email & calendar", desc: "Read events so Meeting Prep can brief you.", status: "connected", gradient: "from-blue-500 to-indigo-600", glyph: Calendar03Icon, account: "antonio@vazant.tax", lastSync: "Live" },

  // Payments
  { id: "square", name: "Square", category: "Payments", desc: "Card payments and POS exports for Schedule C.", status: "connected", gradient: "from-slate-700 to-slate-900", glyph: InvoiceIcon, account: "Vazant EA", lastSync: "Today" },
  { id: "stripe", name: "Stripe", category: "Payments", desc: "Collect prep fees and deposits online.", status: "available", gradient: "from-violet-500 to-purple-600", glyph: InvoiceIcon },

  // Communication
  { id: "slack", name: "Slack", category: "Communication", desc: "Push e-file receipts and alerts to a channel.", status: "available", gradient: "from-fuchsia-500 to-pink-600", glyph: MessageAdd01Icon },
];
