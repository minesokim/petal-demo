// Petal OS — document checklists by form. Drives the client record Documents tab:
// what each return needs, what's received (and extracted by Petal) vs still outstanding.

export interface DocItem {
  label: string;
  note?: string;
}

export const formChecklist: Record<string, DocItem[]> = {
  "1040": [
    { label: "W-2s", note: "all employers" },
    { label: "1099 forms", note: "NEC, INT, DIV" },
    { label: "1098 mortgage interest" },
    { label: "Prior-year return" },
    { label: "Dependent SSNs & DOBs" },
    { label: "1095 health coverage" },
    { label: "Charitable receipts" },
  ],
  "1120S": [
    { label: "P&L and balance sheet" },
    { label: "Payroll reports", note: "941, W-3" },
    { label: "Shareholder basis schedule" },
    { label: "Fixed-asset & depreciation" },
    { label: "Bank & card statements" },
    { label: "Prior-year return" },
  ],
  "1065": [
    { label: "P&L and balance sheet" },
    { label: "Partner ownership %" },
    { label: "Capital accounts" },
    { label: "Fixed-asset schedule" },
    { label: "Prior-year return + K-1s" },
  ],
  "Sch C": [
    { label: "Income summary + 1099-NEC" },
    { label: "Expense totals by category" },
    { label: "Mileage log" },
    { label: "Home-office square footage" },
    { label: "Asset purchases" },
  ],
  "Sch E": [
    { label: "Rental income by property" },
    { label: "1098 mortgage interest" },
    { label: "Property tax statements" },
    { label: "Repairs vs improvements log" },
    { label: "Depreciation schedule" },
  ],
};

export const checklistFor = (form: string): DocItem[] => formChecklist[form] ?? formChecklist["1040"];
