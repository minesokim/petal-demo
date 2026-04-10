// Shared intake data — used by both the Intake tab and Prep Workspace

export interface IntakeResponse {
  submittedAt: string;
  service: string;
  filing: string;
  spouse?: { name: string; dob: string; ssn: string; occupation: string };
  personal: { name: string; dob: string; ssn: string; phone: string; email: string; occupation: string; address: string };
  states: string[];
  priorYear: string;
  dependents: { name: string; dob: string; ssn: string; relationship: string; months: string }[];
  income: string[];
  selfEmployment?: { business: string; entity: string; revenue: string; homeOffice: boolean; vehicle: boolean };
  rental?: { address: string; rent: string; mortgage: string; year: string };
  taxQuestions: string[];
  deductions: string[];
  refund: string;
  lifeEvents: string[];
  depositAmount: number;
  slot: string;
}

export const INTAKE_DATA: Record<string, IntakeResponse> = {
  c1: { // Marcus Chen
    submittedAt: "2026-03-18T09:00:00",
    service: "Premium Return",
    filing: "Married Filing Jointly",
    spouse: { name: "Lisa Chen", dob: "11/02/1987", ssn: "***-**-3210", occupation: "Office Manager" },
    personal: { name: "Marcus Chen", dob: "05/18/1984", ssn: "***-**-6543", phone: "(951) 555-0142", email: "marcus.chen@gmail.com", occupation: "Restaurant Owner", address: "456 Garfield Ave, Alhambra, CA 91801" },
    states: ["California"],
    priorYear: "Filed with Antonio last year",
    dependents: [],
    income: ["W-2 Employee", "Self-Employed / 1099"],
    selfEmployment: { business: "Golden Dragon LLC", entity: "LLC", revenue: "$142,000", homeOffice: false, vehicle: true },
    taxQuestions: ["Restaurant depreciation", "Equipment disposal"],
    deductions: ["Business expenses", "Vehicle expenses"],
    refund: "Direct deposit",
    lifeEvents: ["Closed a business location"],
    depositAmount: 50,
    slot: "Thu, Mar 20 · 10:00 AM · Video",
  },
  c3: { // James & Sofia Rodriguez
    submittedAt: "2026-03-20T10:30:00",
    service: "Complex Return",
    filing: "Married Filing Jointly",
    spouse: { name: "Sofia Rodriguez", dob: "06/15/1988", ssn: "***-**-4521", occupation: "Teacher" },
    personal: { name: "James Rodriguez", dob: "03/22/1985", ssn: "***-**-7832", phone: "(626) 555-0192", email: "james.rod@email.com", occupation: "Project Manager", address: "2341 Maple Ave, Montclair, CA 91763" },
    states: ["California"],
    priorYear: "Filed with Antonio last year",
    dependents: [
      { name: "Isabella Rodriguez", dob: "08/12/2018", ssn: "***-**-9012", relationship: "Daughter", months: "12" },
      { name: "Lucas Rodriguez", dob: "11/03/2020", ssn: "***-**-3456", relationship: "Son", months: "12" },
    ],
    income: ["W-2 Employee", "Investments / Crypto"],
    taxQuestions: ["Estimated tax payments", "HSA contributions"],
    deductions: ["Mortgage interest", "Childcare expenses", "Charitable donations"],
    refund: "Direct deposit",
    lifeEvents: [],
    depositAmount: 50,
    slot: "Mon, Mar 24 · 9:00 AM · Phone",
  },
  c2: { // Priya Sharma
    submittedAt: "2026-03-22T14:15:00",
    service: "Complex Return",
    filing: "Single",
    personal: { name: "Priya Sharma", dob: "09/14/1997", ssn: "***-**-6789", phone: "(951) 555-0198", email: "priya.sharma@outlook.com", occupation: "Content Creator", address: "445 Palm Dr #204, Riverside, CA 92501" },
    states: ["California"],
    priorYear: "First time filing (was on parents' return)",
    dependents: [],
    income: ["Self-Employed / 1099", "Investments / Crypto"],
    selfEmployment: { business: "Priya Creates LLC", entity: "LLC", revenue: "$85,000", homeOffice: true, vehicle: false },
    taxQuestions: ["First time filing independently", "Crypto trades"],
    deductions: ["Home office", "Business expenses"],
    refund: "Direct deposit",
    lifeEvents: ["Started a business"],
    depositAmount: 50,
    slot: "Sat, Mar 29 · 1:00 PM · Phone",
  },
  c14: { // Aisha Johnson
    submittedAt: "2026-03-18T09:45:00",
    service: "Standard Return",
    filing: "Single",
    personal: { name: "Aisha Johnson", dob: "04/28/1991", ssn: "***-**-2345", phone: "(626) 555-0189", email: "aisha.j@outlook.com", occupation: "Registered Nurse", address: "1120 Valley Blvd, Montclair, CA 91763" },
    states: ["California"],
    priorYear: "Filed with H&R Block",
    dependents: [],
    income: ["W-2 Employee", "Self-Employed / 1099"],
    selfEmployment: { business: "Aisha's Scrubs (Etsy)", entity: "Sole Proprietor", revenue: "$12,400", homeOffice: true, vehicle: false },
    taxQuestions: ["Side hustle taxes", "Can I deduct my nursing license renewal?"],
    deductions: ["Student loan interest", "Business expenses"],
    refund: "Direct deposit",
    lifeEvents: [],
    depositAmount: 50,
    slot: "Tue, Mar 19 · 10:00 AM · Video",
  },
  c17: { // Tyrone Mitchell
    submittedAt: "2026-03-15T11:20:00",
    service: "Standard Return",
    filing: "Single",
    personal: { name: "Tyrone Mitchell", dob: "07/09/1989", ssn: "***-**-8901", phone: "(323) 555-0177", email: "tyrone.m@gmail.com", occupation: "Rideshare Driver", address: "890 Central Ave, Los Angeles, CA 90012" },
    states: ["California"],
    priorYear: "Filed with Antonio last year (extended)",
    dependents: [
      { name: "Jaylen Mitchell", dob: "02/14/2015", ssn: "***-**-5678", relationship: "Son", months: "6" },
    ],
    income: ["Self-Employed / 1099"],
    selfEmployment: { business: "Self (Uber/Lyft)", entity: "Sole Proprietor", revenue: "$52,000", homeOffice: false, vehicle: true },
    taxQuestions: ["Mileage deduction", "Quarterly estimated taxes"],
    deductions: ["Vehicle expenses"],
    refund: "Direct deposit",
    lifeEvents: ["Divorced"],
    depositAmount: 50,
    slot: "Thu, Mar 20 · 2:00 PM · Phone",
  },
};

export function getIntakeData(clientId: string): IntakeResponse | undefined {
  return INTAKE_DATA[clientId];
}
