/**
 * Service catalog for the intake flow — paths, add-ons, pricing.
 *
 * Translated from the Claude-designed reference at
 * design-references/client-portal/components/intake-screens.jsx.
 *
 * Shape:
 *   paths      — top-level service path (Personal / Self-Emp / Business / Other)
 *   otherSub   — sub-options when path = "other"
 *   addons     — keyed by path; each path has a different relevant add-on list
 *
 * Pricing lo/hi drives the dynamic "Estimated fee: $X – $Y" ticker
 * in the Services screens. Add-on ranges stack onto the base.
 */

export type ServicePathId = "personal" | "self" | "biz" | "other";
export type OtherSubId = "intro" | "formation" | "books" | "strategy";

export type PathDef = {
  id: ServicePathId;
  name: string;
  sub: string;
  fee: string;
  lo: number;
  hi: number;
  icon: IconKey;
};

export type OtherSubDef = {
  id: OtherSubId;
  name: string;
  sub: string;
  fee: string;
  lo: number;
  hi: number;
  icon: IconKey;
};

export type AddonDef = {
  id: string;
  name: string;
  sub: string;
  fee: string;
  lo: number;
  hi: number;
  icon: IconKey;
};

export type IconKey =
  | "personal"
  | "self"
  | "biz"
  | "rental"
  | "crypto"
  | "amend"
  | "states"
  | "fbar"
  | "consult"
  | "formation"
  | "books"
  | "strategy";

export const SERVICE_PATHS: PathDef[] = [
  {
    id: "personal",
    name: "Personal tax return",
    sub: "W-2 income, maybe a 1099",
    fee: "$150 – $250",
    lo: 150,
    hi: 250,
    icon: "personal"
  },
  {
    id: "self",
    name: "Self-employed return",
    sub: "Schedule C or 1099 income",
    fee: "$250 – $500",
    lo: 250,
    hi: 500,
    icon: "self"
  },
  {
    id: "biz",
    name: "Business return",
    sub: "S-Corp, Partnership, LLC",
    fee: "$500 – $1,000",
    lo: 500,
    hi: 1000,
    icon: "biz"
  },
  {
    id: "other",
    name: "Something else",
    sub: "Consultation, new business, bookkeeping",
    fee: "Varies",
    lo: 0,
    hi: 0,
    icon: "consult"
  }
];

export const OTHER_SUB: OtherSubDef[] = [
  {
    id: "intro",
    name: "Introductory consultation",
    sub: "New clients — get acquainted",
    fee: "Free",
    lo: 0,
    hi: 0,
    icon: "consult"
  },
  {
    id: "formation",
    name: "Business formation",
    sub: "LLC, S-Corp, Partnership setup — plus state fees",
    fee: "$500 – $1,500",
    lo: 500,
    hi: 1500,
    icon: "formation"
  },
  {
    id: "books",
    name: "Bookkeeping consultation",
    sub: "Review your current process",
    fee: "Free initial",
    lo: 0,
    hi: 0,
    icon: "books"
  },
  {
    id: "strategy",
    name: "Strategic tax & business consultation",
    sub: "Planning, entity structure, long-term",
    fee: "$300 – $600",
    lo: 300,
    hi: 600,
    icon: "strategy"
  }
];

const COMMON_PERSONAL_ADDONS: AddonDef[] = [
  {
    id: "rental",
    name: "Rental property",
    sub: "+$150 per property",
    fee: "+ $150",
    lo: 150,
    hi: 150,
    icon: "rental"
  },
  {
    id: "crypto",
    name: "Crypto transactions",
    sub: "Trades, staking, wallets",
    fee: "+ $100",
    lo: 100,
    hi: 100,
    icon: "crypto"
  },
  {
    id: "states",
    name: "Multi-state filing",
    sub: "Per additional state",
    fee: "+ $75 – $150",
    lo: 75,
    hi: 150,
    icon: "states"
  },
  {
    id: "fbar",
    name: "Foreign accounts (FBAR)",
    sub: "Assets held outside the US",
    fee: "+ $250",
    lo: 250,
    hi: 250,
    icon: "fbar"
  },
  {
    id: "amend",
    name: "Prior year amendment",
    sub: "Correcting a filed return",
    fee: "$200 – $400",
    lo: 200,
    hi: 400,
    icon: "amend"
  }
];

export const ADDONS: Record<ServicePathId, AddonDef[]> = {
  personal: COMMON_PERSONAL_ADDONS,
  self: COMMON_PERSONAL_ADDONS,
  biz: [
    {
      id: "states",
      name: "Multi-state filing",
      sub: "Per additional state",
      fee: "+ $75 – $150",
      lo: 75,
      hi: 150,
      icon: "states"
    },
    {
      id: "amend",
      name: "Prior year amendment",
      sub: "Correcting a filed return",
      fee: "$200 – $400",
      lo: 200,
      hi: 400,
      icon: "amend"
    },
    {
      id: "books",
      name: "Bookkeeping cleanup",
      sub: "Before we prep the return",
      fee: "$300 – $800",
      lo: 300,
      hi: 800,
      icon: "books"
    }
  ],
  other: []
};

/**
 * Compute the low/high estimate for a given path + addons selection.
 * Used by the header ticker on the Services screens.
 */
export function estimateFee(
  path: ServicePathId,
  otherSub: OtherSubId | null,
  addons: string[]
): { lo: number; hi: number; hasPrice: boolean } {
  let lo = 0;
  let hi = 0;
  let hasPrice = false;

  if (path === "other") {
    if (otherSub) {
      const o = OTHER_SUB.find((s) => s.id === otherSub);
      if (o) {
        lo += o.lo;
        hi += o.hi;
        hasPrice = o.lo > 0 || o.hi > 0;
      }
    }
    return { lo, hi, hasPrice };
  }

  const p = SERVICE_PATHS.find((x) => x.id === path);
  if (p) {
    lo += p.lo;
    hi += p.hi;
    hasPrice = true;
  }
  const list = ADDONS[path] ?? [];
  for (const id of addons) {
    const a = list.find((x) => x.id === id);
    if (a) {
      lo += a.lo;
      hi += a.hi;
    }
  }
  return { lo, hi, hasPrice };
}

export function formatFeeRange({
  lo,
  hi,
  hasPrice
}: {
  lo: number;
  hi: number;
  hasPrice: boolean;
}): string {
  if (!hasPrice) return "Varies";
  if (lo === hi) return `$${lo.toLocaleString()}`;
  return `$${lo.toLocaleString()} – $${hi.toLocaleString()}`;
}
