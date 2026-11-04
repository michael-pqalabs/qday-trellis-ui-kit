import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { RenameWalletDialog } from "@/components/add-wallet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { nextWalletName, type PreviewWallet } from "@/lib/wallet-preview";

export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Trellis Wallet" },
      {
        name: "description",
        content: "Accounts created from this backup in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Accounts — Trellis Wallet" },
      {
        property: "og:description",
        content: "Accounts created from this backup in the Trellis Wallet preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountsPage,
});

function AccountsPage() {
  const { wallets, addWallet, networkId } = useWalletPreview();
  const [renaming, setRenaming] = useState<PreviewWallet | null>(null);
  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to settings">
            <Link to="/settings">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Accounts</h1>
        </header>
        <p className="mt-4 text-xs text-muted-foreground">
          Accounts from this backup share the same owner key. Each account index produces a
          different AA address.
        </p>
        <ul className="mt-4 space-y-3">
          {wallets.map((w, index) => (
            <li key={w.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">{w.name}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-my-2 h-8 w-8"
                  aria-label={`Edit nickname of ${w.name}`}
                  onClick={() => setRenaming(w)}
                >
                  <Pencil />
                </Button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="secondary">AA smart account</Badge>
                <Badge variant="outline">Recovery account index {index}</Badge>
              </div>
              <p className="mt-3 break-all font-mono text-[11px] text-muted-foreground">
                {w.address}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/account-activation">Check account activation</Link>
              </Button>
            </li>
          ))}
        </ul>
        <section className="mt-6 rounded-2xl border bg-card p-4">
          <h2 className="text-sm font-semibold">Add an account from the current backup</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Uses the current wallet’s recovery phrase. Keep the account type and index above with
            your backup.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            This saves a predicted address only. Additional AA deployment requires USD8 from your
            Main AA; the creation-fee service is not connected yet.
          </p>
          <Button
            className="mt-3 w-full"
            onClick={() => {
              const wallet = addWallet(nextWalletName(wallets), networkId, "created");
              toast.success("Account added", {
                description: `${wallet.name} (illustrative, preview only).`,
              });
            }}
          >
            <Plus />
            Add AA account
          </Button>
        </section>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link to="/wallet/import">Create or import another wallet</Link>
        </Button>
        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          Preview only · addresses are illustrative and not derived from a phrase
        </p>
        {renaming && (
          <RenameWalletDialog
            key={renaming.id}
            wallet={renaming}
            open
            onOpenChange={(o) => !o && setRenaming(null)}
          />
        )}
      </main>
    </div>
  );
}
