import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, CircleDashed, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { cn } from "@/lib/utils";

type Deploy = "deployed" | "not-deployed" | "unavailable";
const OPTIONS: [Deploy, string][] = [
  ["deployed", "Deployed"],
  ["not-deployed", "Not deployed"],
  ["unavailable", "Unavailable"],
];

export const Route = createFileRoute("/account-activation")({
  head: () => ({
    meta: [
      { title: "Account activation — Trellis Wallet" },
      {
        name: "description",
        content: "Deployment status of the smart account in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Account activation — Trellis Wallet" },
      {
        property: "og:description",
        content: "Deployment status of the smart account in the Trellis Wallet preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivationPage,
});

function ActivationPage() {
  const { wallets } = useWalletPreview();
  const main = wallets[0];
  const [status, setStatus] = useState<Deploy>("not-deployed");
  const [checking, setChecking] = useState(false);
  const [deposit, setDeposit] = useState(false);
  const [approval, setApproval] = useState(false);
  const check = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      toast.success("Checked again", { description: "Preview only: nothing was read." });
    }, 900);
  };
  const title =
    status === "deployed"
      ? "Smart account deployed"
      : status === "not-deployed"
        ? "Address ready · Contract not deployed"
        : "Deployment status unavailable";
  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to accounts">
            <Link to="/accounts">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Account activation</h1>
        </header>
        <section className="mt-6 rounded-2xl border border-primary/20 bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            {checking ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : status === "deployed" ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <CircleDashed className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <h2 className="text-sm font-semibold">
                {checking ? "Checking the network…" : title}
              </h2>
              <p className="break-all font-mono text-[11px] text-muted-foreground">
                {main?.address}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your backup controls this address. Checking activation does not send a transaction or
            charge a fee.
          </p>
        </section>
        <section className="mt-4 rounded-2xl border bg-card p-4" aria-label="USD8 gas service">
          <h2 className="text-sm font-semibold">USD8 gas service</h2>
          {status === "unavailable" ? (
            <p role="alert" className="mt-2 text-xs text-muted-foreground">
              Service state could not be verified. No payment has been requested.
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">
                This Paymaster charges USD8; it does not itself provide free first-account creation.
              </p>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">USD8 balance</dt>
                    <dd className="font-display tabular-nums">0.00</dd>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {deposit
                      ? "A gas deposit exists. This does not confirm sponsorship or transaction acceptance."
                      : "The gas service has no deposit at this check."}
                  </p>
                </div>
                <div>
                  <dt className="text-muted-foreground">USD8 fee approval</dt>
                  <dd className="mt-1 text-[11px] text-muted-foreground">
                    {approval
                      ? "USD8 approval exists. Its sufficiency must be checked against a transaction quote."
                      : "USD8 fee approval has not been granted to this Paymaster."}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </section>
        <Button variant="outline" className="mt-4 w-full" disabled={checking} onClick={check}>
          <RefreshCw className={checking ? "animate-spin" : undefined} />
          Check again
        </Button>
        <section className="mt-6 space-y-2 rounded-xl border border-dashed border-border px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground">Preview only · deployment status</p>
          <div
            className="inline-flex flex-wrap gap-0.5 rounded-full border border-border/60 bg-secondary/60 p-0.5"
            role="radiogroup"
            aria-label="Preview deployment status"
          >
            {OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={status === value}
                onClick={() => setStatus(value)}
                className={cn(
                  "h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors",
                  status === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={deposit}
              onChange={(e) => setDeposit(e.target.checked)}
            />
            Gas deposit exists
          </label>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={approval}
              onChange={(e) => setApproval(e.target.checked)}
            />
            USD8 fee approval granted
          </label>
        </section>
      </main>
    </div>
  );
}
