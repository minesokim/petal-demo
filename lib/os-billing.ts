// Petal OS — Accounts receivable. Derived from the real return fees + deposit/stage in
// lib/os-entities.ts (no invented fields): one invoice per household (the billing hub).
// Deposit = 40% of the engagement fee collected up front; the balance is billed on filing.

import { households, returnsOf, type Household } from "@/lib/os-entities";

export type InvoiceStatus = "paid" | "balance_due" | "overdue" | "in_progress";

export const invoiceStatusMeta: Record<InvoiceStatus, { label: string; dot: string; accent: string }> = {
  paid:        { label: "Paid",        dot: "bg-emerald-500",            accent: "text-[var(--os-success)]" },
  balance_due: { label: "Balance due", dot: "bg-amber-500",              accent: "text-[var(--os-warning)]" },
  overdue:     { label: "Overdue",     dot: "bg-red-500",                accent: "text-[var(--os-danger)]" },
  in_progress: { label: "In progress", dot: "bg-[var(--os-ink-subtle)]", accent: "text-[var(--os-ink-muted)]" },
};

export interface Invoice {
  id: string;
  number: string;
  householdId: string;
  clientName: string;
  serviceTier: Household["serviceTier"];
  invoiced: number;
  collected: number;
  balance: number;
  status: InvoiceStatus;
  due: string;
  issued: string;
  ageDays?: number;
}

const DEPOSIT_RATE = 0.4;

function buildInvoice(h: Household, idx: number): Invoice {
  const rs = returnsOf(h.id);
  const invoiced = rs.reduce((s, r) => s + r.fee, 0);
  const allFiled = rs.length > 0 && rs.every(r => r.stage === "filed");
  const anyDeposit = rs.some(r => r.depositPaid);
  const sentOut = rs.some(r => r.stage === "client_review" || r.stage === "pay_and_sign");
  const deposit = Math.round(invoiced * DEPOSIT_RATE);
  const base = {
    id: `inv-${h.id}`,
    number: `INV-${(idx + 1).toString().padStart(4, "0")}`,
    householdId: h.id,
    clientName: h.name,
    serviceTier: h.serviceTier,
    invoiced,
  };

  // paid in full once every return is filed
  if (allFiled) return { ...base, collected: invoiced, balance: 0, status: "paid", due: "Paid in full", issued: "Mar 2026" };
  // deposit never paid → past due (DeShawn)
  if (!anyDeposit) return { ...base, collected: 0, balance: invoiced, status: "overdue", due: "9 days late", issued: "Mar 24", ageDays: 9 };
  // return is out for review/signature → balance now due
  if (sentOut) return { ...base, collected: deposit, balance: invoiced - deposit, status: "balance_due", due: "Due Apr 15", issued: "Apr 1" };
  // engaged, deposit collected, balance billed on filing
  return { ...base, collected: deposit, balance: invoiced - deposit, status: "in_progress", due: "On filing", issued: "Mar 2026" };
}

export const invoices: Invoice[] = households.map(buildInvoice);

// ── KPI rollups ──────────────────────────────────────────────
const owed = invoices.filter(i => i.status === "balance_due" || i.status === "overdue");
export const outstandingTotal = owed.reduce((s, i) => s + i.balance, 0);
export const outstandingCount = owed.length;
export const overdueInvoices = invoices.filter(i => i.status === "overdue");
export const overdueTotal = overdueInvoices.reduce((s, i) => s + i.balance, 0);
export const collectedTotal = invoices.reduce((s, i) => s + i.collected, 0);
export const billedTotal = invoices.reduce((s, i) => s + i.invoiced, 0);

// cumulative collections across the season (drives the Collected sparkline)
export const collectionsSeries = [380, 900, 1500, 2100, 2900, 3500, 4000, collectedTotal];
