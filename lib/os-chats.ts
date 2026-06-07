// Ask Petal conversation history (mock). Drives the sidebar chat zone + Chat history panel.

export interface OsChat {
  id: string;
  title: string;
  when: string;
  group: "Today" | "Yesterday" | "Previous 7 days";
  unread?: boolean;
}

export const chatGroups = ["Today", "Yesterday", "Previous 7 days"] as const;

export const chats: OsChat[] = [
  { id: "c-recon", title: "Reconcile bank activity", when: "4m", group: "Today", unread: true },
  { id: "c-pdf", title: "Edit the Doc Chase skill", when: "31m", group: "Today", unread: true },
  { id: "c-marcus", title: "Why did Marcus Chen's wages drop 40%?", when: "2h", group: "Today" },
  { id: "c-1099", title: "1099-NEC batch — Park Dental contractors", when: "Yesterday", group: "Yesterday" },
  { id: "c-cp2000", title: "Draft CP2000 response — Rodriguez", when: "Yesterday", group: "Yesterday" },
  { id: "c-extension", title: "Form 4868 extension — Mendez Auto", when: "3d", group: "Previous 7 days" },
  { id: "c-safeharbor", title: "Q1 estimates — safe-harbor check", when: "5d", group: "Previous 7 days" },
];
