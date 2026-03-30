// ============================================================
// DOCKET - Preparer Dashboard Mock Data
// Founding client: Antonio Vazquez, Vazant Consulting
// ============================================================

export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh' | 'qw'
export type ReturnStage = 'new_intake' | 'collecting_docs' | 'ready_to_prep' | 'in_preparation' | 'client_review' | 'pay_and_sign' | 'filed'
export type DocumentStatus = 'received' | 'pending' | 'missing' | 'processing'
export type UrgencyLevel = 'urgent' | 'high' | 'normal' | 'low'
export type ActionType = 'missing_docs' | 'stale_client' | 'review_ready' | 'payment_due' | 'signature_needed' | 'appointment_today' | 'ai_draft' | 'follow_up'

export type ClientStatus = 'pending' | 'active' | 'declined'

export interface Client {
  id: string
  fullName: string
  email: string
  phone: string
  filingStatus: FilingStatus
  returnStage: ReturnStage
  serviceTier: string
  feeAmount: number
  depositPaid: boolean
  urgency: UrgencyLevel
  lastActivity: string
  lastPortalLogin: string | null
  documentsSubmitted: number
  documentsRequired: number
  notes: string
  type: 'individual' | 'business'
  businessName?: string
  avatar: string
  clientStatus?: ClientStatus
  scheduledCall?: string
}

export interface Document {
  id: string
  clientId: string
  clientName: string
  type: string
  label: string
  status: DocumentStatus
  uploadedAt: string | null
  category: 'income' | 'deduction' | 'identity' | 'business' | 'agreement'
}

export interface ActionItem {
  id: string
  clientId: string
  clientName: string
  type: ActionType
  title: string
  description: string
  priority: number
  createdAt: string
  isResolved: boolean
  aiDraft?: string
}

export interface Message {
  id: string
  clientId: string
  clientName: string
  content: string
  sender: 'client' | 'preparer' | 'system'
  timestamp: string
  read: boolean
}

export interface Appointment {
  id: string
  clientId: string
  clientName: string
  type: 'phone' | 'video' | 'in_person'
  date: string
  startTime: string
  endTime: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  notes?: string
}

export interface Invoice {
  id: string
  clientId: string
  clientName: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paidDate?: string
  service: string
}

// ============================================================
// CLIENTS (20+ realistic tax clients)
// ============================================================
export const clients: Client[] = [
  { id: 'c1', fullName: 'Marcus Chen', email: 'marcus.chen@gmail.com', phone: '(951) 555-0142', filingStatus: 'mfj', returnStage: 'in_preparation', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-27T14:30:00', lastPortalLogin: '2026-03-27T09:15:00', documentsSubmitted: 8, documentsRequired: 10, notes: 'Restaurant owner. Needs Schedule C + SE tax. Has 3 locations.', type: 'business', businessName: 'Golden Dragon LLC', avatar: '/images/avatars/01.png' },
  { id: 'c2', fullName: 'Priya Sharma', email: 'priya.sharma@outlook.com', phone: '(951) 555-0198', filingStatus: 'single', returnStage: 'collecting_docs', serviceTier: 'Standard', feeAmount: 350, depositPaid: true, urgency: 'high', lastActivity: '2026-03-25T11:00:00', lastPortalLogin: '2026-03-22T16:30:00', documentsSubmitted: 3, documentsRequired: 7, notes: 'TikTok creator. Multiple 1099-NECs. First year filing with us.', type: 'individual', avatar: '/images/avatars/02.png' },
  { id: 'c3', fullName: 'James & Sofia Rodriguez', email: 'jrodriguez@yahoo.com', phone: '(909) 555-0176', filingStatus: 'mfj', returnStage: 'pay_and_sign', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-28T08:00:00', lastPortalLogin: '2026-03-28T07:45:00', documentsSubmitted: 12, documentsRequired: 12, notes: 'Rental property income. 2 dependents. Been with us 3 years.', type: 'individual', avatar: '/images/avatars/03.png' },
  { id: 'c4', fullName: 'DeShawn Williams', email: 'deshawn.w@gmail.com', phone: '(951) 555-0134', filingStatus: 'hoh', returnStage: 'collecting_docs', serviceTier: 'Basic', feeAmount: 150, depositPaid: false, urgency: 'urgent', lastActivity: '2026-03-18T09:30:00', lastPortalLogin: null, documentsSubmitted: 1, documentsRequired: 6, notes: 'New client. Head of household with 2 kids. Needs to upload W-2 still.', type: 'individual', avatar: '/images/avatars/04.png' },
  { id: 'c5', fullName: 'Linda Nakamura', email: 'linda.n@proton.me', phone: '(626) 555-0155', filingStatus: 'single', returnStage: 'filed', serviceTier: 'Standard', feeAmount: 350, depositPaid: true, urgency: 'low', lastActivity: '2026-03-15T10:00:00', lastPortalLogin: '2026-03-15T10:00:00', documentsSubmitted: 7, documentsRequired: 7, notes: 'W-2 employee + small Etsy shop. Filed and accepted.', type: 'individual', avatar: '/images/avatars/05.png' },
  { id: 'c6', fullName: 'Roberto Fuentes', email: 'roberto@fuentestrucking.com', phone: '(909) 555-0188', filingStatus: 'mfj', returnStage: 'client_review', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-27T16:00:00', lastPortalLogin: '2026-03-26T11:20:00', documentsSubmitted: 15, documentsRequired: 15, notes: 'Trucking company. 1120S + personal. Complex depreciation schedules.', type: 'business', businessName: 'Fuentes Transport Inc', avatar: '/images/avatars/06.png' },
  { id: 'c7', fullName: 'Ashley Kim', email: 'ashley.kim@icloud.com', phone: '(714) 555-0167', filingStatus: 'single', returnStage: 'new_intake', serviceTier: 'Standard', feeAmount: 350, depositPaid: false, urgency: 'normal', lastActivity: '2026-03-26T14:00:00', lastPortalLogin: null, documentsSubmitted: 0, documentsRequired: 8, notes: 'OnlyFans creator. Referred by Priya. Needs help with estimated payments.', type: 'individual', avatar: '/images/avatars/07.png' },
  { id: 'c8', fullName: 'Thomas & Marie DuBois', email: 'tdubois@gmail.com', phone: '(951) 555-0145', filingStatus: 'mfj', returnStage: 'in_preparation', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-27T11:30:00', lastPortalLogin: '2026-03-25T08:00:00', documentsSubmitted: 11, documentsRequired: 14, notes: 'Both W-2 + rental property. Crypto trades this year.', type: 'individual', avatar: '/images/avatars/08.png' },
  { id: 'c9', fullName: 'Miguel Sandoval', email: 'miguel@sandovalplumbing.com', phone: '(909) 555-0199', filingStatus: 'mfj', returnStage: 'ready_to_prep', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-26T09:00:00', lastPortalLogin: '2026-03-26T08:45:00', documentsSubmitted: 9, documentsRequired: 9, notes: 'Plumbing business. Schedule C. Wants to incorporate this year.', type: 'business', businessName: 'Sandoval Plumbing', avatar: '/images/avatars/09.png' },
  { id: 'c10', fullName: 'Karen O\'Brien', email: 'kobrien@hotmail.com', phone: '(626) 555-0178', filingStatus: 'single', returnStage: 'filed', serviceTier: 'Basic', feeAmount: 150, depositPaid: true, urgency: 'low', lastActivity: '2026-03-10T14:30:00', lastPortalLogin: '2026-03-10T14:30:00', documentsSubmitted: 4, documentsRequired: 4, notes: 'Simple W-2 return. Filed and accepted. Returning client.', type: 'individual', avatar: '/images/avatars/10.png' },
  { id: 'c11', fullName: 'David Park', email: 'dpark@parkdental.com', phone: '(714) 555-0123', filingStatus: 'mfj', returnStage: 'in_preparation', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'high', lastActivity: '2026-03-28T07:00:00', lastPortalLogin: '2026-03-27T20:00:00', documentsSubmitted: 18, documentsRequired: 20, notes: 'Dental practice S-Corp. Multiple employees. Payroll complexity.', type: 'business', businessName: 'Park Family Dental', avatar: '/images/avatars/11.png' },
  { id: 'c12', fullName: 'Jasmine Torres', email: 'jas.torres@gmail.com', phone: '(951) 555-0156', filingStatus: 'hoh', returnStage: 'collecting_docs', serviceTier: 'Standard', feeAmount: 350, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-24T13:00:00', lastPortalLogin: '2026-03-24T13:00:00', documentsSubmitted: 4, documentsRequired: 8, notes: 'Freelance graphic designer. 1 dependent. Multiple 1099s.', type: 'individual', avatar: '/images/avatars/12.png' },
  { id: 'c13', fullName: 'Vladimir Petrov', email: 'vlad@petrovimports.com', phone: '(909) 555-0134', filingStatus: 'mfj', returnStage: 'new_intake', serviceTier: 'Premium', feeAmount: 500, depositPaid: false, urgency: 'high', lastActivity: '2026-03-20T10:00:00', lastPortalLogin: null, documentsSubmitted: 0, documentsRequired: 16, notes: 'Import/export business. Needs extension likely. Complex international.', type: 'business', businessName: 'Petrov Imports LLC', avatar: '/images/avatars/01.png' },
  { id: 'c14', fullName: 'Aisha Johnson', email: 'aisha.j@outlook.com', phone: '(626) 555-0189', filingStatus: 'single', returnStage: 'pay_and_sign', serviceTier: 'Standard', feeAmount: 350, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-28T09:00:00', lastPortalLogin: '2026-03-28T08:30:00', documentsSubmitted: 6, documentsRequired: 6, notes: 'Nurse. W-2 + side hustle selling scrubs online.', type: 'individual', avatar: '/images/avatars/02.png' },
  { id: 'c15', fullName: 'Carlos & Elena Mendez', email: 'cmendez@mendezauto.com', phone: '(951) 555-0177', filingStatus: 'mfj', returnStage: 'in_preparation', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-27T15:00:00', lastPortalLogin: '2026-03-26T19:00:00', documentsSubmitted: 13, documentsRequired: 14, notes: 'Auto repair shop. 1065 partnership. 4 dependents.', type: 'business', businessName: 'Mendez Auto Repair', avatar: '/images/avatars/03.png' },
  { id: 'c16', fullName: 'Rachel Goldstein', email: 'rachel.g@gmail.com', phone: '(714) 555-0145', filingStatus: 'mfj', returnStage: 'filed', serviceTier: 'Standard', feeAmount: 350, depositPaid: true, urgency: 'low', lastActivity: '2026-03-12T11:00:00', lastPortalLogin: '2026-03-12T11:00:00', documentsSubmitted: 8, documentsRequired: 8, notes: 'Both W-2. Simple MFJ. Returning client 4th year.', type: 'individual', avatar: '/images/avatars/04.png' },
  { id: 'c17', fullName: 'Tyrone Mitchell', email: 'tyrone.m@gmail.com', phone: '(909) 555-0167', filingStatus: 'single', returnStage: 'collecting_docs', serviceTier: 'Basic', feeAmount: 150, depositPaid: true, urgency: 'urgent', lastActivity: '2026-03-19T08:00:00', lastPortalLogin: '2026-03-19T08:00:00', documentsSubmitted: 2, documentsRequired: 5, notes: 'Uber/Lyft driver. Needs help tracking mileage. Last year extended.', type: 'individual', avatar: '/images/avatars/05.png' },
  { id: 'c18', fullName: 'Mei-Lin Wu', email: 'meiwu@wuacupuncture.com', phone: '(626) 555-0134', filingStatus: 'single', returnStage: 'client_review', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-27T17:00:00', lastPortalLogin: '2026-03-27T12:00:00', documentsSubmitted: 10, documentsRequired: 10, notes: 'Acupuncture practice. Schedule C. Health insurance deduction.', type: 'business', businessName: 'Wu Acupuncture & Wellness', avatar: '/images/avatars/06.png' },
  { id: 'c19', fullName: 'Anthony Russo', email: 'arusso@gmail.com', phone: '(951) 555-0198', filingStatus: 'mfj', returnStage: 'ready_to_prep', serviceTier: 'Standard', feeAmount: 350, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-25T14:00:00', lastPortalLogin: '2026-03-25T14:00:00', documentsSubmitted: 9, documentsRequired: 9, notes: 'W-2 + investment income. Large stock sales this year. Needs cap gains calc.', type: 'individual', avatar: '/images/avatars/07.png' },
  { id: 'c20', fullName: 'Fatima Al-Hassan', email: 'fatima@eleganthenna.com', phone: '(714) 555-0189', filingStatus: 'mfj', returnStage: 'new_intake', serviceTier: 'Standard', feeAmount: 350, depositPaid: false, urgency: 'normal', lastActivity: '2026-03-27T10:00:00', lastPortalLogin: null, documentsSubmitted: 0, documentsRequired: 7, notes: 'Henna artist. Cash business. New client referral from Elena Mendez.', type: 'business', businessName: 'Elegant Henna Art', avatar: '/images/avatars/08.png' },
  // Pending clients - completed intake + deposit + scheduled call, awaiting Antonio's accept/decline
  { id: 'c21', fullName: 'Sarah Mitchell', email: 'sarah.m@gmail.com', phone: '(626) 555-0201', filingStatus: 'single', returnStage: 'new_intake', serviceTier: 'Standard', feeAmount: 350, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-28T10:00:00', lastPortalLogin: '2026-03-28T10:00:00', documentsSubmitted: 0, documentsRequired: 6, notes: 'Freelance photographer. Found Antonio on Nextdoor. Seems straightforward - W-2 from part-time job + 1099s from photography clients.', type: 'individual', avatar: '/images/avatars/10.png', clientStatus: 'pending', scheduledCall: '2026-03-30T10:00:00' },
  { id: 'c22', fullName: 'Kevin & Lisa Park', email: 'kpark@gmail.com', phone: '(909) 555-0215', filingStatus: 'mfj', returnStage: 'new_intake', serviceTier: 'Premium', feeAmount: 500, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-27T16:00:00', lastPortalLogin: '2026-03-27T16:00:00', documentsSubmitted: 0, documentsRequired: 12, notes: 'Referred by David Park (brother). Owns a dry cleaning business. Multiple employees. Wants to switch from H&R Block.', type: 'business', businessName: 'Park Cleaners', avatar: '/images/avatars/09.png', clientStatus: 'pending', scheduledCall: '2026-03-29T14:00:00' },
  { id: 'c23', fullName: 'Daniel Okafor', email: 'dan.okafor@outlook.com', phone: '(714) 555-0233', filingStatus: 'single', returnStage: 'new_intake', serviceTier: 'Basic', feeAmount: 150, depositPaid: true, urgency: 'normal', lastActivity: '2026-03-28T08:00:00', lastPortalLogin: '2026-03-28T08:00:00', documentsSubmitted: 0, documentsRequired: 4, notes: 'Simple W-2 return. College student with part-time job. Referred by mentor network.', type: 'individual', avatar: '/images/avatars/11.png', clientStatus: 'pending', scheduledCall: '2026-03-31T11:00:00' },
]

// ============================================================
// ACTION ITEMS (prioritized feed - "Inbox zero for tax prep")
// ============================================================
export const actionItems: ActionItem[] = [
  { id: 'a1', clientId: 'c4', clientName: 'DeShawn Williams', type: 'missing_docs', title: 'Missing W-2 and deposit', description: 'DeShawn hasn\'t uploaded his W-2 or paid the deposit. Last login was never. Sent intake 10 days ago.', priority: 1, createdAt: '2026-03-28T08:00:00', isResolved: false, aiDraft: 'Hi DeShawn, just checking in! I noticed we\'re still waiting on your W-2 and the $50 deposit to get started on your return. The April 15 deadline is coming up fast. Can you upload your W-2 through the portal this week?' },
  { id: 'a2', clientId: 'c17', clientName: 'Tyrone Mitchell', type: 'stale_client', title: 'Stale - 9 days since last activity', description: 'Tyrone logged in 9 days ago but only uploaded 2 of 5 documents. Previously extended last year.', priority: 1, createdAt: '2026-03-28T08:00:00', isResolved: false, aiDraft: 'Hey Tyrone, I see you started uploading your docs. We still need your 1099-K from Uber, mileage log, and last year\'s return. Want me to walk you through what we need? I don\'t want you to have to extend again.' },
  { id: 'a3', clientId: 'c13', clientName: 'Vladimir Petrov', type: 'missing_docs', title: 'No documents - likely needs extension', description: 'Vladimir hasn\'t started intake. 0 of 16 docs. Complex international business. Extension almost certain.', priority: 2, createdAt: '2026-03-28T08:00:00', isResolved: false, aiDraft: 'Vladimir, I wanted to reach out about your 2025 tax return. Given the complexity of Petrov Imports, we should discuss whether filing an extension makes sense. Can we schedule a call this week?' },
  { id: 'a4', clientId: 'c3', clientName: 'James & Sofia Rodriguez', type: 'signature_needed', title: 'Return ready - awaiting 8879 signature', description: 'Return is complete and reviewed. Payment confirmed. Needs 8879 e-signature.', priority: 2, createdAt: '2026-03-28T07:00:00', isResolved: false },
  { id: 'a5', clientId: 'c14', clientName: 'Aisha Johnson', type: 'signature_needed', title: 'Return ready - awaiting 8879 signature', description: 'Simple return complete. Payment received. Waiting on e-signature.', priority: 2, createdAt: '2026-03-28T07:30:00', isResolved: false },
  { id: 'a6', clientId: 'c6', clientName: 'Roberto Fuentes', type: 'review_ready', title: 'Business return ready for review', description: '1120S + personal return prepared. Depreciation schedules updated. Needs your review before sending to client.', priority: 3, createdAt: '2026-03-27T16:00:00', isResolved: false },
  { id: 'a7', clientId: 'c18', clientName: 'Mei-Lin Wu', type: 'review_ready', title: 'Schedule C return ready for review', description: 'Return prepared with health insurance deduction. QBI deduction calculated. Review needed.', priority: 3, createdAt: '2026-03-27T17:00:00', isResolved: false },
  { id: 'a8', clientId: 'c2', clientName: 'Priya Sharma', type: 'missing_docs', title: 'Missing 4 documents', description: 'Priya has uploaded 3 of 7 required docs. Still needs: 1099-NEC (TikTok), 1099-NEC (brand deals), bank statements, estimated payment receipts.', priority: 3, createdAt: '2026-03-27T11:00:00', isResolved: false, aiDraft: 'Hi Priya! Your return is looking good so far. We just need a few more documents to finish up: your 1099-NEC from TikTok, any 1099s from brand deals, bank statements, and receipts for estimated payments you made. You can upload them right in the portal!' },
  { id: 'a9', clientId: 'c11', clientName: 'David Park', type: 'appointment_today', title: 'Review appointment at 2:00 PM', description: 'Scheduled video call to review S-Corp return. 2 documents still missing (payroll summary, equipment list).', priority: 2, createdAt: '2026-03-28T07:00:00', isResolved: false },
  { id: 'a10', clientId: 'c7', clientName: 'Ashley Kim', type: 'follow_up', title: 'Intake sent - no response', description: 'Intake link sent 2 days ago. No login yet. Referred by Priya.', priority: 4, createdAt: '2026-03-26T14:00:00', isResolved: false, aiDraft: 'Hi Ashley! I sent over your intake form a couple days ago. When you get a chance, just follow the link to get started. It only takes about 10 minutes. If you have any questions, I\'m here to help!' },
  { id: 'a11', clientId: 'c20', clientName: 'Fatima Al-Hassan', type: 'follow_up', title: 'Intake sent - no response', description: 'New referral from Elena Mendez. Intake sent yesterday.', priority: 5, createdAt: '2026-03-27T10:00:00', isResolved: false },
  { id: 'a12', clientId: 'c8', clientName: 'Thomas & Marie DuBois', type: 'missing_docs', title: 'Missing 3 crypto-related documents', description: 'Need 1099-DA from Coinbase, transaction history, and cost basis report.', priority: 3, createdAt: '2026-03-27T11:30:00', isResolved: false },
]

// ============================================================
// DOCUMENTS
// ============================================================
export const documents: Document[] = [
  { id: 'd1', clientId: 'c1', clientName: 'Marcus Chen', type: 'W-2', label: 'W-2 from Golden Dragon LLC', status: 'received', uploadedAt: '2026-03-20T10:00:00', category: 'income' },
  { id: 'd2', clientId: 'c1', clientName: 'Marcus Chen', type: '1099-NEC', label: '1099-NEC Consulting Income', status: 'received', uploadedAt: '2026-03-20T10:05:00', category: 'income' },
  { id: 'd3', clientId: 'c1', clientName: 'Marcus Chen', type: 'Schedule C Records', label: 'Business expenses spreadsheet', status: 'received', uploadedAt: '2026-03-22T14:00:00', category: 'business' },
  { id: 'd4', clientId: 'c2', clientName: 'Priya Sharma', type: '1099-NEC', label: '1099-NEC from TikTok', status: 'missing', uploadedAt: null, category: 'income' },
  { id: 'd5', clientId: 'c2', clientName: 'Priya Sharma', type: '1099-NEC', label: '1099-NEC Brand Partnerships', status: 'missing', uploadedAt: null, category: 'income' },
  { id: 'd6', clientId: 'c2', clientName: 'Priya Sharma', type: 'Bank Statements', label: 'Business bank statements', status: 'pending', uploadedAt: null, category: 'income' },
  { id: 'd7', clientId: 'c4', clientName: 'DeShawn Williams', type: 'W-2', label: 'W-2 from employer', status: 'missing', uploadedAt: null, category: 'income' },
  { id: 'd8', clientId: 'c11', clientName: 'David Park', type: 'Payroll Summary', label: '2025 Payroll Summary', status: 'missing', uploadedAt: null, category: 'business' },
  { id: 'd9', clientId: 'c11', clientName: 'David Park', type: 'Equipment List', label: 'Equipment & depreciation schedule', status: 'missing', uploadedAt: null, category: 'business' },
  { id: 'd10', clientId: 'c8', clientName: 'Thomas & Marie DuBois', type: '1099-DA', label: '1099-DA Coinbase', status: 'missing', uploadedAt: null, category: 'income' },
  { id: 'd11', clientId: 'c17', clientName: 'Tyrone Mitchell', type: '1099-K', label: '1099-K from Uber', status: 'missing', uploadedAt: null, category: 'income' },
  { id: 'd12', clientId: 'c17', clientName: 'Tyrone Mitchell', type: 'Mileage Log', label: 'Mileage tracking records', status: 'missing', uploadedAt: null, category: 'deduction' },
]

// ============================================================
// MESSAGES
// ============================================================
export const messages: Message[] = [
  { id: 'm1', clientId: 'c2', clientName: 'Priya Sharma', content: 'Hi Antonio! I have my TikTok 1099 but I\'m not sure how to upload it. Can you help?', sender: 'client', timestamp: '2026-03-27T14:30:00', read: false },
  { id: 'm2', clientId: 'c4', clientName: 'DeShawn Williams', content: 'Sorry I\'ve been busy. Will try to get my W-2 uploaded this weekend.', sender: 'client', timestamp: '2026-03-26T19:00:00', read: true },
  { id: 'm3', clientId: 'c3', clientName: 'James & Sofia Rodriguez', content: 'We\'re ready to sign whenever you are!', sender: 'client', timestamp: '2026-03-28T07:45:00', read: false },
  { id: 'm4', clientId: 'c11', clientName: 'David Park', content: 'Can we push the call to 3pm instead of 2? Got a patient emergency.', sender: 'client', timestamp: '2026-03-28T08:15:00', read: false },
  { id: 'm5', clientId: 'c8', clientName: 'Thomas & Marie DuBois', content: 'I found the Coinbase 1099-DA. Uploading now.', sender: 'client', timestamp: '2026-03-27T20:10:00', read: true },
  { id: 'm6', clientId: 'c12', clientName: 'Jasmine Torres', content: 'Quick question - do I need to report the $200 I made from a one-time logo design?', sender: 'client', timestamp: '2026-03-26T15:00:00', read: true },
  { id: 'm7', clientId: 'c15', clientName: 'Carlos & Elena Mendez', content: 'Elena wants to know if we can deduct the new paint booth equipment we bought in December.', sender: 'client', timestamp: '2026-03-27T18:00:00', read: false },
  { id: 'm8', clientId: 'c1', clientName: 'Marcus Chen', content: 'All 3 restaurant P&Ls have been uploaded. Let me know if you need anything else.', sender: 'client', timestamp: '2026-03-27T14:30:00', read: true },
]

// ============================================================
// APPOINTMENTS
// ============================================================
export const appointments: Appointment[] = [
  { id: 'ap1', clientId: 'c11', clientName: 'David Park', type: 'video', date: '2026-03-28', startTime: '14:00', endTime: '15:00', status: 'confirmed', notes: 'S-Corp return review. Missing 2 docs.' },
  { id: 'ap2', clientId: 'c9', clientName: 'Miguel Sandoval', type: 'phone', date: '2026-03-28', startTime: '16:00', endTime: '16:30', status: 'confirmed', notes: 'Discuss incorporation options.' },
  { id: 'ap3', clientId: 'c13', clientName: 'Vladimir Petrov', type: 'video', date: '2026-03-29', startTime: '10:00', endTime: '11:00', status: 'pending', notes: 'Extension discussion + document collection plan.' },
  { id: 'ap4', clientId: 'c2', clientName: 'Priya Sharma', type: 'phone', date: '2026-03-29', startTime: '13:00', endTime: '13:30', status: 'confirmed', notes: 'Help with missing documents.' },
  { id: 'ap5', clientId: 'c15', clientName: 'Carlos & Elena Mendez', type: 'in_person', date: '2026-03-30', startTime: '09:00', endTime: '10:00', status: 'confirmed', notes: 'Partnership return review.' },
  { id: 'ap6', clientId: 'c1', clientName: 'Marcus Chen', type: 'video', date: '2026-03-30', startTime: '14:00', endTime: '15:00', status: 'confirmed', notes: 'Final review of Schedule C for all 3 locations.' },
  { id: 'ap7', clientId: 'c8', clientName: 'Thomas & Marie DuBois', type: 'phone', date: '2026-03-31', startTime: '11:00', endTime: '11:30', status: 'pending', notes: 'Crypto tax questions.' },
]

// ============================================================
// INVOICES
// ============================================================
export const invoices: Invoice[] = [
  { id: 'inv1', clientId: 'c5', clientName: 'Linda Nakamura', amount: 350, status: 'paid', dueDate: '2026-03-15', paidDate: '2026-03-14', service: 'Individual Return (1040)' },
  { id: 'inv2', clientId: 'c10', clientName: 'Karen O\'Brien', amount: 150, status: 'paid', dueDate: '2026-03-10', paidDate: '2026-03-09', service: 'Basic Return (1040)' },
  { id: 'inv3', clientId: 'c16', clientName: 'Rachel Goldstein', amount: 350, status: 'paid', dueDate: '2026-03-12', paidDate: '2026-03-12', service: 'Individual Return (1040)' },
  { id: 'inv4', clientId: 'c3', clientName: 'James & Sofia Rodriguez', amount: 500, status: 'paid', dueDate: '2026-03-27', paidDate: '2026-03-27', service: 'Premium Return (1040 + Sch E)' },
  { id: 'inv5', clientId: 'c14', clientName: 'Aisha Johnson', amount: 350, status: 'paid', dueDate: '2026-03-28', paidDate: '2026-03-27', service: 'Individual Return (1040 + Sch C)' },
  { id: 'inv6', clientId: 'c6', clientName: 'Roberto Fuentes', amount: 500, status: 'pending', dueDate: '2026-04-01', service: 'Business Return (1120S + 1040)' },
  { id: 'inv7', clientId: 'c1', clientName: 'Marcus Chen', amount: 500, status: 'pending', dueDate: '2026-04-05', service: 'Business Return (Sch C + 1040)' },
  { id: 'inv8', clientId: 'c11', clientName: 'David Park', amount: 500, status: 'pending', dueDate: '2026-04-05', service: 'Business Return (1120S + 1040)' },
  { id: 'inv9', clientId: 'c4', clientName: 'DeShawn Williams', amount: 150, status: 'overdue', dueDate: '2026-03-20', service: 'Basic Return (1040)' },
]

// ============================================================
// REVENUE DATA (monthly for charts)
// ============================================================
export const revenueData = [
  { month: 'Jan', revenue: 3200, clients: 8 },
  { month: 'Feb', revenue: 8500, clients: 22 },
  { month: 'Mar', revenue: 18700, clients: 48 },
  { month: 'Apr', revenue: 28400, clients: 72 },
  { month: 'May', revenue: 4200, clients: 12 },
  { month: 'Jun', revenue: 2100, clients: 6 },
  { month: 'Jul', revenue: 1800, clients: 5 },
  { month: 'Aug', revenue: 1500, clients: 4 },
  { month: 'Sep', revenue: 3800, clients: 10 },
  { month: 'Oct', revenue: 6200, clients: 16 },
  { month: 'Nov', revenue: 2400, clients: 7 },
  { month: 'Dec', revenue: 1900, clients: 5 },
]

// ============================================================
// PIPELINE COUNTS (return stages)
// ============================================================
export const pipelineCounts = {
  new_intake: clients.filter(c => c.returnStage === 'new_intake').length,
  collecting_docs: clients.filter(c => c.returnStage === 'collecting_docs').length,
  ready_to_prep: clients.filter(c => c.returnStage === 'ready_to_prep').length,
  in_preparation: clients.filter(c => c.returnStage === 'in_preparation').length,
  client_review: clients.filter(c => c.returnStage === 'client_review').length,
  pay_and_sign: clients.filter(c => c.returnStage === 'pay_and_sign').length,
  filed: clients.filter(c => c.returnStage === 'filed').length,
}

export const stageLabels: Record<ReturnStage, string> = {
  new_intake: 'New Intake',
  collecting_docs: 'Collecting Docs',
  ready_to_prep: 'Ready to Prep',
  in_preparation: 'In Preparation',
  client_review: 'Client Review',
  pay_and_sign: 'Pay & Sign',
  filed: 'Filed',
}

export const stageColors: Record<ReturnStage, string> = {
  new_intake: 'bg-gray-100 text-text-secondary',
  collecting_docs: 'bg-amber-light text-amber',
  ready_to_prep: 'bg-blue-light text-blue',
  in_preparation: 'bg-blue-light text-blue',
  client_review: 'bg-warm-light text-warm',
  pay_and_sign: 'bg-accent-light text-accent',
  filed: 'bg-accent text-white',
}

export const urgencyColors: Record<UrgencyLevel, string> = {
  urgent: 'bg-red-light text-red',
  high: 'bg-amber-light text-amber',
  normal: 'bg-accent-light text-accent',
  low: 'bg-surface-alt text-text-muted',
}
