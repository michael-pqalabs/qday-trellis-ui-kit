import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, History, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionRow } from "@/components/transaction-row";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import {
  chainForNetwork,
  describeNetwork,
  transactionsFor,
  txGroupLabel,
} from "@/lib/wallet-preview";

type Search = { wallet?: string | undefined };
type Filter = "all" | "received" | "sent";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "received", label: "Received" },
  { id: "sent", label: "Sent" },
];
const GROUPS = ["Today", "Yesterday", "Earlier"] as const;

export const Route = createFileRoute("/activity")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    wallet: typeof s["wallet"] === "string" ? s["wallet"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Activity — Trellis Wallet" },
      {
        name: "description",
        content: "Sample transaction history for layout review in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Activity — Trellis Wallet" },
      {
        property: "og:description",
        content: "Sent and received transfers, grouped by day, with their status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const search = Route.useSearch();
  const { wallets, networkId } = useWalletPreview();
  const wallet = wallets.find((w) => w.id === search.wallet) ?? wallets[0];
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const all = wallet ? transactionsFor(wallet.id, chainForNetwork(networkId).id) : [];
  const shown = all.filter(
    (tx) =>
      filter === "all" || (filter === "received" ? tx.kind === "receive" : tx.kind === "send"),
  );
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Activity is up to date", {
        description: "Preview only: nothing was fetched.",
      });
    }, 800);
  };
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to wallet">
            <Link to="/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Activity</h1>
          <span className="ml-auto rounded-full bg-secondary/70 px-3 py-1 text-[11px] text-muted-foreground">
            {describeNetwork(networkId).label}
          </span>
        </header>
        <div className="mt-5 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">{wallet?.name}</p>
          <Button variant="ghost" size="sm" disabled={refreshing} onClick={refresh}>
            <RefreshCw className={refreshing ? "animate-spin" : undefined} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="mt-2">
          <TabsList className="w-full" aria-label="Filter activity">
            {FILTERS.map((f) => (
              <TabsTrigger key={f.id} value={f.id} className="flex-1">
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {shown.length === 0 ? (
          <div role="status" className="flex flex-col items-center py-16 text-center">
            <History className="mb-3 h-7 w-7 text-muted-foreground/50" />
            <p className="text-sm font-medium">
              {all.length === 0
                ? "No activity yet"
                : filter === "sent"
                  ? "No outgoing transfers"
                  : "No incoming transfers"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              New transfers may take a moment to appear.
            </p>
          </div>
        ) : (
          GROUPS.map((group) => {
            const rows = shown.filter((tx) => txGroupLabel(tx.minutesAgo) === group);
            if (!rows.length) return null;
            return (
              <section key={group} className="mt-6" aria-label={group}>
                <h2 className="text-xs font-semibold text-muted-foreground">
                  {group} <span className="font-normal">· {rows.length}</span>
                </h2>
                <ul className="mt-1 divide-y divide-divider">
                  {rows.map((tx, index) => (
                    <TransactionRow key={tx.id} tx={tx} index={index} />
                  ))}
                </ul>
              </section>
            );
          })
        )}
        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          Sample history for layout review · not on-chain records
        </p>
      </main>
    </div>
  );
}
