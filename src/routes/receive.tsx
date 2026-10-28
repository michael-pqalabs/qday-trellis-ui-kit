import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Check, Copy, Share2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPreviewHolding, walletTokens } from "@/lib/wallet-preview";

type Search = { wallet?: string | undefined; token?: string | undefined };

export const Route = createFileRoute("/receive")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    wallet: typeof s["wallet"] === "string" ? s["wallet"] : undefined,
    token: typeof s["token"] === "string" ? s["token"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Receive — Trellis Wallet" },
      { name: "description", content: "Show your Main Wallet receiving address and QR code in Trellis Wallet." },
      { property: "og:title", content: "Receive — Trellis Wallet" },
      { property: "og:description", content: "Share your Main Wallet address or QR code to receive tokens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceivePage,
});

function ReceivePage() {
  const search = Route.useSearch();
  const [tokenId, setTokenId] = useState(search.token ?? "qday");
  const [copied, setCopied] = useState(false);
  const { wallet, network, token } = getPreviewHolding(search.wallet ?? "main", "testnet", tokenId);

  const copy = async () => {
    try { await navigator.clipboard.writeText(wallet.address); setCopied(true); toast.success("Address copied"); }
    catch { toast.error("Couldn't copy. Select the address manually."); }
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ text: wallet.address }); } catch { /* cancelled */ } }
    else copy();
  };

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-6 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to wallet"><Link to="/wallet"><ArrowLeft /></Link></Button>
          <h1 className="font-display text-xl font-semibold">Receive</h1>
          <span className="ml-auto rounded-full bg-secondary/70 px-3 py-1 text-[11px] text-muted-foreground">{network.name}</span>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-secondary/70 p-[3px]" role="radiogroup" aria-label="Token">
          {walletTokens.map((t) => (
            <button key={t.id} role="radio" aria-checked={t.id === tokenId} onClick={() => setTokenId(t.id)}
              className={`h-9 rounded-full text-xs font-semibold transition ${t.id === tokenId ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-muted-foreground hover:text-foreground"}`}>{t.symbol}</button>
          ))}
        </div>

        <section className="mt-6 flex flex-col items-center rounded-3xl border border-primary/15 bg-card bg-card-hero p-6 shadow-card">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">Main Wallet · {wallet.name}</span>
          <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
            <QRCodeSVG value={`trellis-preview:${wallet.address}`} size={196} fgColor="#101218" bgColor="#ffffff" level="M" aria-label="Wallet address QR code" />
          </div>
          <p className="mt-5 text-xs text-muted-foreground">Your {token.symbol} address</p>
          <p className="mt-1 break-all text-center font-mono text-xs leading-5" data-testid="receive-address">{wallet.address}</p>
          <div className="mt-5 grid w-full grid-cols-2 gap-3">
            <Button onClick={copy}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</Button>
            <Button variant="secondary" onClick={share}><Share2 />Share</Button>
          </div>
        </section>

        <p className="mt-5 flex gap-2 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground"><Info className="h-4 w-4 shrink-0" />Only send {token.symbol} on {network.name} to this address. This is your Main Wallet — QPass accounts have their own separate addresses. Preview address: don't send real funds.</p>
      </main>
    </div>
  );
}
