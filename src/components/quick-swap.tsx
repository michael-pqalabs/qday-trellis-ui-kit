import { useState } from "react";
import { ArrowDownUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { previewSwapQuote } from "@/lib/swap-preview";

export function QuickSwap({
  open,
  onOpenChange,
  networkName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  networkName: string;
}) {
  const [from, setFrom] = useState<"qday" | "usd8">("qday");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const quote = previewSwapQuote(amount, from, slippage);
  const fromSymbol = from === "qday" ? "QDAY" : "USD8";
  const toSymbol = from === "qday" ? "USD8" : "QDAY";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick Swap</DialogTitle>
          <DialogDescription>{networkName} · Quote preview</DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl bg-secondary/60 p-4">
          <label htmlFor="swap-amount" className="text-xs text-muted-foreground">
            You pay
          </label>
          <div className="mt-2 flex items-center gap-3">
            <Input
              id="swap-amount"
              aria-label="Swap amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="min-w-0 flex-1 font-mono"
            />
            <span className="text-sm font-semibold">{fromSymbol}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Available: 0.00 {fromSymbol}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="mx-auto"
          aria-label="Reverse swap direction"
          title="Reverse swap direction"
          onClick={() => setFrom((v) => (v === "qday" ? "usd8" : "qday"))}
        >
          <ArrowDownUp />
        </Button>
        <div className="rounded-2xl bg-secondary/60 p-4">
          <p className="text-xs text-muted-foreground">You receive</p>
          <p className="mt-2 flex items-baseline justify-between font-display text-2xl font-semibold tabular-nums">
            <span data-testid="swap-output">{quote ? quote.output.toFixed(4) : "0.00"}</span>
            <span className="text-sm">{toSymbol}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Slippage tolerance</span>
          <div className="flex gap-1">
            {[0.1, 0.5, 1].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={slippage === value ? "default" : "ghost"}
                aria-pressed={slippage === value}
                className="h-8 px-3 text-xs"
                onClick={() => setSlippage(value)}
              >
                {value}%
              </Button>
            ))}
          </div>
        </div>
        <dl className="space-y-2 border-t border-divider pt-3 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Illustrative rate</dt>
            <dd>1 QDAY = 0.25 USD8</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Minimum received</dt>
            <dd>
              {quote ? quote.minimumReceived.toFixed(4) : "—"} {toSymbol}
            </dd>
          </div>
        </dl>
        <p className="flex gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          Sample quote, not a live price. Purchases and swaps are not connected.
        </p>
        <Button disabled>Swap unavailable</Button>
      </DialogContent>
    </Dialog>
  );
}
