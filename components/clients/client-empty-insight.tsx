"use client";

import { useState } from "react";
import { type Client } from "@/lib/mock-data";
import { useAIPanelAsk } from "@/components/ai-panel";
import { Paperclip, Database, Send } from "lucide-react";

/**
 * Empty-state card shown in place of the AI Insight hero when a client has
 * no insight yet (typically: new intakes, fresh clients with no activity
 * or documents for Petal to reason over).
 *
 * Trimmed adaptation of the fullscreen Ask Petal landing — keeps the serif
 * heading + invitation + prompt input, drops the client-matter dropdown,
 * prompts library, integration cards, and recents (all redundant in-context
 * since we're already on a specific client's page).
 *
 * Submit / Enter fires `useAIPanelAsk` which opens the Ask Petal panel with
 * the question pre-filled — the real conversation happens there where
 * there's more room.
 */
export function ClientEmptyInsight({ client }: { client: Client }) {
  const [input, setInput] = useState("");
  let askPetal = (_q: string) => {};
  try {
    askPetal = useAIPanelAsk();
  } catch {
    // useAIPanel not in tree — fall back to no-op (shouldn't happen in app)
  }
  const firstName = client.fullName.split(" ")[0];

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    // Prepend an @-mention so the client context shows in the user's chat bubble
    askPetal(`@${client.fullName} ${q}`);
  };

  return (
    <div className="rounded-xl border bg-card p-8 md:p-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="space-y-2">
          <h2 className="font-display text-2xl tracking-tight md:text-3xl">
            Ask Petal about {firstName}
          </h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Petal needs more data before insights land. Ask anything to get started.
          </p>
        </div>

        {/* Input — same visual style as the fullscreen Ask Petal landing */}
        <div className="w-full rounded-2xl border border-border bg-muted/30 transition-colors focus-within:border-foreground/30 focus-within:bg-muted/50">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Ask anything about ${firstName}...`}
            rows={2}
            className="w-full resize-none bg-transparent px-4 pt-3.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
            <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
              <button className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                <Paperclip size={13} /> Files
              </button>
              <button className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                <Database size={13} /> Sources
              </button>
            </div>
            <button
              onClick={send}
              disabled={!input.trim()}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
