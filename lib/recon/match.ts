// The deterministic reconciliation matcher. INV-1: the match AND the math are CODE,
// never the model. No LLM, no I/O, no clock — given the same inputs it returns the same
// output, and it ties out to the penny. The agent task may LATER ask a model to phrase a
// rationale or SUGGEST a category for an exception, but it never decides a match or a
// number; that all happens here.
//
// Money is integer cents end-to-end. Decimal strings are parsed once at the boundary; we
// never compare floats. The bank/ledger totals and their difference are reported as
// signed cents and as decimal strings so the caller can tie out exactly.

// ── inputs (provider-neutral, mirror the Xero read shapes) ────────────────────

export type BankTxn = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: string; // signed decimal string; negative = money out
  payee: string;
  memo: string;
  reference: string | null;
};

export type LedgerItem = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: string; // signed decimal string
  contact: string;
  description: string;
  reference: string | null;
  account: string;
};

// ── outputs ───────────────────────────────────────────────────────────────────

export type MatchBasis = "exact" | "fuzzy";

export type Match = {
  bankId: string;
  ledgerId: string;
  basis: MatchBasis;
  // why we believe it — surfaced into proposal evidence (never a model claim).
  detail: {
    amountCents: number;
    bankDate: string;
    ledgerDate: string;
    dayGap: number;
    referenceEqual: boolean;
    memoSimilarity: number; // 0..1
  };
};

export type Exception = {
  side: "bank" | "ledger";
  id: string;
  amount: string;
  date: string;
  label: string; // payee/contact for the human
  reason: string; // why it could not be auto-matched
};

export type ProposedJournal = {
  // a month-end manual journal the matcher believes should be booked. The amount is
  // the net of the month's UNMATCHED-but-explainable lines (here: bank-side residue),
  // surfaced for a human to approve. Deterministic — derived purely from the inputs.
  period: string; // yyyy-mm
  date: string; // month-end date yyyy-mm-dd
  narration: string;
  amount: string; // signed decimal string
  lines: Array<{ account: string; amount: string; description: string }>;
  sourceBankIds: string[];
};

export type TieOut = {
  bankTotalCents: number;
  ledgerTotalCents: number;
  differenceCents: number; // bank - ledger
  bankTotal: string;
  ledgerTotal: string;
  difference: string;
};

export type ReconResult = {
  matched: Match[];
  unmatched: { bank: Exception[]; ledger: Exception[] };
  proposedJournals: ProposedJournal[];
  tieOut: TieOut;
};

// ── tolerances (the fuzzy pass is BOUNDED) ────────────────────────────────────

export const RECON_CONFIG = {
  amountToleranceCents: 2, // a couple cents of rounding noise, no more
  dateWindowDays: 4, // a match may straddle a few days of settlement lag
  memoSimilarityFloor: 0.6, // normalized token overlap must clear this for fuzzy
} as const;

// ── money helpers (integer cents; never float compares) ───────────────────────

export function toCents(decimal: string): number {
  const trimmed = decimal.trim();
  const neg = trimmed.startsWith("-");
  const body = neg ? trimmed.slice(1) : trimmed;
  const [whole, frac = ""] = body.split(".");
  const cents = Number(whole || "0") * 100 + Number((frac + "00").slice(0, 2) || "0");
  return neg ? -cents : cents;
}

export function fromCents(cents: number): string {
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const s = `${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
  return neg ? `-${s}` : s;
}

function dayGap(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round(Math.abs(da - db) / 86_400_000);
}

// normalized token set for memo similarity — lowercase, strip punctuation, drop
// trivial tokens. Pure string math, no model.
function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2),
  );
}

// Jaccard similarity of two token sets — 0..1.
function memoSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

function normRef(r: string | null): string {
  return (r ?? "").trim().toLowerCase();
}

// ── the reconcile pass ────────────────────────────────────────────────────────

export function reconcile(bankTxns: BankTxn[], ledgerItems: LedgerItem[]): ReconResult {
  const matched: Match[] = [];
  const usedLedger = new Set<string>();
  const usedBank = new Set<string>();

  // Pass 1 — EXACT: same amount (to the cent) + same date + same non-empty reference.
  for (const bank of bankTxns) {
    const bCents = toCents(bank.amount);
    const bRef = normRef(bank.reference);
    const hit = ledgerItems.find(
      (l) =>
        !usedLedger.has(l.id) &&
        toCents(l.amount) === bCents &&
        l.date === bank.date &&
        bRef !== "" &&
        normRef(l.reference) === bRef,
    );
    if (hit) {
      usedLedger.add(hit.id);
      usedBank.add(bank.id);
      matched.push({
        bankId: bank.id,
        ledgerId: hit.id,
        basis: "exact",
        detail: {
          amountCents: bCents,
          bankDate: bank.date,
          ledgerDate: hit.date,
          dayGap: 0,
          referenceEqual: true,
          memoSimilarity: memoSimilarity(`${bank.payee} ${bank.memo}`, `${hit.contact} ${hit.description}`),
        },
      });
    }
  }

  // Pass 2 — FUZZY (bounded): amount within tolerance + date within the window +
  // memo similarity clears the floor. We pick, per bank line, the single best
  // remaining ledger candidate (closest amount, then closest date, then best memo).
  for (const bank of bankTxns) {
    if (usedBank.has(bank.id)) continue;
    const bCents = toCents(bank.amount);
    let best: { l: LedgerItem; gap: number; amtGap: number; sim: number } | null = null;
    for (const l of ledgerItems) {
      if (usedLedger.has(l.id)) continue;
      const amtGap = Math.abs(toCents(l.amount) - bCents);
      if (amtGap > RECON_CONFIG.amountToleranceCents) continue;
      const gap = dayGap(bank.date, l.date);
      if (gap > RECON_CONFIG.dateWindowDays) continue;
      const sim = memoSimilarity(`${bank.payee} ${bank.memo}`, `${l.contact} ${l.description}`);
      if (sim < RECON_CONFIG.memoSimilarityFloor) continue;
      const better =
        !best ||
        amtGap < best.amtGap ||
        (amtGap === best.amtGap && gap < best.gap) ||
        (amtGap === best.amtGap && gap === best.gap && sim > best.sim);
      if (better) best = { l, gap, amtGap, sim };
    }
    if (best) {
      usedLedger.add(best.l.id);
      usedBank.add(bank.id);
      matched.push({
        bankId: bank.id,
        ledgerId: best.l.id,
        basis: "fuzzy",
        detail: {
          amountCents: bCents,
          bankDate: bank.date,
          ledgerDate: best.l.date,
          dayGap: best.gap,
          referenceEqual: normRef(bank.reference) !== "" && normRef(bank.reference) === normRef(best.l.reference),
          memoSimilarity: best.sim,
        },
      });
    }
  }

  // Leftovers → exceptions, flagged with a reason for a human. NOT auto-resolved.
  const unmatchedBank: Exception[] = bankTxns
    .filter((b) => !usedBank.has(b.id))
    .map((b) => ({
      side: "bank" as const,
      id: b.id,
      amount: b.amount,
      date: b.date,
      label: b.payee || b.memo,
      reason: exceptionReason("bank", b, ledgerItems, usedLedger),
    }));
  const unmatchedLedger: Exception[] = ledgerItems
    .filter((l) => !usedLedger.has(l.id))
    .map((l) => ({
      side: "ledger" as const,
      id: l.id,
      amount: l.amount,
      date: l.date,
      label: l.contact || l.description,
      reason: exceptionReasonLedger(l, bankTxns, usedBank),
    }));

  // Month-end manual journals: any bank-side exception explicitly flagged as a
  // recurring/accrual line (memo carries an "accrue"/"journal" hint OR a known
  // month-end marker) is rolled into a proposed journal per period. Deterministic:
  // it is a pure function of which bank lines are journal-flagged. A human approves it.
  const proposedJournals = buildProposedJournals(unmatchedBank, bankTxns);
  // Bank lines that became a proposed journal are no longer plain exceptions.
  const journalBankIds = new Set(proposedJournals.flatMap((j) => j.sourceBankIds));
  const bankExceptions = unmatchedBank.filter((e) => !journalBankIds.has(e.id));

  // Tie-out — to the penny, on integer cents.
  const bankTotalCents = bankTxns.reduce((s, b) => s + toCents(b.amount), 0);
  const ledgerTotalCents = ledgerItems.reduce((s, l) => s + toCents(l.amount), 0);
  const differenceCents = bankTotalCents - ledgerTotalCents;

  return {
    matched,
    unmatched: { bank: bankExceptions, ledger: unmatchedLedger },
    proposedJournals,
    tieOut: {
      bankTotalCents,
      ledgerTotalCents,
      differenceCents,
      bankTotal: fromCents(bankTotalCents),
      ledgerTotal: fromCents(ledgerTotalCents),
      difference: fromCents(differenceCents),
    },
  };
}

// A bank line is a month-end journal candidate when its memo carries an explicit
// accrual/journal marker. This is a STRUCTURAL signal in the data, not a model guess.
const JOURNAL_MARKER = /\b(accru|journal|month[-\s]?end|depreciation|amort)\w*/i;

function buildProposedJournals(bankExceptions: Exception[], bankTxns: BankTxn[]): ProposedJournal[] {
  const byPeriod = new Map<string, BankTxn[]>();
  for (const ex of bankExceptions) {
    const b = bankTxns.find((t) => t.id === ex.id);
    if (!b) continue;
    if (!JOURNAL_MARKER.test(`${b.payee} ${b.memo}`)) continue;
    const period = b.date.slice(0, 7); // yyyy-mm
    (byPeriod.get(period) ?? byPeriod.set(period, []).get(period)!).push(b);
  }
  const journals: ProposedJournal[] = [];
  for (const [period, lines] of byPeriod) {
    const totalCents = lines.reduce((s, b) => s + toCents(b.amount), 0);
    const monthEnd = lastDayOfMonth(period);
    journals.push({
      period,
      date: monthEnd,
      narration: `Month-end accrual journal for ${period}`,
      amount: fromCents(totalCents),
      lines: lines.map((b) => ({
        account: "accrual",
        amount: b.amount,
        description: `${b.payee || b.memo} (${b.id})`,
      })),
      sourceBankIds: lines.map((b) => b.id),
    });
  }
  return journals.sort((a, b) => a.period.localeCompare(b.period));
}

function lastDayOfMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); // day 0 of next month = last of this
  return `${period}-${String(last).padStart(2, "0")}`;
}

// human-readable reason a bank line could not be matched (closest near-miss, if any).
function exceptionReason(
  _side: "bank",
  bank: BankTxn,
  ledger: LedgerItem[],
  usedLedger: Set<string>,
): string {
  if (JOURNAL_MARKER.test(`${bank.payee} ${bank.memo}`)) return "month-end journal candidate — proposed separately";
  const bCents = toCents(bank.amount);
  const near = ledger
    .filter((l) => !usedLedger.has(l.id))
    .map((l) => ({ l, amtGap: Math.abs(toCents(l.amount) - bCents), gap: dayGap(bank.date, l.date) }))
    .sort((a, b) => a.amtGap - b.amtGap || a.gap - b.gap)[0];
  if (!near) return "no ledger candidate within tolerance";
  if (near.amtGap > RECON_CONFIG.amountToleranceCents) return "no ledger line with a matching amount";
  if (near.gap > RECON_CONFIG.dateWindowDays) return "amount matches but date is outside the window";
  return "ambiguous — amount/date close but memo did not match";
}

function exceptionReasonLedger(ledger: LedgerItem, bank: BankTxn[], usedBank: Set<string>): string {
  const lCents = toCents(ledger.amount);
  const any = bank.some((b) => !usedBank.has(b.id) && Math.abs(toCents(b.amount) - lCents) <= RECON_CONFIG.amountToleranceCents);
  return any ? "ledger line has a near-amount bank line but no confident match" : "no bank line for this ledger item";
}
