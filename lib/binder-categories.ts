// ============================================================
// PETAL BINDER — Tax category taxonomy for document organization
// ============================================================

import type { MockDocument } from "./documents-mock-data";
import { getClientDocuments, getClientChecklist } from "./documents-mock-data";

// ============================================================
// TYPES
// ============================================================

export type TaxBinderCategory =
  | "income_w2"
  | "income_1099"
  | "income_business"
  | "income_rental"
  | "deductions_mortgage"
  | "deductions_property_tax"
  | "deductions_charitable"
  | "deductions_business"
  | "credits"
  | "health_insurance"
  | "retirement"
  | "identity"
  | "prior_returns"
  | "agreements"
  | "prepared_returns"
  | "other";

export interface BinderCategoryConfig {
  id: TaxBinderCategory;
  label: string;
  shortLabel: string;
  sortOrder: number;
  parentGroup: "Income" | "Deductions" | "Credits & Benefits" | "Identity & Agreements" | "Returns" | "Other";
}

// ============================================================
// CATEGORY DEFINITIONS
// ============================================================

export const binderCategories: BinderCategoryConfig[] = [
  // Income
  { id: "income_w2", label: "W-2 Wages", shortLabel: "W-2", sortOrder: 1, parentGroup: "Income" },
  { id: "income_1099", label: "1099 Income", shortLabel: "1099", sortOrder: 2, parentGroup: "Income" },
  { id: "income_business", label: "Business Records", shortLabel: "Biz", sortOrder: 3, parentGroup: "Income" },
  { id: "income_rental", label: "Rental Income", shortLabel: "Rental", sortOrder: 4, parentGroup: "Income" },

  // Deductions
  { id: "deductions_mortgage", label: "Mortgage Interest", shortLabel: "Mort", sortOrder: 10, parentGroup: "Deductions" },
  { id: "deductions_property_tax", label: "Property Tax", shortLabel: "PropTax", sortOrder: 11, parentGroup: "Deductions" },
  { id: "deductions_charitable", label: "Charitable", shortLabel: "Charity", sortOrder: 12, parentGroup: "Deductions" },
  { id: "deductions_business", label: "Business Expenses", shortLabel: "BizExp", sortOrder: 13, parentGroup: "Deductions" },

  // Credits & Benefits
  { id: "credits", label: "Credits", shortLabel: "Credit", sortOrder: 20, parentGroup: "Credits & Benefits" },
  { id: "health_insurance", label: "Health Insurance", shortLabel: "Health", sortOrder: 21, parentGroup: "Credits & Benefits" },
  { id: "retirement", label: "Retirement", shortLabel: "Retire", sortOrder: 22, parentGroup: "Credits & Benefits" },

  // Identity & Agreements
  { id: "identity", label: "Identity", shortLabel: "ID", sortOrder: 30, parentGroup: "Identity & Agreements" },
  { id: "agreements", label: "Agreements", shortLabel: "Agree", sortOrder: 31, parentGroup: "Identity & Agreements" },

  // Returns
  { id: "prior_returns", label: "Prior Returns", shortLabel: "Prior", sortOrder: 40, parentGroup: "Returns" },
  { id: "prepared_returns", label: "Prepared Returns", shortLabel: "Prep", sortOrder: 41, parentGroup: "Returns" },

  // Other
  { id: "other", label: "Other", shortLabel: "Other", sortOrder: 50, parentGroup: "Other" },
];

// ============================================================
// MAPPING FUNCTION
// ============================================================

export function mapDocToBinderCategory(doc: MockDocument): TaxBinderCategory {
  const dt = doc.docType.toLowerCase();
  const cat = doc.docCategory;

  // W-2s
  if (dt === "w2") return "income_w2";

  // 1099s
  if (dt.startsWith("1099")) return "income_1099";

  // K-1s
  if (dt === "k1") return "income_1099";

  // Business records (expense + business category)
  if (cat === "business") return "income_business";

  // Rental
  if (doc.fileName.toLowerCase().includes("rental")) return "income_rental";

  // Deductions
  if (dt.includes("1098") || doc.fileName.toLowerCase().includes("mortgage")) return "deductions_mortgage";
  if (doc.fileName.toLowerCase().includes("property_tax") || doc.fileName.toLowerCase().includes("prop_tax")) return "deductions_property_tax";
  if (doc.fileName.toLowerCase().includes("charit")) return "deductions_charitable";
  if (cat === "deductions") return "deductions_business";

  // Identity
  if (cat === "identity") return "identity";

  // Agreements
  if (cat === "agreements") return "agreements";

  // Returns
  if (dt === "return" && doc.uploadedBy === "preparer") return "prepared_returns";
  if (cat === "returns") return "prior_returns";

  return "other";
}

// ============================================================
// SUMMARY HELPER
// ============================================================

export interface BinderSummaryItem {
  category: TaxBinderCategory;
  config: BinderCategoryConfig;
  received: number;
  expected: number;
}

export function getBinderSummary(clientId: string): BinderSummaryItem[] {
  const docs = getClientDocuments(clientId);
  const checklist = getClientChecklist(clientId);

  // Count docs by binder category
  const categoryDocs: Record<string, number> = {};
  const categoryExpected: Record<string, number> = {};

  for (const doc of docs) {
    const cat = mapDocToBinderCategory(doc);
    categoryDocs[cat] = (categoryDocs[cat] || 0) + 1;
    categoryExpected[cat] = (categoryExpected[cat] || 0) + 1;
  }

  // Add missing checklist items
  for (const item of checklist) {
    if (!item.received) {
      // Map checklist items to binder categories
      let cat: TaxBinderCategory = "other";
      if (item.docType === "w2") cat = "income_w2";
      else if (item.docType.startsWith("1099")) cat = "income_1099";
      else if (item.category === "business") cat = "income_business";
      else if (item.category === "deductions") cat = "deductions_business";
      else if (item.category === "identity") cat = "identity";
      else if (item.category === "returns") cat = "prior_returns";
      else if (item.category === "agreements") cat = "agreements";

      categoryExpected[cat] = (categoryExpected[cat] || 0) + 1;
    }
  }

  // Build summary items for categories that have any docs or expected items
  const allCats = new Set([...Object.keys(categoryDocs), ...Object.keys(categoryExpected)]);
  const items: BinderSummaryItem[] = [];

  for (const catId of allCats) {
    const config = binderCategories.find(c => c.id === catId);
    if (!config) continue;
    items.push({
      category: catId as TaxBinderCategory,
      config,
      received: categoryDocs[catId] || 0,
      expected: categoryExpected[catId] || 0,
    });
  }

  return items.sort((a, b) => a.config.sortOrder - b.config.sortOrder);
}
