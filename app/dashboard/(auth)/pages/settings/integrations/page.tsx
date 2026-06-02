"use client";

/**
 * Integrations settings — the connector grid.
 *
 * Shows every integration in the 2026 CPA stack grouped by category:
 * tax prep, bookkeeping, banking, payroll, documents, e-sign, payments,
 * spend management, calendar, communication, tax research, tax planning,
 * IRS, state agencies, FinCEN BOI, industry POS.
 *
 * Connected ones show a green dot + last-sync timestamp + Configure button.
 * Disconnected ones show a Connect CTA. Both states share the same brand-
 * colored logo badge so the grid is scannable.
 */

import * as React from "react";
import { Check, RefreshCw, Settings2, Unplug } from "lucide-react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-notification";
import {
  CATEGORY_LABEL,
  INTEGRATIONS,
  type Integration,
  type IntegrationCategory,
} from "@/lib/integrations-mock-data";

/** Brand-colored logo badge — same primitive used in the SourceChip. */
function LogoBadge({ integration, size = 40 }: { integration: Integration; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold leading-none"
      style={{
        width: size,
        height: size,
        backgroundColor: integration.brandColor,
        color: integration.brandText ?? "#FFFFFF",
        fontSize: size * 0.42,
      }}
    >
      {integration.name.charAt(0).toUpperCase()}
    </span>
  );
}

function syncedAgo(iso?: string): string | null {
  if (!iso) return null;
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: false });
}

export default function IntegrationsPage() {
  const { showToast } = useToast();
  const [connected, setConnected] = React.useState<Set<string>>(
    new Set(INTEGRATIONS.filter((i) => i.connected).map((i) => i.id))
  );
  const [connecting, setConnecting] = React.useState<string | null>(null);

  const handleConnect = (id: string) => {
    setConnecting(id);
    setTimeout(() => {
      setConnected((prev) => new Set([...prev, id]));
      setConnecting(null);
      const name = INTEGRATIONS.find((i) => i.id === id)?.name ?? id;
      showToast("success", "Connected", `${name} is now syncing.`);
    }, 800);
  };

  const handleDisconnect = (id: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    const name = INTEGRATIONS.find((i) => i.id === id)?.name ?? id;
    showToast("warning", "Disconnected", `${name} sync stopped.`);
  };

  // Group integrations by category for the grid sections.
  const byCategory = React.useMemo(() => {
    const map = new Map<IntegrationCategory, Integration[]>();
    for (const i of INTEGRATIONS) {
      if (!map.has(i.category)) map.set(i.category, []);
      map.get(i.category)!.push(i);
    }
    return Array.from(map.entries()).map(([cat, items]) => ({
      category: cat,
      label: CATEGORY_LABEL[cat],
      items,
    }));
  }, []);

  const connectedCount = connected.size;
  const cardsProducing = INTEGRATIONS.filter((i) => connected.has(i.id) && i.produces_cards).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Petal reads from every connected tool and surfaces only the conflicts.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Connected
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="font-display text-xl font-semibold tabular-nums">{connectedCount}</span>
              <span className="text-[12px] text-muted-foreground">of {INTEGRATIONS.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Producing triage cards
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="font-display text-xl font-semibold tabular-nums">{cardsProducing}</span>
              <span className="text-[12px] text-muted-foreground">sources active</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Last sync
            </div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="font-display text-xl font-semibold tabular-nums">Just now</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category grids */}
      {byCategory.map((section) => (
        <div key={section.category}>
          <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
            <span className="ml-1.5 tabular-nums text-muted-foreground/60">
              ({section.items.filter((i) => connected.has(i.id)).length}/{section.items.length})
            </span>
          </h4>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {section.items.map((intg) => {
              const isConnected = connected.has(intg.id);
              const isConnecting = connecting === intg.id;
              return (
                <Card
                  key={intg.id}
                  className={cn(
                    "transition-colors",
                    isConnected ? "border-emerald-200/60 dark:border-emerald-900/40" : ""
                  )}
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-start gap-3">
                      <LogoBadge integration={intg} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[13.5px] font-semibold">{intg.name}</span>
                          {isConnected && (
                            <Badge
                              variant="outline"
                              className="h-4 border-emerald-200 bg-emerald-50 px-1 text-[9px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                            >
                              <span className="mr-0.5 size-1 rounded-full bg-emerald-500" />
                              Live
                            </Badge>
                          )}
                          {intg.produces_cards && isConnected && (
                            <Badge
                              variant="outline"
                              className="h-4 border-violet-200 bg-violet-50/70 px-1 text-[9px] font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-400"
                              title="Generates triage cards"
                            >
                              Cards
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">
                          {intg.description}
                        </p>
                      </div>
                    </div>

                    {isConnected ? (
                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
                        <span className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
                          <RefreshCw className="size-2.5" />
                          synced {syncedAgo(intg.lastSyncAt)} ago
                        </span>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[10.5px]">
                            <Settings2 className="size-3" />
                            Configure
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 gap-1 px-2 text-[10.5px] text-muted-foreground hover:text-destructive"
                            onClick={() => handleDisconnect(intg.id)}
                          >
                            <Unplug className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 border-t border-border/60 pt-2.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-full text-[11.5px]"
                          disabled={isConnecting}
                          onClick={() => handleConnect(intg.id)}
                        >
                          {isConnecting ? (
                            <>
                              <RefreshCw className="size-3 animate-spin" />
                              Connecting…
                            </>
                          ) : (
                            <>
                              <Check className="size-3" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
