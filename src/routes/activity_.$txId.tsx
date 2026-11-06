import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Check, Copy, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import {
  describeNetwork,
  sampleTransactions,
  txDetail,
  txStatusTone,
  walletTokens,
} from "@/lib/wallet-preview";

export const Route = createFileRoute("/activity_/$txId")({
  head: () => ({
    meta: [
      { title: "Transaction — Trellis Wallet" },
      {
        name: "description",
        content: "Details of a sample transfer in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Transaction — Trellis Wallet" },
      { property: "og:description", content: "Sample transfer details for layout review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityDetailPage,
});

function ActivityDetailPage() {
  const { txId } = Route.useParams();
  const router = useRouter();
  const { wallets, networkId } = useWalletPreview();
  const [copied, setCopied] = useState("");
  const tx = sampleTransactions.find((t) => t.id === txId);
  const token = tx ? walletTokens.find((t) => t.id === tx.tokenId) : undefined;
  const back = (
    <Button asChild variant="ghost" size="icon" aria-label="Back to activity">
      <Link to="/activity" search={{ wallet: tx?.walletId }}>
        <ArrowLeft />
      </Link>
    </Button>
  );
  if (!tx || !token)
    return (
      <div className="flex min-h-screen justify-center bg-background">
        <main className="flex w-full max-w-md flex-col px-5 pt-6">
          <header className="flex items-center gap-3">
            {back}
            <h1 className="font-display text-xl font-semibold">Transaction</h1>
          </header>
          <div role="status" className="py-16 text-center">
            <p className="text-sm font-medium">This entry is unavailable</p>
            <p className="mt-1 text-xs text-muted-foreground">Return to activity and refresh.</p>
          </div>
        </main>
      </div>
    );
  const detail = txDetail(tx);
  const wallet = wallets.find((w) => w.id === tx.walletId) ?? wallets[0];
  const sent = tx.kind === "send";
  const failed = tx.status === "failed";
  const sign = tx.status !== "confirmed" ? "" : sent ? "−" : "+";
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy. Select the value manually.");
    }
  };
  const rows: { label: string; value: string; copy?: boolean }[] = [
    { label: "From", value: sent ? (wallet?.address ?? "") : tx.counterparty, copy: true },
    { label: "To", value: sent ? tx.counterparty : (wallet?.address ?? ""), copy: true },
    {
      label: "Time",
      value: new Date(detail.at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
    { label: "Network", value: describeNetwork(networkId).label },
    { label: "Transaction ID", value: detail.hash, copy: true },
    { label: "Block", value: tx.status === "pending" ? "—" : String(detail.block) },
  ];
  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          {back}
          <h1 className="font-display text-xl font-semibold">Transaction</h1>
        </header>
        <section className="mt-6 flex flex-col items-center text-center">
          <span
            className={`grid h-14 w-14 place-items-center rounded-full ${
              failed
                ? "bg-destructive/10 text-destructive"
                : sent
                  ? "bg-primary/10 text-primary"
                  : "bg-success/10 text-success"
            }`}
          >
            {failed ? (
              <X className="h-6 w-6" />
            ) : sent ? (
              <ArrowUpRight className="h-6 w-6" />
            ) : (
              <ArrowDownLeft className="h-6 w-6" />
            )}
          </span>
          <p className="mt-3 text-sm text-muted-foreground">{sent ? "Sent" : "Received"}</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {sign}
            {tx.amount} <span className="text-base text-muted-foreground">{token.symbol}</span>
          </p>
          <p className={`mt-1 text-xs font-medium ${txStatusTone(tx.status)}`}>
            {failed
              ? "Failed"
              : tx.status === "pending"
                ? sent
                  ? "Sending"
                  : "Receiving"
                : "Completed"}
          </p>
        </section>
        {failed && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Reason: the network did not accept this transfer (sample reason). The amount was not
            transferred, and network fees may still apply.
          </p>
        )}
        {tx.status === "pending" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            This transfer is still being confirmed. This screen would update automatically.
          </p>
        )}
        <dl className="mt-6 rounded-2xl border bg-card px-4 py-1">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 border-b border-divider py-3 last:border-b-0"
            >
              <dt className="shrink-0 text-xs text-muted-foreground">{row.label}</dt>
              <dd className="flex min-w-0 items-start gap-1.5 text-right text-sm">
                <span className="min-w-0 break-all">{row.value}</span>
                {row.copy && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-my-1.5 h-8 w-8 shrink-0"
                    aria-label={`Copy ${row.label}`}
                    onClick={() => copy(row.label, row.value)}
                  >
                    {copied === row.label ? <Check /> : <Copy />}
                  </Button>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <Button
          variant="outline"
          className="mt-5 w-full"
          onClick={() =>
            toast.info("Preview only", { description: "No block explorer is opened." })
          }
        >
          <ExternalLink />
          View on explorer
        </Button>
        <Button className="mt-3 w-full" onClick={() => router.history.back()}>
          Done
        </Button>
        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          {detail.explorerNote} Sample history for layout review.
        </p>
      </main>
    </div>
  );
}
