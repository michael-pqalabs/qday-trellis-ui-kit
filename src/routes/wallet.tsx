import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  Info,
  Pencil,
  EyeOff,
  Wallet,
  ChevronRight,
  History,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { TrellisLockup } from "@/components/trellis-lockup";
import { Button } from "@/components/ui/button";
import {
  agoLabel,
  shortAddress,
  zeroBalance,
  transactionsFor,
  getPreviewHolding,
  chainForNetwork,
  describeNetwork,
  walletTokens,
} from "@/lib/wallet-preview";
import { AddWalletMenu, RenameWalletDialog } from "@/components/add-wallet";
import { NetworkPicker } from "@/components/network-picker";
import { WalletActions } from "@/components/wallet-actions";
import { BottomNav } from "@/components/bottom-nav";
import { AddTokenButton } from "@/components/add-token";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Search = { wallet?: string | undefined; network?: string | undefined };

export const Route = createFileRoute("/wallet")({
  // Lets the import page return to a specific wallet and network.
  validateSearch: (s: Record<string, unknown>): Search => ({
    wallet: typeof s["wallet"] === "string" ? s["wallet"] : undefined,
    network: typeof s["network"] === "string" ? s["network"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Wallets — Trellis Wallet" },
      {
        name: "description",
        content:
          "Your Trellis Wallet overview: select a wallet, network, and QDAY or USD8 balance.",
      },
      { property: "og:title", content: "My Wallets — Trellis Wallet" },
      {
        property: "og:description",
        content: "Explore your wallet and individual token balances in Trellis Wallet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WalletOverview,
});

function WalletOverview() {
  const search = Route.useSearch();
  const {
    wallets,
    importedTokens: allImportedTokens,
    networkId,
    setNetworkId,
  } = useWalletPreview();
  const [walletId, setWalletId] = useState(search.wallet ?? "main");
  const [renameOpen, setRenameOpen] = useState(false);
  const chainId = chainForNetwork(networkId).id;
  useEffect(() => {
    if (search.network) setNetworkId(search.network);
  }, [search.network, setNetworkId]);
  const [tokenId, setTokenId] = useState("qday");
  const [visible, setVisible] = useState(true);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const importedTokens = allImportedTokens.filter((token) => token.networkId === networkId);
  const holding = getPreviewHolding(walletId, networkId, tokenId, wallets);
  const { wallet, network, token, balance } = holding;
  const { network: chainNetwork, label: where } = describeNetwork(networkId);
  const changeNetwork = (_chainId: string, nextNetworkId: string) => {
    setNetworkId(nextNetworkId);
    setCopyState("idle");
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-5 pb-0 pt-3">
        <NetworkPicker chainId={chainId} networkId={networkId} onChange={changeNetwork} />
        <header className="mt-1 flex items-center justify-between">
          <TrellisLockup />
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Open settings"
            title="Settings"
            className="relative h-9 w-9 rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm hover:bg-secondary hover:text-primary"
          >
            <Link to="/settings">
              <Settings className="h-4 w-4" />
              <span
                className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-card"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </header>

        <div className="mb-4 mt-6 flex items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold">My Wallets</h1>
          <AddWalletMenu
            networkId={networkId}
            where={where}
            onAdded={(added) => {
              setWalletId(added.id);
              setCopyState("idle");
            }}
          />
        </div>

        <div className="mb-4 flex min-w-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                aria-label="Select wallet"
                className="h-11 min-w-0 flex-1 justify-start gap-2.5 bg-card px-3.5 text-[13px] shadow-sm"
              >
                <Wallet className="!h-4 !w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-left">{wallet.name}</span>
                <ChevronRight className="rotate-90 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[var(--radix-dropdown-menu-trigger-width)] p-1.5"
              aria-label="Wallets"
            >
              {wallets.map((item) => {
                const selected = item.id === walletId;
                return (
                  <DropdownMenuItem
                    key={item.id}
                    aria-current={selected ? "true" : undefined}
                    onSelect={() => {
                      setWalletId(item.id);
                      if (item.networkId) setNetworkId(item.networkId);
                      setCopyState("idle");
                    }}
                    className={`gap-2.5 rounded-lg px-2.5 py-2 ${selected ? "bg-primary/10" : ""}`}
                  >
                    <Wallet className="!h-4 !w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium">{item.name}</span>
                        {item.source === "imported" && (
                          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                            Imported
                          </span>
                        )}
                      </span>
                      <span className="mt-px block truncate font-mono text-[11px] text-muted-foreground">
                        {shortAddress(item.address)}
                      </span>
                    </span>
                    {selected && <Check className="!h-4 !w-4 shrink-0 text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Rename ${wallet.name}`}
            title="Rename wallet"
            onClick={() => setRenameOpen(true)}
            className="h-11 w-11 shrink-0 bg-card text-muted-foreground shadow-sm hover:text-primary"
          >
            <Pencil className="!h-4 !w-4" />
          </Button>
        </div>
        <RenameWalletDialog
          key={wallet.id}
          wallet={wallet}
          open={renameOpen}
          onOpenChange={setRenameOpen}
        />

        <section
          aria-label="Selected token balance"
          className="overflow-hidden rounded-2xl border border-primary/15 bg-card bg-card-hero px-5 py-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{token.name} balance</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? "Hide balance" : "Show balance"}
              title={visible ? "Hide balance" : "Show balance"}
              aria-pressed={!visible}
              className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-1 flex min-h-10 flex-wrap items-baseline gap-2" aria-live="polite">
            <span className="font-display text-4xl font-semibold tabular-nums">
              {visible ? balance : "••••"}
            </span>
            <span className="font-display text-sm font-medium text-primary">{token.symbol}</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{where}</p>
          {chainNetwork?.previewNote && (
            <p
              role="note"
              className="mt-2 flex items-start gap-1.5 rounded-md bg-secondary/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground"
            >
              <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              {chainNetwork.previewNote}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 border-t border-divider pt-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-secondary/70 px-3 py-2">
              <span
                className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground"
                title={wallet.address}
                data-testid="wallet-address"
              >
                {wallet.address}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyAddress}
                aria-label="Copy wallet address"
                title="Copy wallet address"
                className="h-7 w-7 shrink-0 rounded-full text-primary hover:bg-card hover:text-primary"
              >
                {copyState === "copied" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </section>
        {copyState !== "idle" && (
          <p role="status" className="mt-2 text-center text-xs text-muted-foreground">
            {copyState === "copied"
              ? "Address copied"
              : "Couldn't copy. Select the address to copy it manually."}
          </p>
        )}
        <WalletActions
          key={`${walletId}-${networkId}-${tokenId}`}
          networkId={networkId}
          walletId={walletId}
          tokenId={tokenId}
        />

        <section aria-labelledby="tokens-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="tokens-title" className="font-display text-lg font-semibold">
              Tokens
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {walletTokens.length + importedTokens.length} assets
              </span>
              <AddTokenButton networkId={networkId} where={where} />
            </div>
          </div>
          <div className="space-y-1">
            {walletTokens.map((item) => {
              const selected = item.id === tokenId;
              const tone =
                item.tone === "primary"
                  ? "bg-primary/15 text-primary"
                  : "bg-foreground/10 text-foreground";
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  aria-pressed={selected}
                  aria-label={`Select ${item.name}`}
                  onClick={() => setTokenId(item.id)}
                  className={`h-16 w-full justify-start gap-3 rounded-lg border px-3 text-left hover:bg-secondary hover:text-foreground ${selected ? "border-primary/30 bg-primary/5" : "border-transparent"}`}
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-base font-semibold ${tone}`}
                  >
                    {item.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.name}</span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {item.detail}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-base tabular-nums">
                      {visible ? "0.00" : "••••"}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {item.symbol}
                    </span>
                  </span>
                  <ChevronRight
                    className={selected ? "text-primary" : "text-muted-foreground/40"}
                  />
                </Button>
              );
            })}
            {importedTokens.map((item) => (
              <div
                key={item.id}
                className="flex h-16 w-full items-center gap-3 rounded-lg border border-transparent px-3"
              >
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground/10 font-display text-base font-semibold text-foreground"
                >
                  {item.symbol.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {item.name ?? item.symbol}
                  </span>
                  <span className="mt-1 block truncate font-mono text-[11px] text-muted-foreground">
                    Imported · {shortAddress(item.address)}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-display text-base tabular-nums">
                    {visible ? zeroBalance(item.decimals) : "••••"}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {item.symbol}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-6 border-t border-divider pt-5" aria-labelledby="history-title">
          <div className="flex items-center justify-between gap-2">
            <h2 id="history-title" className="font-display text-lg font-semibold">
              Transactions
            </h2>
            <span className="text-[10px] text-muted-foreground">{wallet.name}</span>
          </div>
          {transactionsFor(walletId).length === 0 ? (
            <div className="flex flex-col items-center py-7 text-center" role="status">
              <History className="mb-3 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm font-medium">No transactions yet</p>
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-divider">
              {transactionsFor(walletId).map((tx) => {
                const t = walletTokens.find((x) => x.id === tx.tokenId);
                if (!t) return null;
                const sent = tx.kind === "send";
                const status =
                  tx.status === "pending"
                    ? "text-amber-600 dark:text-amber-400"
                    : tx.status === "failed"
                      ? "text-destructive"
                      : "text-muted-foreground";
                return (
                  <li key={tx.id} className="flex items-center gap-3 py-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${sent ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}
                    >
                      {sent ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {sent ? "Sent" : "Received"} {t.symbol}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {sent ? "To" : "From"} {shortAddress(tx.counterparty)} ·{" "}
                        {agoLabel(tx.minutesAgo)}
                      </span>
                    </span>
                    <span className="text-right">
                      <span
                        className={`block font-display text-sm tabular-nums ${sent ? "" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {visible ? `${sent ? "−" : "+"}${tx.amount}` : "••••"}
                      </span>
                      <span className={`mt-0.5 block text-[10px] capitalize ${status}`}>
                        {tx.status}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Sample history for layout review · not on-chain records
          </p>
        </section>
        <footer className="pt-8 text-center text-[10px] text-muted-foreground">
          Trellis Wallet · Your keys. Your crypto.
        </footer>
        <BottomNav />
      </main>
    </div>
  );
}
