import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TokenMark } from "@/components/token-mark";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, ClipboardPaste, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { checkRecipient } from "@/lib/eth-address";
import { cn } from "@/lib/utils";
import {
  chainForNetwork,
  feeTokenFor,
  nativeTokenId,
  tokensForNetwork,
  PREVIEW_NETWORK_FEE,
  formatAmount,
  getPreviewHolding,
  previewSampleBalances,
  shortAddress,
  zeroBalance,
} from "@/lib/wallet-preview";

type Search = {
  wallet?: string | undefined;
  token?: string | undefined;
  network?: string | undefined;
};

export const Route = createFileRoute("/send")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    wallet: typeof s["wallet"] === "string" ? s["wallet"] : undefined,
    token: typeof s["token"] === "string" ? s["token"] : undefined,
    network: typeof s["network"] === "string" ? s["network"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Send — Trellis Wallet" },
      {
        name: "description",
        content:
          "Send QDAY or USD8 from your Trellis Wallet: recipient, amount, fee review and confirmation.",
      },
      { property: "og:title", content: "Send — Trellis Wallet" },
      {
        property: "og:description",
        content: "Enter a recipient and amount, then review fees before sending.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SendPage,
});

/** Keeps digits and a single decimal point. */
const cleanAmount = (value: string) => {
  const kept = value.replace(/[^0-9.]/g, "");
  const dot = kept.indexOf(".");
  return dot === -1 ? kept : kept.slice(0, dot + 1) + kept.slice(dot + 1).replace(/\./g, "");
};
const plain = (value: number) => String(Number(value.toFixed(2)));

function SendPage() {
  const search = Route.useSearch();
  const { wallets, importedTokens, networkId: activeNetworkId } = useWalletPreview();
  const networkId = search.network ?? activeNetworkId;
  const chainId = chainForNetwork(networkId).id;
  const PREVIEW_FEE_TOKEN = feeTokenFor(chainId);
  const [tokenId, setTokenId] = useState(search.token ?? nativeTokenId(chainId));
  const [sampleBalance, setSampleBalance] = useState(false);
  const { wallet, network } = getPreviewHolding(
    search.wallet ?? "main",
    networkId,
    tokenId,
    wallets,
  );
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "review">("form");

  // Default tokens plus the ones imported for this network. Imported tokens never read a contract,
  // so their balance is always zero.
  const tokens = [
    ...tokensForNetwork(networkId).map((t) => ({
      id: t.id as string,
      symbol: t.symbol as string,
      name: t.detail as string,
      mark: t.mark as string,
      balance: sampleBalance ? (previewSampleBalances[t.id] ?? 0) : 0,
      zeroText: "0.00",
    })),
    ...importedTokens
      .filter((t) => t.networkId === networkId)
      .map((t) => ({
        id: t.id,
        symbol: t.symbol,
        name: t.name ?? "Imported token",
        mark: t.symbol.charAt(0),
        balance: 0,
        zeroText: zeroBalance(t.decimals),
      })),
  ];
  const token = tokens.find((t) => t.id === tokenId) ?? tokens[0]!;
  const balanceText = (t: (typeof tokens)[number]) =>
    t.balance === 0 ? t.zeroText : formatAmount(t.balance);

  // The fee is paid in the stablecoin, so sending it has to cover amount and fee together.
  const feeIsToken = token.symbol === PREVIEW_FEE_TOKEN;
  const feeBalance = tokens.find((t) => t.symbol === PREVIEW_FEE_TOKEN)?.balance ?? 0;
  const amountNum = Number(amount);
  const amountValid = amount !== "" && Number.isFinite(amountNum) && amountNum > 0;
  const recipientCheck = checkRecipient(recipient);
  let balanceError: string | undefined;
  if (amountValid) {
    if (feeIsToken ? amountNum + PREVIEW_NETWORK_FEE > token.balance : amountNum > token.balance)
      balanceError = feeIsToken
        ? `Insufficient ${token.symbol} balance for the amount and the network fee.`
        : `Insufficient ${token.symbol} balance.`;
    else if (!feeIsToken && feeBalance < PREVIEW_NETWORK_FEE)
      balanceError = `Not enough ${PREVIEW_FEE_TOKEN} to pay the network fee.`;
  }
  const amountError =
    amount !== "" && !amountValid ? "Enter an amount greater than 0." : balanceError;
  const canReview = recipientCheck.state === "valid" && amountValid && !balanceError;
  const maxAmount = Math.max(0, feeIsToken ? token.balance - PREVIEW_NETWORK_FEE : token.balance);
  const tokenAfter =
    token.balance - (amountValid ? amountNum : 0) - (feeIsToken ? PREVIEW_NETWORK_FEE : 0);
  const feeAfter = feeBalance - (feeIsToken ? 0 : PREVIEW_NETWORK_FEE);

  const paste = async () => {
    try {
      setRecipient((await navigator.clipboard.readText()).trim());
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          {step === "review" ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to edit"
              onClick={() => setStep("form")}
            >
              <ArrowLeft />
            </Button>
          ) : (
            <Button asChild variant="ghost" size="icon" aria-label="Back to wallet">
              <Link to="/wallet">
                <ArrowLeft />
              </Link>
            </Button>
          )}
          <h1 className="font-display text-xl font-semibold">
            {step === "form" ? "Send" : "Review transfer"}
          </h1>
          <span className="ml-auto rounded-full bg-secondary/70 px-3 py-1 text-[11px] text-muted-foreground">
            {network.name}
          </span>
        </header>

        {step === "form" ? (
          <>
            <div className="mt-6">
              <Label htmlFor="from" className="mb-2 block">
                From
              </Label>
              <Input
                id="from"
                value={`${wallet.name} · ${shortAddress(wallet.address)}`}
                readOnly
                className="cursor-default hover:border-input"
              />
            </div>

            <section className="mt-5">
              <Label htmlFor="recipient" className="mb-2 block">
                Recipient
              </Label>
              <Input
                id="recipient"
                placeholder="0x…"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                aria-invalid={recipientCheck.state === "invalid"}
                aria-describedby="recipient-status"
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-xs"
              />
              <p
                id="recipient-status"
                aria-live="polite"
                className={cn(
                  "mt-2 flex min-h-4 items-center gap-1.5 text-xs",
                  recipientCheck.state === "invalid"
                    ? "text-destructive"
                    : recipientCheck.state === "valid"
                      ? "text-success"
                      : "text-muted-foreground",
                )}
              >
                {recipientCheck.state === "valid" && (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Valid address
                  </>
                )}
                {(recipientCheck.state === "invalid" || recipientCheck.state === "incomplete") &&
                  recipientCheck.message}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" size="sm" onClick={paste}>
                  <ClipboardPaste />
                  Paste
                </Button>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-primary/15 bg-card bg-card-hero p-5 shadow-card">
              <Label htmlFor="amount">Amount</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  id="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(cleanAmount(e.target.value))}
                  className="w-full min-w-0 bg-transparent font-display text-4xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      aria-label={`Token ${token.symbol}. Change token`}
                      className="relative h-9 shrink-0 gap-1 rounded-full bg-primary/10 px-3 font-display text-sm font-medium text-primary after:absolute after:-inset-y-1 after:inset-x-0 after:content-[''] hover:bg-primary/15 hover:text-primary"
                    >
                      {token.symbol}
                      <ChevronDown aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    aria-label="Tokens"
                    className="max-h-64 w-64 overflow-y-auto p-1.5"
                  >
                    {tokens.map((item) => {
                      const selected = item.id === token.id;
                      return (
                        <DropdownMenuItem
                          key={item.id}
                          aria-current={selected ? "true" : undefined}
                          onSelect={() => setTokenId(item.id)}
                          className={cn(
                            "gap-2.5 rounded-lg px-2.5 py-2",
                            selected && "bg-primary/10",
                          )}
                        >
                          <TokenMark
                            id={item.id}
                            mark={item.mark}
                            className="h-8 w-8 bg-primary/15 text-sm text-primary"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium">
                              {item.symbol}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {item.name}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {balanceText(item)}
                          </span>
                          {selected && <Check className="!h-4 !w-4 shrink-0 text-primary" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-divider pt-3 text-xs">
                <span className="text-muted-foreground">
                  Available {balanceText(token)} {token.symbol}
                </span>
                <button
                  type="button"
                  className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary"
                  onClick={() => setAmount(maxAmount > 0 ? plain(maxAmount) : "")}
                >
                  Max
                </button>
              </div>
              <p
                aria-live="polite"
                className={cn("text-xs text-destructive", amountError && "mt-2")}
              >
                {amountError}
              </p>
            </section>

            <fieldset className="mt-5">
              <legend className="mb-2 text-sm font-medium">Send method</legend>
              <div role="radiogroup" aria-label="Send method" className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["classic", "Classic", "Standard signature (ECDSA)", true],
                    ["pqc", "PQC", "Post-quantum signature", false],
                  ] as const
                ).map(([id, label, detail, available]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={id === "classic"}
                    disabled={!available}
                    className={cn(
                      "flex flex-col gap-0.5 h-fit rounded-xl border px-3 py-2 text-left transition-colors",
                      available
                        ? "border-primary bg-primary/10"
                        : "cursor-not-allowed border-border bg-muted/40",
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span
                        className={cn("text-sm font-medium", !available && "text-muted-foreground")}
                      >
                        {label}
                      </span>
                      {available ? (
                        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                      ) : (
                        <span className="whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                          Coming soon
                        </span>
                      )}
                    </span>
                    <span className="text-xs leading-snug text-muted-foreground">{detail}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2.5">
              <span className="text-[10px] leading-tight text-muted-foreground">
                Preview only
                <br />
                Balance
              </span>
              <div
                className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-0.5"
                role="radiogroup"
                aria-label="Preview balance"
              >
                {(
                  [
                    [false, "Zero"],
                    [true, "Sample"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={sampleBalance === value}
                    onClick={() => setSampleBalance(value)}
                    className={cn(
                      "h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors",
                      sampleBalance === value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="mt-auto h-12 w-full"
              disabled={!canReview}
              onClick={() => setStep("review")}
            >
              Review
              <ArrowUpRight />
            </Button>
          </>
        ) : (
          <>
            <section className="mt-6 rounded-2xl border border-primary/15 bg-card bg-card-hero p-5 text-center shadow-card">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
                <ArrowUpRight />
              </span>
              <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
                {amount} <span className="text-base text-primary">{token.symbol}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">to {shortAddress(recipient)}</p>
            </section>
            <dl className="mt-5 divide-y divide-divider rounded-2xl border bg-card text-sm">
              {[
                ["From", `${wallet.name} · ${shortAddress(wallet.address)}`],
                ["Recipient", recipient.trim()],
                ["Amount", `${amount} ${token.symbol}`],
                ["Network", network.name],
                ["Network fee", `${PREVIEW_NETWORK_FEE} ${PREVIEW_FEE_TOKEN}`],
                ["Signature", "Classic · ECDSA"],
                ["Balance after", `${formatAmount(tokenAfter)} ${token.symbol}`],
                ...(feeIsToken
                  ? []
                  : [
                      [
                        `${PREVIEW_FEE_TOKEN} balance after`,
                        `${formatAmount(feeAfter)} ${PREVIEW_FEE_TOKEN}`,
                      ],
                    ]),
              ].map(([k, v], index) => (
                <div key={`${k}-${index}`} className="flex justify-between gap-3 px-4 py-3">
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd
                    className={cn(
                      "min-w-0 text-right font-medium",
                      k === "Recipient" ? "break-all font-mono text-xs" : "truncate",
                    )}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex gap-2 rounded-2xl bg-secondary/60 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0" />
              Sending is disabled in this preview. A submitted transfer will only count once it's
              confirmed on-chain.
            </p>
            <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
              <Button variant="secondary" className="h-12" onClick={() => setStep("form")}>
                Edit
              </Button>
              <Button className="h-12" disabled>
                Confirm & send
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
