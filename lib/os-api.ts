// Petal OS - API & MCP surface data.
// The firm's OS is readable from anywhere: Claude, Cursor, Raycast, Zapier.
// Reads are open to authorized keys; every WRITE is gated by a skill's trust tier.
// Modeled on Attio Developers + Exa's MCP framing.

import type { IconSvgElement } from "@hugeicons/react";
import { AiMagicIcon, PencilEdit01Icon, FlashIcon, Globe02Icon } from "@hugeicons/core-free-icons";
import { tasks, households, entities, engagements, people, skills } from "@/lib/fixtures/firm";

export const mcpServer = {
  url: "https://mcp.petal.os/v1",
  status: "live" as const,
  protocol: "MCP · 2025-06 spec",
  auth: "OAuth 2.1 + PKCE",
  tools: 7,
};

export interface AccessToken {
  id: string;
  name: string;
  masked: string;
  scope: "Read" | "Read + write";
  created: string;
  lastUsed: string;
  createdBy: string;
}

export const accessTokens: AccessToken[] = [
  { id: "k1", name: "Antonio - Claude Desktop", masked: "ptl_live_••••••••a91f", scope: "Read", created: "Jan 12, 2026", lastUsed: "2 min ago", createdBy: "Antonio Vazquez" },
  { id: "k2", name: "Firm reporting (read-only)", masked: "ptl_live_••••••••7c30", scope: "Read", created: "Feb 3, 2026", lastUsed: "Today", createdBy: "Antonio Vazquez" },
  { id: "k3", name: "Bookkeeping sync", masked: "ptl_live_••••••••4b8e", scope: "Read + write", created: "Mar 20, 2026", lastUsed: "Yesterday", createdBy: "Elena Reyes" },
];

export interface ResourceScope {
  resource: string;
  endpoint: string;
  desc: string;
  count: number;
  /** the write policy - this is where trust tiers govern the API */
  write: string;
}

export const resourceScopes: ResourceScope[] = [
  { resource: "Tasks", endpoint: "/api/os/tasks", desc: "The review queue", count: tasks.length, write: "Approve / snooze - gated by trust tier" },
  { resource: "Clients", endpoint: "/api/os/clients", desc: "Households - the relationship hub", count: households.length, write: "Creates a draft task" },
  { resource: "Entities", endpoint: "/api/os/entities", desc: "Each thing that files", count: entities.length, write: "Creates a draft task" },
  { resource: "Returns", endpoint: "/api/os/returns", desc: "Engagement × tax year", count: engagements.length, write: "Drafts only - never files" },
  { resource: "People", endpoint: "/api/os/people", desc: "Contacts across households", count: people.length, write: "Creates a draft task" },
  { resource: "Knowledge", endpoint: "/api/os/knowledge", desc: "Firm Constitution + reference", count: 6, write: "Requires approval" },
  { resource: "Skills & runs", endpoint: "/api/os/skills", desc: "The skill library and its runs", count: skills.length, write: "Read-only" },
];

export interface ConnectedApp {
  id: string;
  name: string;
  via: "MCP" | "OAuth";
  desc: string;
  scopes: string[];
  connected: string;
  lastActive: string;
  gradient: string;
  glyph: IconSvgElement;
}

export const connectedApps: ConnectedApp[] = [
  { id: "ca1", name: "Claude Desktop", via: "MCP", desc: "Antonio asks Petal about his book over MCP.", scopes: ["Tasks", "Clients", "Returns", "Knowledge"], connected: "Jan 12, 2026", lastActive: "2 min ago", gradient: "from-orange-500 to-amber-500", glyph: AiMagicIcon },
  { id: "ca2", name: "Cursor", via: "MCP", desc: "Reads the firm OS while building internal tooling.", scopes: ["Tasks", "Entities", "Returns"], connected: "Feb 28, 2026", lastActive: "Yesterday", gradient: "from-slate-600 to-slate-800", glyph: PencilEdit01Icon },
  { id: "ca3", name: "Raycast", via: "OAuth", desc: "Quick-look client status from the launcher.", scopes: ["Clients", "Tasks"], connected: "Mar 4, 2026", lastActive: "3d ago", gradient: "from-rose-500 to-red-500", glyph: FlashIcon },
  { id: "ca4", name: "Zapier", via: "OAuth", desc: "Pipes new e-file receipts into the firm Slack.", scopes: ["Tasks (read)"], connected: "Apr 1, 2026", lastActive: "1h ago", gradient: "from-amber-500 to-yellow-500", glyph: Globe02Icon },
];

export interface WebhookSub {
  id: string;
  event: string;
  url: string;
  active: boolean;
}

export const webhooks: WebhookSub[] = [
  { id: "w1", event: "task.created", url: "hooks.vazant.tax/petal", active: true },
  { id: "w2", event: "return.efile.accepted", url: "hooks.vazant.tax/petal", active: true },
  { id: "w3", event: "task.approved", url: "hooks.vazant.tax/petal", active: false },
];
