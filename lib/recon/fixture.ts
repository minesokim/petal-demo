// The GOLDEN reconciliation fixture — synthetic but realistic, with KNOWN-correct
// answers. It is the brief's eval seed AND the stub data the Xero connector returns for
// a "stub:" connection. Hand-tuned so reconcile() must produce exactly:
//   • 9 clean matches  (7 exact by amount+date+reference, 2 fuzzy by tolerance+window+memo)
//   • 1 proposed month-end manual journal (the depreciation accrual, no ledger counterpart)
//   • 2 exceptions     (1 bank line with no ledger counterpart, 1 ledger line with no bank line)
// and tie out to the penny. The expected-counts object below is asserted by the golden test.

export type FixtureBankTxn = {
  id: string;
  date: string;
  amount: string;
  payee: string;
  memo: string;
  reference: string | null;
};

export type FixtureLedgerItem = {
  id: string;
  date: string;
  amount: string;
  contact: string;
  description: string;
  reference: string | null;
  account: string;
};

// ── bank feed (11 lines) ──────────────────────────────────────────────────────
const bankTransactions: FixtureBankTxn[] = [
  // 1–7: clean EXACT matches (amount + date + reference all line up)
  { id: "b1", date: "2025-03-03", amount: "-1200.00", payee: "Pacific Rent LLC", memo: "March office rent", reference: "INV-3001" },
  { id: "b2", date: "2025-03-05", amount: "-340.18", payee: "Edison Utilities", memo: "Electricity", reference: "INV-3002" },
  { id: "b3", date: "2025-03-08", amount: "2500.00", payee: "Mariposa Co", memo: "Client deposit", reference: "INV-3003" },
  { id: "b4", date: "2025-03-11", amount: "-89.99", payee: "CloudCRM", memo: "SaaS subscription", reference: "INV-3004" },
  { id: "b5", date: "2025-03-14", amount: "-450.00", payee: "Ramirez Cleaning", memo: "Janitorial", reference: "INV-3005" },
  { id: "b6", date: "2025-03-18", amount: "1875.50", payee: "Delgado Partners", memo: "Consulting fee", reference: "INV-3006" },
  { id: "b7", date: "2025-03-21", amount: "-220.00", payee: "FedEx", memo: "Shipping", reference: "INV-3007" },
  // 8–9: clean FUZZY matches — a few cents of rounding + a couple days of settlement lag,
  // no usable reference, but the memo/payee clearly correspond.
  { id: "b8", date: "2025-03-24", amount: "-1000.01", payee: "Blue Mesa Insurance", memo: "Liability premium", reference: null },
  { id: "b9", date: "2025-03-26", amount: "-75.00", payee: "City Water Dept", memo: "Water March", reference: null },
  // 10: month-end accrual — a depreciation journal with NO ledger counterpart. The matcher
  // must surface this as a PROPOSED manual journal, not an exception.
  { id: "b10", date: "2025-03-31", amount: "-512.00", payee: "Internal", memo: "Depreciation accrual month-end", reference: null },
  // 11: a genuine bank-side EXCEPTION — an unexplained card charge with no ledger line.
  { id: "b11", date: "2025-03-19", amount: "-63.47", payee: "Unknown POS 4417", memo: "Card charge", reference: null },
];

// ── general ledger (10 lines) ─────────────────────────────────────────────────
const ledgerItems: FixtureLedgerItem[] = [
  // counterparts to b1–b7 (exact)
  { id: "l1", date: "2025-03-03", amount: "-1200.00", contact: "Pacific Rent LLC", description: "Office rent March", reference: "INV-3001", account: "6000 Rent" },
  { id: "l2", date: "2025-03-05", amount: "-340.18", contact: "Edison Utilities", description: "Electric utility", reference: "INV-3002", account: "6100 Utilities" },
  { id: "l3", date: "2025-03-08", amount: "2500.00", contact: "Mariposa Co", description: "Engagement deposit", reference: "INV-3003", account: "4000 Income" },
  { id: "l4", date: "2025-03-11", amount: "-89.99", contact: "CloudCRM", description: "CRM software", reference: "INV-3004", account: "6200 Software" },
  { id: "l5", date: "2025-03-14", amount: "-450.00", contact: "Ramirez Cleaning", description: "Cleaning service", reference: "INV-3005", account: "6300 Facilities" },
  { id: "l6", date: "2025-03-18", amount: "1875.50", contact: "Delgado Partners", description: "Consulting revenue", reference: "INV-3006", account: "4000 Income" },
  { id: "l7", date: "2025-03-21", amount: "-220.00", contact: "FedEx", description: "Courier shipping", reference: "INV-3007", account: "6400 Postage" },
  // counterparts to b8–b9 (fuzzy): off by a cent / a day or two, memo corresponds, no ref.
  { id: "l8", date: "2025-03-25", amount: "-1000.00", contact: "Blue Mesa Insurance", description: "Liability insurance premium", reference: null, account: "6500 Insurance" },
  { id: "l9", date: "2025-03-27", amount: "-75.00", contact: "City Water Dept", description: "Water utility March", reference: null, account: "6100 Utilities" },
  // a genuine ledger-side EXCEPTION — a booked bill that never cleared the bank.
  { id: "l10", date: "2025-03-12", amount: "-410.00", contact: "Sierra Print Co", description: "Marketing flyers", reference: "INV-3010", account: "6600 Marketing" },
];

export const RECON_FIXTURE = { bankTransactions, ledgerItems } as const;

// The asserted ground truth for the golden test.
export const RECON_FIXTURE_EXPECTED = {
  bankCount: 11,
  ledgerCount: 10,
  matched: 9,
  exactMatches: 7,
  fuzzyMatches: 2,
  proposedJournals: 1,
  exceptions: 2, // 1 bank-side (b11) + 1 ledger-side (l10)
  bankExceptions: 1,
  ledgerExceptions: 1,
  exceptionBankId: "b11",
  exceptionLedgerId: "l10",
  journalBankId: "b10",
  // tie-out: bank total and ledger total in decimal strings (sum of the lines above).
  bankTotal: "424.85",
  ledgerTotal: "590.33",
  difference: "-165.48", // bank - ledger
} as const;
