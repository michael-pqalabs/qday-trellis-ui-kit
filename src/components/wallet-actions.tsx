import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WalletActions({
  networkId,
  walletId,
  tokenId,
}: {
  networkId: string;
  walletId: string;
  tokenId: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="my-5 grid grid-cols-2 gap-3" aria-label="Wallet actions">
      {(
        [
          { id: "send", label: "Send", icon: ArrowUpRight },
          { id: "receive", label: "Receive", icon: ArrowDownLeft },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="ghost"
          onClick={() => {
            navigate({
              to: id === "send" ? "/send" : "/receive",
              search: { wallet: walletId, token: tokenId, network: networkId },
            });
          }}
          className="h-auto flex-col gap-2 rounded-lg py-2 text-xs hover:bg-secondary hover:text-foreground"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
            <Icon className="!h-5 !w-5" />
          </span>
          {label}
        </Button>
      ))}
    </div>
  );
}
