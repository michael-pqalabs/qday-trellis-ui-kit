import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Droplets, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { cn } from "@/lib/utils";

const DAY = 86400000;
type Outcome = "received" | "unconfirmed";

export const Route = createFileRoute("/faucet")({
  head: () => ({
    meta: [
      { title: "Faucet — Trellis Wallet" },
      { name: "description", content: "Preview of the testnet faucet for test tokens." },
      { property: "og:title", content: "Faucet — Trellis Wallet" },
      { property: "og:description", content: "Claim test tokens on testnet. Preview only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaucetPage,
});

const countdown = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s % 60).padStart(2, "0")}s`;
};

function FaucetPage() {
  const { wallets } = useWalletPreview();
  const main = wallets[0];
  const [now, setNow] = useState(0);
  const [nextAt, setNextAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("received");
  const [result, setResult] = useState<"received" | "unconfirmed" | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const waiting = nextAt !== null && nextAt > now;
  const claim = () => {
    setBusy(true);
    setResult(null);
    setTimeout(() => {
      setBusy(false);
      if (outcome === "received") {
        setNextAt(Date.now() + DAY);
        setResult("received");
        toast.success("1 tUSD8 received", { description: "Preview only: nothing was sent." });
      } else setResult("unconfirmed");
    }, 1400);
  };
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to settings">
            <Link to="/settings">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Faucet</h1>
          <span className="ml-auto rounded-full bg-secondary/70 px-3 py-1 text-[11px] text-muted-foreground">
            Testnet only
          </span>
        </header>
        <section className="mt-6 rounded-2xl border bg-card p-4" aria-label="tUSD8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <Droplets className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">tUSD8</h2>
              <p className="text-xs text-muted-foreground">
                Receive 1 tUSD8 every 24 hours. No gas required.
              </p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-divider pb-2">
              <dt className="text-muted-foreground">To</dt>
              <dd className="font-medium">{main?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-divider pb-2">
              <dt className="text-muted-foreground">Next claim</dt>
              <dd className="font-medium tabular-nums">
                {waiting ? countdown(nextAt - now) : "Available now"}
              </dd>
            </div>
          </dl>
          {result === "received" && (
            <p role="status" className="mt-3 text-xs text-success">
              1 tUSD8 received. Sample transaction 0x7c1e…a9d2.
            </p>
          )}
          {result === "unconfirmed" && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              Could not confirm the result. Refresh status before trying again.
            </p>
          )}
          <Button className="mt-4 w-full" disabled={busy || waiting} onClick={claim}>
            {busy ? (
              <>
                <Loader2 className="animate-spin" />
                Processing…
              </>
            ) : (
              "Claim 1 tUSD8"
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            disabled={busy}
            onClick={() => {
              setResult(null);
              toast.info("Status refreshed", { description: "Preview only." });
            }}
          >
            <RefreshCw />
            Refresh status
          </Button>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2">
            <span className="text-[10px] leading-tight text-muted-foreground">
              Preview only
              <br />
              Claim result
            </span>
            <div
              className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-0.5"
              role="radiogroup"
              aria-label="Preview claim result"
            >
              {(
                [
                  ["received", "Received"],
                  ["unconfirmed", "Unconfirmed"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={outcome === value}
                  disabled={busy}
                  onClick={() => setOutcome(value)}
                  className={cn(
                    "h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors",
                    outcome === value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="mt-4 rounded-2xl border bg-card p-4" aria-label="QDAY">
          <h2 className="text-sm font-semibold">QDAY</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            QDAY test tokens come from a separate faucet site.
          </p>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() =>
              toast.info("Preview only", { description: "The QDAY faucet is not opened." })
            }
          >
            <ExternalLink />
            Open QDAY Faucet
          </Button>
        </section>
      </main>
    </div>
  );
}
