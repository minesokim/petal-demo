// Petal OS - Integrations catalog. The place to connect the firm's stack:
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
  /** real brand logo (public/…); falls back to gradient + glyph when absent */
  logo?: string;
  /** when connected: the linked account + last sync */
  account?: string;
  lastSync?: string;
  /** "api" = token/OAuth live sync (default). "browser" = Petal operates it in your
   *  signed-in browser session (session handoff) — no password stored, present-ish. */
  kind?: "api" | "browser";
  /** browser connectors fail in ways tokens don't — surface it loudly, never silently */
  health?: "ok" | "needs_relogin" | "sync_failed" | "maintenance";
}

export const browserHealthMeta: Record<NonNullable<Integration["health"]>, { label: string; dot: string; text: string }> = {
  ok:           { label: "Session active",    dot: "bg-emerald-500", text: "text-[var(--os-success)]" },
  needs_relogin:{ label: "Needs re-login",    dot: "bg-amber-500",   text: "text-amber-600" },
  sync_failed:  { label: "Last sync failed",  dot: "bg-red-500",     text: "text-[var(--os-danger)]" },
  maintenance:  { label: "Under maintenance", dot: "bg-blue-500",    text: "text-blue-600" },
};

export const integrationCategories = [
  "Accounting",
  "Banking & payroll",
  "Tax & e-file",
  "Documents & e-sign",
  "Email & calendar",
  "Payments",
  "Client data sources",
  "Communication",
];

export const integrations: Integration[] = [
  // Accounting
  { id: "qbo", name: "QuickBooks Online", category: "Accounting", desc: "Sync invoices, bills, contacts, and payments both ways.", status: "connected", gradient: "from-emerald-500 to-green-600", glyph: TaxesIcon, logo: "/logos/quickbooks.svg", account: "Vazant EA", lastSync: "2h ago" },
  { id: "xero", name: "Xero", category: "Accounting", desc: "Two-way sync of ledgers and contacts.", status: "available", gradient: "from-sky-500 to-blue-600", glyph: Exchange01Icon, logo: "/logos/xero.svg" },

  // Banking & payroll
  { id: "gusto", name: "Gusto", category: "Banking & payroll", desc: "Pull payroll runs and contractor payments.", status: "connected", gradient: "from-orange-500 to-amber-600", glyph: UserMultipleIcon, logo: "/logos/gusto.svg", account: "Park Dental +2", lastSync: "Yesterday" },

  { id: "plaid", name: "Plaid", category: "Banking & payroll", desc: "Connect client bank feeds for reconciliation and Schedule C.", status: "available", gradient: "from-slate-600 to-slate-800", glyph: Exchange01Icon, logo: "/integrations/plaid.png" },

  // Tax & e-file
  { id: "irs", name: "IRS e-Services", category: "Tax & e-file", desc: "Pull transcripts and CAF authorizations.", status: "connected", gradient: "from-blue-600 to-indigo-700", glyph: SecurityCheckIcon, logo: "/integrations/irs.png", account: "Transcripts + CAF · 8821 on file for 9 clients", lastSync: "Today 6:05 AM" },
  { id: "olt", name: "OLT (OnLine Taxes)", category: "Tax & e-file", desc: "Petal operates OLT in your signed-in browser to pull return data and reconcile it against source documents.", status: "available", gradient: "from-blue-600 to-indigo-700", glyph: TaxesIcon, kind: "browser" },
  { id: "drake", name: "Drake Tax", category: "Tax & e-file", desc: "Desktop tax software. Petal operates it as you; writes stay gated for your review.", status: "connected", gradient: "from-green-600 to-emerald-700", glyph: TaxesIcon, logo: "/integrations/drake.png", kind: "browser", health: "maintenance", account: "Operated in your session", lastSync: "Updating connector" },

  // Documents & e-sign
  { id: "docusign", name: "DocuSign", category: "Documents & e-sign", desc: "Send 8879s for signature and track envelopes.", status: "connected", gradient: "from-amber-500 to-yellow-600", glyph: PencilEdit01Icon, logo: "/integrations/docusign.png", account: "antonio@vazant.tax", lastSync: "Live" },
  { id: "gdrive", name: "Google Drive", category: "Documents & e-sign", desc: "Back up client documents to a shared drive.", status: "available", gradient: "from-emerald-500 to-teal-600", glyph: File02Icon, logo: "/logos/google-drive.svg" },

  // Email & calendar
  { id: "gmail", name: "Gmail", category: "Email & calendar", desc: "Draft and send client emails from your address.", status: "connected", gradient: "from-rose-500 to-red-600", glyph: Mail01Icon, logo: "/logos/gmail.svg", account: "antonio@vazant.tax", lastSync: "Live" },
  { id: "gcal", name: "Google Calendar", category: "Email & calendar", desc: "Read events so pre-call briefs arrive before each call.", status: "connected", gradient: "from-blue-500 to-indigo-600", glyph: Calendar03Icon, logo: "/logos/google-calendar.svg", account: "antonio@vazant.tax", lastSync: "Live" },
  { id: "zoom", name: "Zoom", category: "Email & calendar", desc: "Auto-create meeting links for client review calls.", status: "available", gradient: "from-sky-500 to-blue-600", glyph: Calendar03Icon, logo: "/logos/zoom.svg" },

  // Payments
  { id: "stripe", name: "Stripe", category: "Payments", desc: "Collect prep fees and deposits online.", status: "available", gradient: "from-violet-500 to-purple-600", glyph: InvoiceIcon, logo: "/logos/stripe.svg" },

  // Client data sources
  { id: "square", name: "Square", category: "Client data sources", desc: "Card payments and POS exports for Schedule C.", status: "connected", gradient: "from-slate-700 to-slate-900", glyph: InvoiceIcon, logo: "/logos/square.png", account: "Vazant EA", lastSync: "Today" },
  { id: "taxdome", name: "TaxDome", category: "Client data sources", desc: "Import client intake forms and organizers.", status: "available", gradient: "from-indigo-500 to-violet-600", glyph: File02Icon, logo: "/integrations/taxdome.png" },

  // Communication
  { id: "slack", name: "Slack", category: "Communication", desc: "Push e-file receipts and alerts to a channel.", status: "available", gradient: "from-fuchsia-500 to-pink-600", glyph: MessageAdd01Icon, logo: "/logos/slack.svg" },
];
