import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ImportWalletForm } from "@/components/add-wallet";
import { Button } from "@/components/ui/button";
import { describeNetwork } from "@/lib/wallet-preview";

type Search = { network?: string | undefined };

export const Route = createFileRoute("/wallet_/import")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    network: typeof s["network"] === "string" ? s["network"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Import a new wallet — Trellis Wallet" },
      {
        name: "description",
        content:
          "Preview the Trellis Wallet import flow: enter a recovery phrase, then name the wallet.",
      },
      { property: "og:title", content: "Import a new wallet — Trellis Wallet" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImportWalletPage,
});

function ImportWalletPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { network, label } = describeNetwork(search.network);

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
        <header className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Back to wallet">
            <Link to="/wallet" search={{ network: network?.id }}>
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Import a new wallet</h1>
        </header>
        <p className="mt-4 text-sm text-muted-foreground">
          Bring an existing wallet into Trellis Wallet. This is a preview: nothing is imported
          on-chain.
        </p>
        <section className="mt-6 rounded-2xl border border-primary/15 bg-card bg-card-hero p-5 shadow-card">
          <ImportWalletForm
            where={label}
            networkId={network?.id ?? "testnet"}
            onDone={(wallet) => {
              toast.success("Wallet imported", {
                description: `${wallet.name} added as a preview. Nothing was created on-chain.`,
              });
              navigate({ to: "/wallet", search: { wallet: wallet.id, network: network?.id } });
            }}
          />
        </section>
      </main>
    </div>
  );
}
