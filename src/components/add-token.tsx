import { useState } from "react";
import { Plus } from "lucide-react";
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
import { useWalletPreview } from "@/components/wallet-preview-provider";
import {
  TOKEN_DECIMALS_MAX,
  TOKEN_SYMBOL_MAX,
  validateTokenImport,
  walletTokens,
} from "@/lib/wallet-preview";

/** "+" beside the token list. Adds an illustrative row only: no contract is read and nothing is stored. */
export function AddTokenButton({ where }: { where: string }) {
  const { importedTokens, importToken } = useWalletPreview();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const existing = [...walletTokens.map((token) => ({ symbol: token.symbol })), ...importedTokens];
  const errors = validateTokenImport(address, symbol, decimals, existing);
  const show = (field: "address" | "symbol" | "decimals") =>
    submitted ? errors[field] : undefined;

  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setAddress("");
      setSymbol("");
      setDecimals("");
      setSubmitted(false);
    }
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
        className="h-8 w-8 shrink-0 rounded-full border-primary/30 bg-card text-primary shadow-sm hover:bg-primary/10 hover:text-primary"
      >
        <Plus className="!h-4 !w-4" />
      </Button>

      <Dialog open={open} onOpenChange={reset}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Import token</DialogTitle>
            <DialogDescription>
              Add a token to your list on {where}. This is a preview: the contract is not checked
              and the balance stays 0.00.
            </DialogDescription>
          </DialogHeader>
          <form
            noValidate
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              if (errors.address || errors.symbol || errors.decimals) return;
              const token = importToken(symbol, address, Number(decimals));
              reset(false);
              toast.success("Token added", {
                description: `${token.symbol} added as a preview. Nothing was read from the chain.`,
              });
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="token-address" className="text-sm font-medium">
                Contract address
              </label>
              <Input
                id="token-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="0x…"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(show("address"))}
                aria-describedby={show("address") ? "token-address-error" : undefined}
                className="font-mono text-xs"
              />
              {show("address") && (
                <p id="token-address-error" role="alert" className="text-xs text-destructive">
                  {show("address")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="token-symbol" className="text-sm font-medium">
                Symbol
              </label>
              <Input
                id="token-symbol"
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="e.g. USDT"
                autoComplete="off"
                maxLength={TOKEN_SYMBOL_MAX + 5}
                aria-invalid={Boolean(show("symbol"))}
                aria-describedby={show("symbol") ? "token-symbol-error" : undefined}
              />
              {show("symbol") && (
                <p id="token-symbol-error" role="alert" className="text-xs text-destructive">
                  {show("symbol")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="token-decimals" className="text-sm font-medium">
                Decimals
              </label>
              <Input
                id="token-decimals"
                value={decimals}
                onChange={(event) => setDecimals(event.target.value)}
                placeholder="e.g. 18"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={Boolean(show("decimals"))}
                aria-describedby={show("decimals") ? "token-decimals-error" : undefined}
              />
              {show("decimals") && (
                <p id="token-decimals-error" role="alert" className="text-xs text-destructive">
                  {show("decimals")}
                </p>
              )}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button type="submit" className="w-full">
                Import token
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => reset(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
