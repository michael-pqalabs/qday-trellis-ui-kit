import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PASSKEY_CONFIRM_MS } from "@/components/create-session-dialog";
import { useStableToken, useWalletPreview } from "@/components/wallet-preview-provider";
import { cn } from "@/lib/utils";
import type { QPass } from "@/lib/qpass";
import {
  SAMPLE_SHIP_TO,
  cartCount,
  cartTotal,
  checkoutProblem,
  formatAtomic,
  payAccounts,
  pricedCart,
  type PayAccount,
  type ShopState,
} from "@/lib/shop-preview";
import { formatAmount } from "@/lib/wallet-preview";

const KIND_LABEL = { wallet: "Main Wallet", signetpass: "SignetPass" } as const;

/**
 * Pays the cart from Trellis: the user sees the total, picks which account pays, checks where it
 * ships, and confirms with the (simulated) Passkey. Preview only: nothing is sent or charged.
 */
export function CheckoutDialog({
  open,
  onOpenChange,
  shop,
  chainId,
  passes,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shop: ShopState;
  chainId: string;
  passes: readonly QPass[];
  onPaid: (account: PayAccount) => void;
}) {
  const { wallets } = useWalletPreview();
  const { stable } = useStableToken(chainId);
  const [sample, setSample] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setSample(false);
    setChosen(null);
    setConfirming(false);
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const accounts = useMemo(
    () => payAccounts({ wallets, passes, chainId, sampleBalances: sample }),
    [wallets, passes, chainId, sample],
  );
  const lines = pricedCart(shop, chainId);
  const total = cartTotal(lines);
  const shops = new Set(lines.map((line) => line.product.merchant.id)).size;
  // Until the user picks one, the first account (the Main Wallet) pays.
  const account = accounts.find((a) => a.id === chosen) ?? accounts[0];
  const problem = checkoutProblem(shop, chainId, account);

  const pay = () => {
    if (!account || problem) return;
    setConfirming(true);
    timer.current = setTimeout(() => {
      setConfirming(false);
      onPaid(account);
    }, PASSKEY_CONFIRM_MS);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && confirming) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[92dvh] max-w-sm gap-4 overflow-y-auto">
        <div className="pr-8">
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription className="mt-1 text-xs">
            {cartCount(shop)} {cartCount(shop) === 1 ? "item" : "items"} from {shops}{" "}
            {shops === 1 ? "shop" : "shops"}
          </DialogDescription>
        </div>

        <div className="rounded-2xl bg-primary/10 px-4 py-3.5 text-center">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-0.5 text-xl font-semibold leading-tight">
            {formatAtomic(total)}{" "}
            <span className="text-lg font-medium text-muted-foreground">{stable}</span>
          </p>
        </div>

        <fieldset disabled={confirming} className="min-w-0">
          <legend className="mb-2 text-xs font-medium text-muted-foreground">Pay from</legend>
          <div
            role="radiogroup"
            aria-label="Pay from"
            className="max-h-48 space-y-1.5 overflow-y-auto overscroll-contain pr-1"
          >
            {accounts.map((a) => {
              const selected = account?.id === a.id;
              const short = checkoutProblem(shop, chainId, a) !== null;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setChosen(a.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/60 bg-card hover:bg-secondary/60",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                      selected ? "border-primary" : "border-muted-foreground/40",
                    )}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.name}</span>
                    <span className="text-[11px] text-muted-foreground">{KIND_LABEL[a.kind]}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-right text-xs",
                      short ? "text-muted-foreground" : "font-medium",
                    )}
                  >
                    {formatAmount(a.balance)} {stable}
                  </span>
                </button>
              );
            })}
          </div>
          {problem && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {problem}
            </p>
          )}
        </fieldset>

        <div className="flex items-start gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-xs">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-muted-foreground">Ship to</p>
            <p className="font-medium">{SAMPLE_SHIP_TO}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2">
          <span className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Preview</span> · wallet balance
          </span>
          <div
            className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-0.5"
            role="radiogroup"
            aria-label="Preview wallet balance"
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
                aria-checked={sample === value}
                disabled={confirming}
                onClick={() => setSample(value)}
                className={cn(
                  "h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors",
                  sample === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={confirming}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-[1.6]"
              disabled={confirming || !account || problem !== null}
              onClick={pay}
            >
              {confirming ? (
                <>
                  <Loader2 className="animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  <ShieldCheck />
                  Pay {formatAtomic(total)} {stable}
                </>
              )}
            </Button>
          </div>
          {confirming ? (
            <p role="status" className="animate-fade-up text-center text-xs text-primary">
              Simulating Passkey confirmation…
            </p>
          ) : (
            <p className="text-center text-[11px] text-muted-foreground">
              Passkey confirmation · Preview: nothing is charged
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
