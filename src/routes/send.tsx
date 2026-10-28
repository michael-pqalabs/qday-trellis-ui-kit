import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ClipboardPaste, ScanLine, BookUser, ArrowUpRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PREVIEW_NETWORK_FEE, getPreviewHolding, shortAddress, validateSend, walletTokens, type SendErrors } from "@/lib/wallet-preview";

type Search = { wallet?: string | undefined; token?: string | undefined };

export const Route = createFileRoute("/send")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    wallet: typeof s["wallet"] === "string" ? s["wallet"] : undefined,
    token: typeof s["token"] === "string" ? s["token"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Send — Trellis Wallet" },
      { name: "description", content: "Send QDAY, sQDAY or USD8 from your Trellis Wallet: recipient, amount, fee review and confirmation." },
      { property: "og:title", content: "Send — Trellis Wallet" },
      { property: "og:description", content: "Enter a recipient and amount, then review fees before sending." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SendPage,
});

function SendPage() {
  const search = Route.useSearch();
  const [tokenId, setTokenId] = useState(search.token ?? "qday");
  const { wallet, network, token, balance } = getPreviewHolding(search.wallet ?? "main", "testnet", tokenId);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<SendErrors>({});
  const [step, setStep] = useState<"form" | "review">("form");
  const insufficient = Number(amount) > Number(balance);

  const paste = async () => {
    try { setRecipient((await navigator.clipboard.readText()).trim()); } catch { /* clipboard blocked */ }
  };
  const review = () => {
    const next = validateSend(recipient, amount);
    setErrors(next);
    if (!next.recipient && !next.amount) setStep("review");
  };

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-6 pb-8 pt-6">
        <header className="flex items-center gap-3">
          {step === "review"
            ? <Button variant="ghost" size="icon" aria-label="Back to edit" onClick={() => setStep("form")}><ArrowLeft /></Button>
            : <Button asChild variant="ghost" size="icon" aria-label="Back to wallet"><Link to="/wallet"><ArrowLeft /></Link></Button>}
          <h1 className="font-display text-xl font-semibold">{step === "form" ? "Send" : "Review transfer"}</h1>
          <span className="ml-auto rounded-full bg-secondary/70 px-3 py-1 text-[11px] text-muted-foreground">{network.name}</span>
        </header>

        {step === "form" ? <>
          <div className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-secondary/70 p-[3px]" role="radiogroup" aria-label="Token">
            {walletTokens.map((t) => (
              <button key={t.id} role="radio" aria-checked={t.id === tokenId} onClick={() => setTokenId(t.id)}
                className={`h-9 rounded-full text-xs font-semibold transition ${t.id === tokenId ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" : "text-muted-foreground hover:text-foreground"}`}>{t.symbol}</button>
            ))}
          </div>

          <section className="mt-6 rounded-2xl border border-primary/15 bg-card bg-card-hero p-5 shadow-card">
            <label htmlFor="amount" className="text-xs text-muted-foreground">Amount</label>
            <div className="mt-1 flex items-baseline gap-2">
              <input id="amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="w-full min-w-0 bg-transparent font-display text-4xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40" />
              <span className="font-display text-sm font-medium text-primary">{token.symbol}</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-divider pt-3 text-xs">
              <span className="text-muted-foreground">Available {balance} {token.symbol}</span>
              <button className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary" onClick={() => setAmount(balance)}>Max</button>
            </div>
            {errors.amount && <p className="mt-2 text-xs text-destructive">{errors.amount}</p>}
            {!errors.amount && insufficient && <p className="mt-2 text-xs text-destructive">Insufficient {token.symbol} balance.</p>}
          </section>

          <section className="mt-5">
            <label htmlFor="recipient" className="mb-2 block text-xs text-muted-foreground">Recipient</label>
            <Input id="recipient" placeholder="0x…" value={recipient} onChange={(e) => setRecipient(e.target.value)} className="font-mono text-xs" />
            {errors.recipient && <p className="mt-2 text-xs text-destructive">{errors.recipient}</p>}
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" size="sm" onClick={paste}><ClipboardPaste />Paste</Button>
              <Button variant="secondary" size="sm" disabled title="Camera scanning isn't available in this preview"><ScanLine />Scan</Button>
              <Button variant="secondary" size="sm" disabled title="Contacts coming soon"><BookUser />Contacts</Button>
            </div>
          </section>

          <p className="mt-6 flex items-center justify-between text-xs text-muted-foreground"><span>From</span><span className="font-medium text-foreground">{wallet.name} · {shortAddress(wallet.address)}</span></p>
          <Button className="mt-auto h-12 w-full" onClick={review}>Review<ArrowUpRight /></Button>
        </> : <>
          <section className="mt-6 rounded-2xl border border-primary/15 bg-card bg-card-hero p-5 text-center shadow-card">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary"><ArrowUpRight /></span>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{amount} <span className="text-base text-primary">{token.symbol}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">to {shortAddress(recipient)}</p>
          </section>
          <dl className="mt-5 divide-y divide-divider rounded-2xl border bg-card text-sm">
            {[
              ["From", `${wallet.name} · ${shortAddress(wallet.address)}`],
              ["To", shortAddress(recipient)],
              ["Network", network.name],
              ["Network fee", `~${PREVIEW_NETWORK_FEE} QDAY`],
            ].map(([k, v]) => <div key={k} className="flex justify-between gap-3 px-4 py-3"><dt className="text-muted-foreground">{k}</dt><dd className="truncate font-medium">{v}</dd></div>)}
          </dl>
          {insufficient && <p className="mt-3 text-xs text-destructive">Insufficient {token.symbol} balance for this amount.</p>}
          <p className="mt-4 flex gap-2 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground"><Info className="h-4 w-4 shrink-0" />Sending is disabled in this preview. A submitted transfer will only count once it's confirmed on-chain.</p>
          <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
            <Button variant="secondary" className="h-12" onClick={() => setStep("form")}>Edit</Button>
            <Button className="h-12" disabled>Confirm & send</Button>
          </div>
        </>}
      </main>
    </div>
  );
}
