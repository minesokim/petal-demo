export const notifications = [
  {
    id: 1,
    title: "Priya Sharma uploaded a document",
    desc: "1099-NEC from TikTok has been uploaded to her portal.",
    avatar: "",
    status: "online",
    unread_message: true,
    type: "text",
    date: "10 min ago"
  },
  {
    id: 2,
    title: "David Park rescheduled",
    desc: "Moved review call from 2:00 PM to 3:00 PM today.",
    avatar: "",
    status: "online",
    unread_message: true,
    type: "text",
    date: "25 min ago"
  },
  {
    id: 3,
    title: "James & Sofia Rodriguez",
    desc: "Signed Form 8879. Return ready to file.",
    avatar: "",
    status: "online",
    unread_message: true,
    type: "text",
    date: "1 hour ago"
  },
  {
    id: 4,
    title: "Payment received",
    desc: "Aisha Johnson paid $350 via Stripe. Invoice #INV-005 marked paid.",
    avatar: "",
    status: "online",
    unread_message: false,
    type: "text",
    date: "2 hours ago"
  },
  {
    id: 5,
    title: "Stale client alert",
    desc: "Tyrone Mitchell hasn't logged in for 9 days. Last activity: Mar 19.",
    avatar: "",
    status: "busy",
    unread_message: true,
    type: "text",
    date: "This morning"
  },
  {
    id: 6,
    title: "New message from Carlos Mendez",
    desc: "Elena wants to know if we can deduct the new paint booth equipment.",
    avatar: "",
    status: "online",
    unread_message: false,
    type: "text",
    date: "Yesterday"
  },
  {
    id: 7,
    title: "Extension reminder",
    desc: "Vladimir Petrov likely needs an extension. 0 of 16 docs submitted.",
    avatar: "",
    status: "busy",
    unread_message: false,
    type: "text",
    date: "Yesterday"
  }
];

export type Notification = (typeof notifications)[number];
