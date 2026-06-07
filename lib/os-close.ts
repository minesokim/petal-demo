// Month-end close checklist — the workflow the Today "Month-end close" card summarizes.
export type CloseStatus = "not_started" | "in_progress" | "complete";

export type CloseTask = {
  id: string;
  title: string;
  status: CloseStatus;
  client: string;
  assignee: string;
  due: string;
  group: string;
};

export const closeMonth = "May 2026";

export const closeStatusMeta: Record<CloseStatus, { label: string; dot: string }> = {
  not_started: { label: "Not started", dot: "bg-[var(--os-border-strong)]" },
  in_progress: { label: "In progress", dot: "bg-amber-500" },
  complete: { label: "Complete", dot: "bg-emerald-500" },
};

export const CLOSE_ORDER: CloseStatus[] = ["not_started", "in_progress", "complete"];

export const closeOwners: Record<string, string> = {
  "u-antonio": "Antonio Vazquez",
  "u-elena": "Elena Martinez",
  "u-james": "James Chen",
};

export const closeTasks: CloseTask[] = [
  { id: "cl-1", title: "Reconcile bank + card accounts", status: "complete", client: "Park Family Dental", assignee: "u-antonio", due: "May 24", group: "Reconciliation" },
  { id: "cl-2", title: "Reconcile payroll to Gusto", status: "complete", client: "Fuentes Transport", assignee: "u-antonio", due: "May 24", group: "Reconciliation" },
  { id: "cl-3", title: "Categorize 3 uncategorized expenses", status: "in_progress", client: "Park Family Dental", assignee: "u-antonio", due: "May 28", group: "Adjustments" },
  { id: "cl-4", title: "Post depreciation + amortization", status: "in_progress", client: "Fuentes Transport", assignee: "u-antonio", due: "May 29", group: "Adjustments" },
  { id: "cl-5", title: "Update prepaid insurance schedule", status: "in_progress", client: "Mendez Auto", assignee: "u-elena", due: "May 29", group: "Adjustments" },
  { id: "cl-6", title: "Review AP aging + accruals", status: "not_started", client: "Sandoval Plumbing", assignee: "u-antonio", due: "May 31", group: "Review" },
  { id: "cl-7", title: "Generate financial statements", status: "not_started", client: "Park Family Dental", assignee: "u-antonio", due: "May 31", group: "Review" },
];
