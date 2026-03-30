import { feedActions } from "@/lib/actions-mock-data";

export type ChatMessage = {
  id: string;
  sender: "client" | "preparer" | "system";
  content: string;
  time: string;
  attachment?: { name: string; size: string; type: string };
  systemCard?: { type: string; title: string; description: string; action?: string };
};

// Single source of truth for all message threads
export const threads: Record<string, ChatMessage[]> = {
  c2: [
    { id: "1", sender: "client", content: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it. Can you help?", time: "2:30 PM" },
    { id: "3", sender: "preparer", content: "Hey Priya! The easiest way is to log into your portal and go to the Docs tab. There's an upload button right at the top. You can take a photo of the 1099 with your phone too - we'll extract the data automatically.", time: "2:45 PM" },
    { id: "4", sender: "client", content: "Oh perfect! I'll do that now. Also, do I need to report the $500 I made from a one-time sponsored post?", time: "2:52 PM" },
    { id: "5", sender: "preparer", content: "Yes, all income needs to be reported even if you don't receive a 1099 for it. We'll include it on your Schedule C.", time: "3:10 PM" },
    { id: "6", sender: "client", content: "Got it! When will my return be ready?", time: "3:15 PM" },
    { id: "7", sender: "system", content: "", time: "3:15 PM", systemCard: { type: "status", title: "Return Status", description: "Your return is in the document collection phase. 3 of 7 documents received. Once complete, preparation takes 3-5 business days.", action: "View Status" } },
    { id: "7n", sender: "system", content: "Antonio will follow up personally.", time: "3:15 PM" },
    { id: "8", sender: "client", content: "Thanks Antonio!", time: "3:20 PM" },
  ],
  c3: [
    { id: "1", sender: "client", content: "Hi Antonio, just wanted to check in. Are our returns done?", time: "Mar 25" },
    { id: "2", sender: "preparer", content: "Hi James! Yes, your returns are complete. I just need you and Sofia to sign Form 8879 to authorize e-filing.", time: "Mar 26" },
    { id: "3", sender: "client", content: "We're ready to sign whenever you are!", time: "7:45 AM" },
    { id: "4", sender: "system", content: "", time: "7:45 AM", systemCard: { type: "signature", title: "E-Signature Ready", description: "Form 8879 is ready for signature. Both James and Sofia need to sign.", action: "Sign Now" } },
  ],
  c4: [
    { id: "1", sender: "preparer", content: "Hi DeShawn! Welcome to Vazant Consulting. I've sent your intake form - just follow the link to get started.", time: "Mar 18" },
    { id: "2", sender: "client", content: "Thanks! I'll try to get to it this weekend.", time: "Mar 20" },
    { id: "3", sender: "preparer", content: "No problem! We still need your W-2 and the $150 deposit to start. April 15 is coming up.", time: "Mar 22" },
    { id: "4", sender: "client", content: "Sorry I've been busy. Will try to get my W-2 uploaded this weekend.", time: "Mar 26" },
    { id: "5", sender: "system", content: "", time: "Mar 26", systemCard: { type: "payment", title: "Deposit Required", description: "$150 deposit required to begin preparing your return.", action: "Pay Now" } },
  ],
  c11: [
    { id: "1", sender: "preparer", content: "David, your S-Corp return is coming along. I have questions about the payroll summary and new equipment. Can we schedule a call?", time: "Mar 25" },
    { id: "2", sender: "client", content: "Sure! How about Thursday at 2pm?", time: "Mar 26" },
    { id: "3", sender: "preparer", content: "Thursday at 2pm works. I'll send over a Google Meet link.", time: "Mar 26" },
    { id: "4", sender: "client", content: "Can we push the call to 3pm instead of 2? Got a patient emergency.", time: "8:15 AM" },
    { id: "5", sender: "preparer", content: "Of course. Moved to 3pm. Hope everything is okay!", time: "8:30 AM" },
  ],
  c15: [
    { id: "1", sender: "client", content: "Elena wants to know if we can deduct the new paint booth equipment we bought in December.", time: "Mar 27" },
    { id: "2", sender: "preparer", content: "Great question! Yes, the paint booth likely qualifies for Section 179 immediate expensing. Full deduction in 2025 instead of 7-year depreciation. How much was it?", time: "Mar 27" },
    { id: "3", sender: "client", content: "It was about $32,000. That would be a big deduction!", time: "Mar 27" },
    { id: "4", sender: "preparer", content: "Significant deduction. I'll include it as Section 179. Should save roughly $8,200 in taxes. Numbers ready for our review Monday.", time: "Mar 27" },
  ],
  c1: [
    { id: "1", sender: "client", content: "All 3 restaurant P&Ls have been uploaded. Let me know if you need anything else.", time: "Mar 27" },
    { id: "2", sender: "preparer", content: "Got them, thanks Marcus! I'll review everything and we'll go over it in our call on the 30th.", time: "Mar 27" },
  ],
  c12: [
    { id: "1", sender: "client", content: "Quick question - do I need to report the $200 I made from a one-time logo design?", time: "Mar 26" },
    { id: "2", sender: "preparer", content: "Yes, all income should be reported regardless of amount. We'll include it on your Schedule C with your other freelance income.", time: "Mar 26" },
  ],
  // Clients with AI drafts but no prior conversation
  c7: [
    { id: "1", sender: "system", content: "New client. Intake form sent 2 days ago \u2014 no portal login yet.", time: "Mar 26" },
  ],
  c13: [
    { id: "1", sender: "system", content: "New client. 0 of 16 documents submitted. No portal login. Extension likely.", time: "Mar 20" },
  ],
  c17: [
    { id: "1", sender: "system", content: "Last activity 9 days ago. 2 of 5 documents submitted.", time: "Mar 19" },
  ],
};

// Get AI draft suggestions for a client
export function getClientDrafts(clientId: string) {
  return feedActions.filter(
    a => a.clientId === clientId && a.aiDraft && !a.isResolved
  );
}

// Get thread for a client (returns empty array if none)
export function getThread(clientId: string): ChatMessage[] {
  return threads[clientId] || [];
}
