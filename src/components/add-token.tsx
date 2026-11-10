import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import {
  TOKEN_SYMBOL_MAX,
  searchTokens,
  shortAddress,
  validateTokenImport,
  tokensForNetwork,
  type TokenDraft,
} from "@/lib/wallet-preview";
import { cn } from "@/lib/utils";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function TokenMark({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground/10 font-display text-base font-semibold"
    >
      {symbol.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * "+" beside the token list. Two ways in (Search a sample list, or a Custom token), then a confirm
 * step. Tokens apply to the blockchain and network of the active wallet. Preview only: no contract
 * is read and nothing is kept beyond this session.
 */
export function AddTokenButton({ networkId, where }: { networkId: string; where: string }) {
  const { importedTokens, importTokens } = useWalletPreview();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("search");
  const [step, setStep] = useState<"pick" | "confirm">("pick");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState({ address: "", symbol: "", decimals: "" });
  const [submitted, setSubmitted] = useState(false);

  const mine = importedTokens.filter((token) => token.networkId === networkId);
  const existing = [
    ...tokensForNetwork(networkId).map((token) => ({ symbol: token.symbol })),
    ...mine,
  ];
  const results = searchTokens(
    networkId,
    query,
    existing.map((token) => token.symbol),
  );
  const errors = validateTokenImport(custom.address, custom.symbol, custom.decimals, existing);
  const customValid = !errors.address && !errors.symbol && !errors.decimals;
  const show = (field: "address" | "symbol" | "decimals") =>
    submitted ? errors[field] : undefined;

  const selected: TokenDraft[] =
    tab === "search"
      ? results.filter((token) => picked.includes(token.address))
      : customValid
        ? [
            {
              symbol: custom.symbol.trim(),
              address: custom.address.trim(),
              decimals: Number(custom.decimals),
            },
          ]
        : [];

  const reset = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTab("search");
      setStep("pick");
      setQuery("");
      setPicked([]);
      setCustom({ address: "", symbol: "", decimals: "" });
      setSubmitted(false);
    }
  };

  const next = () => {
    if (tab === "custom") setSubmitted(true);
    if (selected.length > 0) setStep("confirm");
  };

  const confirm = () => {
    const added = importTokens(networkId, selected);
    reset(false);
    toast.success(added.length === 1 ? "Token added" : "Tokens added", {
      description: `${added.map((token) => token.symbol).join(", ")} added as a preview on ${where}. Nothing was read from the chain.`,
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Import token"
        title="Import token"
        onClick={() => setOpen(true)}
        className="h-8 w-8 shrink-0 rounded-full after:-inset-1.5 border-primary/30 bg-card text-primary shadow-sm hover:bg-primary/10 hover:text-primary"
      >
        <Plus className="!h-4 !w-4" />
      </Button>

      <Dialog open={open} onOpenChange={reset}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
          {step === "confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  Import {selected.length === 1 ? "this token" : `${selected.length} tokens`}?
                </DialogTitle>
                <DialogDescription>
                  Added to {where}. Preview only: balances stay at zero.
                </DialogDescription>
              </DialogHeader>
              <ul className="space-y-2" aria-label="Tokens to import">
                {selected.map((token) => (
                  <li
                    key={token.address}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <TokenMark symbol={token.symbol} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {token.name ? `${token.name} (${token.symbol})` : token.symbol}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {shortAddress(token.address)} · {token.decimals} decimals
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button type="button" className="w-full" onClick={confirm}>
                  Import
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("pick")}
                >
                  <ArrowLeft />
                  Back
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Import tokens</DialogTitle>
                <DialogDescription>
                  Tokens are added on {where}, the network of your selected wallet. This is a
                  preview: nothing is checked on-chain.
                </DialogDescription>
              </DialogHeader>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="search">Search</TabsTrigger>
                  <TabsTrigger value="custom">Custom token</TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="mt-4 space-y-3">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by name or symbol"
                      aria-label="Search tokens"
                      autoComplete="off"
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Sample results · not a live list
                  </p>
                  {results.length === 0 ? (
                    <p role="status" className="py-4 text-center text-sm text-muted-foreground">
                      No tokens found. Try the Custom token tab.
                    </p>
                  ) : (
                    <ul
                      className="max-h-56 space-y-1.5 overflow-y-auto"
                      aria-label="Search results"
                    >
                      {results.map((token) => {
                        const on = picked.includes(token.address);
                        return (
                          <li key={token.address}>
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              onClick={() =>
                                setPicked((current) =>
                                  on
                                    ? current.filter((a) => a !== token.address)
                                    : [...current, token.address],
                                )
                              }
                              className={cn(
                                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-secondary/60",
                                on ? "border-primary/50 bg-primary/5" : "border-border",
                              )}
                            >
                              <TokenMark symbol={token.symbol} />
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {token.name} ({token.symbol})
                              </span>
                              {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="custom" className="mt-4 space-y-4">
                  <Field id="token-address" label="Contract address" error={show("address")}>
                    <Input
                      id="token-address"
                      value={custom.address}
                      onChange={(event) => setCustom({ ...custom, address: event.target.value })}
                      placeholder="0x…"
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={Boolean(show("address"))}
                      aria-describedby={show("address") ? "token-address-error" : undefined}
                      className="font-mono text-xs"
                    />
                  </Field>
                  <Field id="token-symbol" label="Symbol" error={show("symbol")}>
                    <Input
                      id="token-symbol"
                      value={custom.symbol}
                      onChange={(event) => setCustom({ ...custom, symbol: event.target.value })}
                      placeholder="e.g. USDT"
                      autoComplete="off"
                      maxLength={TOKEN_SYMBOL_MAX + 5}
                      aria-invalid={Boolean(show("symbol"))}
                      aria-describedby={show("symbol") ? "token-symbol-error" : undefined}
                    />
                  </Field>
                  <Field id="token-decimals" label="Decimals" error={show("decimals")}>
                    <Input
                      id="token-decimals"
                      value={custom.decimals}
                      onChange={(event) => setCustom({ ...custom, decimals: event.target.value })}
                      placeholder="e.g. 18"
                      inputMode="numeric"
                      autoComplete="off"
                      aria-invalid={Boolean(show("decimals"))}
                      aria-describedby={show("decimals") ? "token-decimals-error" : undefined}
                    />
                  </Field>
                </TabsContent>
              </Tabs>
              <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => reset(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={next}
                  disabled={tab === "search" && picked.length === 0}
                >
                  Next
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
