import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionRow } from "@/components/transaction-row";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { transactionsFor, walletTokens } from "@/lib/wallet-preview";

export const Route = createFileRoute("/asset/$tokenId")({
  head: () => ({
    meta: [
      { title: "Asset — Trellis Wallet" },
      { name: "description", content: "Balance and recent activity for one token in the preview." },
      { property: "og:title", content: "Asset — Trellis Wallet" },
      { property: "og:description", content: "Token balance, send, receive and recent activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssetPage,
});

function AssetPage() {
  const { tokenId } = Route.useParams();
  const { wallets } = useWalletPreview();
  const token = walletTokens.find((t) => t.id === tokenId);
  const wallet = wallets[0];
  const recent = wallet
    ? transactionsFor(wallet.id)
        .filter((tx) => tx.tokenId === tokenId)
        .slice(0, 3)
    : [];
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to wallet">
            <Link to="/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">{token?.symbol ?? "Asset"}</h1>
        </header>
        {!token ? (
          <div role="status" className="py-16 text-center">
            <p className="text-sm font-medium">Unsupported token</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/wallet">Go to wallet</Link>
            </Button>
          </div>
        ) : (
          <>
            <section className="mt-6 flex flex-col items-center rounded-3xl border border-primary/15 bg-card bg-card-hero p-6 text-center shadow-card">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 font-display text-xl font-semibold text-primary">
                {token.mark}
              </span>
              <p className="mt-3 text-xs text-muted-foreground">{token.detail}</p>
              <p className="mt-1 font-display text-4xl font-semibold tabular-nums">0.00</p>
              <div className="mt-5 grid w-full grid-cols-2 gap-3">
                <Button asChild>
                  <Link to="/send" search={{ token: token.id, wallet: wallet?.id }}>
                    <ArrowUpRight />
                    Send
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/receive" search={{ token: token.id, wallet: wallet?.id }}>
                    <ArrowDownLeft />
                    Receive
                  </Link>
                </Button>
              </div>
            </section>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Demo balance. Nothing is read from the network.
            </p>
            <section className="mt-6" aria-labelledby="recent-title">
              <div className="flex items-center justify-between">
                <h2 id="recent-title" className="font-display text-lg font-semibold">
                  Recent activity
                </h2>
                <Link
                  to="/activity"
                  search={{ wallet: wallet?.id }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <div role="status" className="flex flex-col items-center py-8 text-center">
                  <History className="mb-2 h-6 w-6 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">No recent transfers to display.</p>
                </div>
              ) : (
                <ul className="mt-1 divide-y divide-divider">
                  {recent.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </ul>
              )}
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Sample history for layout review · not on-chain records
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
