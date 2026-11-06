import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Eye, ExternalLink, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { shortAddress, walletTokens } from "@/lib/wallet-preview";
import { cn } from "@/lib/utils";

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const ZERO = /^0x0{40}$/;

export const Route = createFileRoute("/watch-address")({
  head: () => ({
    meta: [
      { title: "Watch address — Trellis Wallet" },
      {
        name: "description",
        content: "Read-only view of a public address in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Watch address — Trellis Wallet" },
      {
        property: "og:description",
        content: "Read-only view of a public address in the Trellis Wallet preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchAddressPage,
});

function WatchAddressPage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [watched, setWatched] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [readFails, setReadFails] = useState(false);
  const [failed, setFailed] = useState(false);
  const [block, setBlock] = useState(1_204_118);
  const read = (address: string) => {
    setLoading(true);
    setFailed(false);
    setTimeout(() => {
      setLoading(false);
      if (readFails) setFailed(true);
      else setBlock((b) => b + 1);
    }, 1000);
  };
  const submit = () => {
    const address = input.trim();
    if (!ADDRESS.test(address) || ZERO.test(address)) {
      setError("Enter a valid nonzero address. Check mixed-case checksum.");
      return;
    }
    setError("");
    setWatched(address);
    read(address);
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
          <h1 className="font-display text-xl font-semibold">Your assets on Aevum</h1>
        </header>
        <p className="mt-4 text-xs text-muted-foreground">
          Enter a public address to read testnet balances. This does not import a wallet or grant
          signing access.
        </p>
        <section className="mt-5 space-y-3 rounded-2xl border bg-card p-4">
          <Label htmlFor="w-address" className="block">
            Public address
          </Label>
          <Input
            id="w-address"
            placeholder="0x…"
            value={input}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
          />
          {error && (
            <p role="alert" className="text-[11px] text-destructive">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={loading} onClick={submit}>
            <Eye />
            Read testnet balances
          </Button>
        </section>
        {watched ? (
          <section className="mt-4 rounded-2xl border bg-card p-4" aria-label="Read-only address">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Read-only address</p>
                <p className="truncate font-mono text-sm">{shortAddress(watched)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Clear address"
                onClick={() => {
                  setWatched(null);
                  setInput("");
                  setFailed(false);
                }}
              >
                <X />
                Clear address
              </Button>
            </div>
            {loading ? (
              <p
                role="status"
                className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Reading from Aevum…
              </p>
            ) : (
              <>
                {failed && (
                  <p role="alert" className="mt-3 text-xs text-destructive">
                    Could not verify balances. Check your connection and retry. Any amounts below
                    are from the last successful read.
                  </p>
                )}
                <ul className="mt-3 divide-y divide-divider">
                  {walletTokens.map((t) => (
                    <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="font-medium">{t.symbol}</span>
                      <span className="font-display tabular-nums">{failed ? "—" : "0.00"}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {failed ? "Balances not available yet" : `Block ${block}`}
                </p>
                <div className="mt-3 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => read(watched)}>
                    <RefreshCw />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      toast.info("Preview only", { description: "No block explorer is opened." })
                    }
                  >
                    <ExternalLink />
                    View on explorer
                  </Button>
                </div>
              </>
            )}
          </section>
        ) : (
          <p className="mt-6 text-center text-xs text-muted-foreground">
            No address selected. No sample balances are displayed.
          </p>
        )}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2">
          <span className="text-[10px] leading-tight text-muted-foreground">
            Preview only
            <br />
            Balance read
          </span>
          <div
            className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-0.5"
            role="radiogroup"
            aria-label="Preview balance read"
          >
            {(
              [
                [false, "Succeeds"],
                [true, "Fails"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={readFails === value}
                onClick={() => setReadFails(value)}
                className={cn(
                  "h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors",
                  readFails === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Preview only · demo balances, nothing is read from the network
        </p>
      </main>
    </div>
  );
}
