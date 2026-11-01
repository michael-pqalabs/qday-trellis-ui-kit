import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickSwap } from "@/components/quick-swap";

export function WalletActions({ networkName, networkId, walletId, tokenId }: {
  networkName: string; networkId: string; walletId: string; tokenId: string;
}) {
  const navigate = useNavigate();
  const [swapOpen, setSwapOpen] = useState(false);

  return <>
    <div className="my-5 grid grid-cols-3 gap-3" aria-label="Wallet actions">
      {([
        { id: "send", label: "Send", icon: ArrowUpRight },
        { id: "receive", label: "Receive", icon: ArrowDownLeft },
        { id: "trade", label: "Buy/Swap", icon: ArrowLeftRight },
      ] as const).map(({ id, label, icon: Icon }) => (
        <Button key={id} variant="ghost" onClick={() => { if (id === "send" || id === "receive") { navigate({ to: id === "send" ? "/send" : "/receive", search: { wallet: walletId, token: tokenId, network: networkId } }); return; } setSwapOpen(true); }} className="h-auto flex-col gap-2 rounded-lg py-2 text-xs hover:bg-secondary hover:text-foreground">
          <span className={`grid h-11 w-11 place-items-center rounded-full ${id === "trade" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}><Icon className="!h-5 !w-5" /></span>
          {label}
        </Button>
      ))}
    </div>
    <QuickSwap open={swapOpen} onOpenChange={setSwapOpen} networkName={networkName} />
  </>;
}