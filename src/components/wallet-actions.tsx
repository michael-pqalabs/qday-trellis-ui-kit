import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Action = "send" | "receive" | "trade";

export function WalletActions({ walletName, address, networkName, tokenSymbol, walletId, tokenId }: {
  walletName: string; address: string; networkName: string; tokenSymbol: string; walletId: string; tokenId: string;
}) {
  const navigate = useNavigate();
  const [action, setAction] = useState<Action | null>(null);
  const [mode, setMode] = useState<"buy" | "swap">("buy");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyState("copied");
    } catch { setCopyState("error"); }
  };

  return <>
    <div className="my-5 grid grid-cols-3 gap-3" aria-label="Wallet actions">
      {([
        { id: "send", label: "Send", icon: ArrowUpRight },
        { id: "receive", label: "Receive", icon: ArrowDownLeft },
        { id: "trade", label: "Buy/Swap", icon: ArrowLeftRight },
      ] as const).map(({ id, label, icon: Icon }) => (
        <Button key={id} variant="ghost" onClick={() => { if (id === "send" || id === "receive") { navigate({ to: id === "send" ? "/send" : "/receive", search: { wallet: walletId, token: tokenId } }); return; } setAction(id); setCopyState("idle"); }} className="h-auto flex-col gap-2 rounded-lg py-2 text-xs hover:bg-secondary hover:text-foreground">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${id === "trade" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}><Icon className="!h-5 !w-5" /></span>
          {label}
        </Button>
      ))}
    </div>
    <Dialog open={action !== null} onOpenChange={(open) => { if (!open) setAction(null); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg">
        <DialogHeader>
          <DialogTitle className="font-display tracking-normal">{action === "send" ? `Send ${tokenSymbol}` : action === "receive" ? `Receive ${tokenSymbol}` : "Buy / Swap"}</DialogTitle>
          <DialogDescription>{walletName} · {networkName}</DialogDescription>
        </DialogHeader>
        {action === "receive" ? <>
          <p className="text-sm text-muted-foreground">Demo address only. Do not send real funds to this address.</p>
          <p className="break-all rounded-lg border bg-card p-4 font-mono text-xs leading-6">{address}</p>
          <Button onClick={copy}>{copyState === "copied" ? <Check /> : <Copy />}{copyState === "copied" ? "Address copied" : "Copy address"}</Button>
          {copyState === "error" && <p role="status" className="text-xs text-destructive">Couldn't copy. Select the address to copy it manually.</p>}
        </> : action === "send" ? <>
          <label className="space-y-2 text-xs text-muted-foreground">Recipient address<Input placeholder="0x…" aria-label="Recipient address" /></label>
          <label className="space-y-2 text-xs text-muted-foreground">Amount ({tokenSymbol})<Input type="number" min="0" placeholder="0.00" aria-label="Send amount" /></label>
          <p className="text-xs text-muted-foreground">Available: 0.00 {tokenSymbol}. Sending is unavailable in this demo wallet.</p>
          <Button disabled>Send {tokenSymbol}</Button>
        </> : <>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
            {(["buy", "swap"] as const).map((item) => <Button key={item} variant={mode === item ? "default" : "ghost"} aria-pressed={mode === item} onClick={() => setMode(item)}>{item === "buy" ? "Buy" : "Swap"}</Button>)}
          </div>
          <p className="text-sm text-muted-foreground">{mode === "buy" ? "Purchases aren't connected in this demo wallet." : "Swaps aren't connected in this demo wallet."}</p>
          <Button disabled>{mode === "buy" ? `Buy ${tokenSymbol}` : `Swap ${tokenSymbol}`}</Button>
        </>}
      </DialogContent>
    </Dialog>
  </>;
}