import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Send and Receive as two side-by-side buttons inside the balance card, above its footer. */
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
    <div className="mt-4 grid grid-cols-2 gap-3" aria-label="Wallet actions">
      {(
        [
          { id: "send", label: "Send", icon: ArrowUpRight, variant: "default" },
          { id: "receive", label: "Receive", icon: ArrowDownLeft, variant: "outline" },
        ] as const
      ).map(({ id, label, icon: Icon, variant }) => (
        <Button
          key={id}
          variant={variant}
          onClick={() => {
            navigate({
              to: id === "send" ? "/send" : "/receive",
              search: { wallet: walletId, token: tokenId, network: networkId },
            });
          }}
          className="h-10 gap-1.5 rounded-full text-xs font-semibold"
        >
          <Icon className="!h-3.5 !w-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}
