// Petal OS - the firm's OWN files (NOT client documents). This is the CPA/EA's
// own drive: credentials, compliance, templates, tax reference, firm admin, SOPs.
// Rendered Google-Drive-style in /os/documents. Demo date is Jun 25, 2026.

export type FileKind = "pdf" | "docx" | "xlsx";

export interface FirmFile {
  id: string;
  name: string;
  kind: FileKind;
  size: string;
  modified: string; // display
  /** sort key - higher is newer (for the Recent rail) */
  ts: number;
  owner: string; // Antonio Vazquez / Elena Reyes
  starred?: boolean;
}

export interface FirmFolder {
  id: string;
  name: string;
  description: string;
  files: FirmFile[];
}

const A = "Antonio Vazquez";
const E = "Elena Reyes";

export const firmFolders: FirmFolder[] = [
  {
    id: "f-credentials", name: "Credentials & Licensing",
    description: "Your enrollment, PTIN, EFIN, and CPE records.",
    files: [
      { id: "fl-ea", name: "EA Enrollment Card 2026.pdf", kind: "pdf", size: "180 KB", modified: "Jan 8, 2026", ts: 62, owner: A, starred: true },
      { id: "fl-ptin", name: "PTIN Renewal 2026.pdf", kind: "pdf", size: "96 KB", modified: "Oct 15, 2025", ts: 50, owner: A },
      { id: "fl-efin", name: "EFIN Approval Letter.pdf", kind: "pdf", size: "210 KB", modified: "Aug 2022", ts: 20, owner: A },
      { id: "fl-caf", name: "CAF Authorization.pdf", kind: "pdf", size: "88 KB", modified: "2023", ts: 28, owner: A },
      { id: "fl-cpe", name: "CPE Certificates 2025.pdf", kind: "pdf", size: "1.2 MB", modified: "Dec 2025", ts: 55, owner: A },
    ],
  },
  {
    id: "f-compliance", name: "Compliance & Security",
    description: "WISP, §7216 consents, and safeguard policies.",
    files: [
      { id: "fl-wisp", name: "WISP - Written Information Security Plan.docx", kind: "docx", size: "145 KB", modified: "Jun 12, 2026", ts: 96, owner: A, starred: true },
      { id: "fl-7216d", name: "§7216 Consent to Disclose (template).pdf", kind: "pdf", size: "64 KB", modified: "Jan 2026", ts: 60, owner: A },
      { id: "fl-7216u", name: "§7216 Consent to Use (template).pdf", kind: "pdf", size: "62 KB", modified: "Jan 2026", ts: 60, owner: A },
      { id: "fl-4557", name: "IRS Pub 4557 - Safeguarding Taxpayer Data.pdf", kind: "pdf", size: "880 KB", modified: "2025", ts: 40, owner: A },
      { id: "fl-retention", name: "Data Retention Policy.docx", kind: "docx", size: "72 KB", modified: "Mar 2026", ts: 70, owner: E },
    ],
  },
  {
    id: "f-templates", name: "Templates & Letters",
    description: "Engagement letters, organizers, and client correspondence.",
    files: [
      { id: "fl-eng-1040", name: "Engagement Letter - 1040 (template).docx", kind: "docx", size: "88 KB", modified: "Jan 2026", ts: 60, owner: A, starred: true },
      { id: "fl-eng-biz", name: "Engagement Letter - Business (template).docx", kind: "docx", size: "94 KB", modified: "Jan 2026", ts: 60, owner: A },
      { id: "fl-organizer", name: "Client Organizer 2025.pdf", kind: "pdf", size: "1.4 MB", modified: "Jan 2026", ts: 60, owner: A },
      { id: "fl-doc-req", name: "Document Request Checklist.docx", kind: "docx", size: "52 KB", modified: "Jun 18, 2026", ts: 98, owner: E },
      { id: "fl-8879", name: "8879 Cover Letter (template).docx", kind: "docx", size: "40 KB", modified: "Feb 2026", ts: 66, owner: A },
      { id: "fl-ext", name: "Extension Cover Letter (template).docx", kind: "docx", size: "38 KB", modified: "Apr 2026", ts: 76, owner: A },
      { id: "fl-diseng", name: "Disengagement Letter (template).docx", kind: "docx", size: "44 KB", modified: "2025", ts: 40, owner: A },
    ],
  },
  {
    id: "f-reference", name: "Tax Reference",
    description: "Rate schedules, worksheets, and the deadline calendar.",
    files: [
      { id: "fl-rates", name: "2025 Tax Rate Schedules.xlsx", kind: "xlsx", size: "64 KB", modified: "Jan 2026", ts: 60, owner: A },
      { id: "fl-mileage", name: "2026 Standard Mileage Rates.pdf", kind: "pdf", size: "28 KB", modified: "Jan 2026", ts: 60, owner: A },
      { id: "fl-macrs", name: "MACRS Depreciation Tables.xlsx", kind: "xlsx", size: "120 KB", modified: "2025", ts: 40, owner: A },
      { id: "fl-199a", name: "§199A QBI Worksheet (template).xlsx", kind: "xlsx", size: "96 KB", modified: "Feb 2026", ts: 66, owner: A, starred: true },
      { id: "fl-deadlines", name: "Filing Deadlines 2026.pdf", kind: "pdf", size: "44 KB", modified: "Jan 2026", ts: 60, owner: A },
      { id: "fl-retire", name: "Retirement Contribution Limits 2025.pdf", kind: "pdf", size: "36 KB", modified: "2025", ts: 40, owner: A },
    ],
  },
  {
    id: "f-admin", name: "Firm Administration",
    description: "Business license, insurance, and operating records.",
    files: [
      { id: "fl-license", name: "Vazant EA - Business License.pdf", kind: "pdf", size: "156 KB", modified: "2024", ts: 32, owner: A },
      { id: "fl-ein", name: "EIN Assignment Letter.pdf", kind: "pdf", size: "88 KB", modified: "2020", ts: 10, owner: A },
      { id: "fl-eo", name: "E&O Insurance Policy 2026.pdf", kind: "pdf", size: "420 KB", modified: "Jan 2026", ts: 60, owner: A, starred: true },
      { id: "fl-operating", name: "Operating Agreement.pdf", kind: "pdf", size: "240 KB", modified: "2020", ts: 10, owner: A },
      { id: "fl-vendors", name: "Vendor & Software Receipts 2026.xlsx", kind: "xlsx", size: "72 KB", modified: "Jun 2026", ts: 90, owner: E },
    ],
  },
  {
    id: "f-sops", name: "Firm SOPs",
    description: "How the practice runs - review, intake, and software setup.",
    files: [
      { id: "fl-constitution", name: "Firm Constitution.docx", kind: "docx", size: "64 KB", modified: "Jun 2026", ts: 92, owner: A, starred: true },
      { id: "fl-review", name: "Return Review Checklist.docx", kind: "docx", size: "56 KB", modified: "May 2026", ts: 84, owner: A },
      { id: "fl-intake", name: "New Client Intake SOP.docx", kind: "docx", size: "48 KB", modified: "Mar 2026", ts: 70, owner: E },
      { id: "fl-olt", name: "OLT Pro - E-file Setup Guide.pdf", kind: "pdf", size: "310 KB", modified: "2025", ts: 40, owner: A },
      { id: "fl-eservices", name: "IRS e-Services Setup.pdf", kind: "pdf", size: "280 KB", modified: "2025", ts: 40, owner: A },
    ],
  },
];

// ── derived helpers ──────────────────────────────────────────
export interface FlatFile extends FirmFile {
  folderId: string;
  folderName: string;
}

export const allFirmFiles: FlatFile[] = firmFolders.flatMap(f =>
  f.files.map(file => ({ ...file, folderId: f.id, folderName: f.name })),
);

export const recentFirmFiles: FlatFile[] = [...allFirmFiles].sort((a, b) => b.ts - a.ts).slice(0, 6);
export const starredFirmFiles: FlatFile[] = allFirmFiles.filter(f => f.starred);
export const firmFileCount = allFirmFiles.length;
export const folderById = (id: string) => firmFolders.find(f => f.id === id);

export const fileKindMeta: Record<FileKind, { label: string; tile: string; text: string }> = {
  pdf: { label: "PDF", tile: "bg-red-50", text: "text-red-600" },
  docx: { label: "DOC", tile: "bg-blue-50", text: "text-blue-600" },
  xlsx: { label: "XLS", tile: "bg-emerald-50", text: "text-emerald-600" },
};
