import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { activateQPass, createQPass, validateQPassInput } from "@/lib/qpass";
import { DeploymentFeeDialog, TransactionConfirm } from "@/components/signet-fee";
import { QDayEntry } from "@/components/qday-entry";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { DEFAULT_CHAIN_ID, getChain, signetPassFee } from "@/lib/wallet-preview";
import { ChainChoice } from "@/components/add-wallet";
export const Route = createFileRoute("/agentic_/new")({
  head: () => ({
    meta: [
      { title: "Create SignetPass — Trellis Wallet" },
      {
        name: "description",
        content: "Name a separate SignetPass spending account in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Create SignetPass — Trellis Wallet" },
      {
        property: "og:description",
        content:
          "Create a named SignetPass account; spending permissions are requested from the terminal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateQPassPage,
});
function CreateQPassPage() {
  return (
    <QDayEntry>
      <CreateQPass />
    </QDayEntry>
  );
}
function CreateQPass() {
  const navigate = useNavigate();
  const { networkId } = useWalletPreview();
  // A new SignetPass starts on Base; QDay is the other choice. The fee depends on the choice.
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);
  const chain = getChain(chainId);
  const feeToken = signetPassFee(chainId).token;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feeOpen, setFeeOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Same steps as the first setup: name it and pick the blockchain, accept the deployment fee, review, then activate.
  const create = () => {
    const pass = createQPass({ name, chainId });
    activateQPass(pass.id);
    setConfirmOpen(false);
    toast.success("SignetPass created", {
      description: `${pass.name} is active on ${chain.name}. Preview only: nothing was deployed or charged.`,
    });
    navigate({ to: "/agentic", search: { pass: pass.id } });
  };
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Back to Agentic Payments"
            className="border bg-card"
          >
            <Link to="/agentic">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Create SignetPass</h1>
        </header>
        <div className="pb-8 pt-12">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <WalletCards className="h-8 w-8" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold">A new spending wallet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Owned by you.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const invalid = validateQPassInput({ name });
            if (invalid) {
              setError(invalid);
              return;
            }
            setFeeOpen(true);
          }}
        >
          <p className="mb-2 text-sm font-medium">Blockchain</p>
          <ChainChoice value={chainId} activeNetworkId={networkId} onChange={setChainId} />
          <label htmlFor="qpass-name" className="mb-2 mt-5 block text-sm font-medium">
            SignetPass name
          </label>
          <Input
            id="qpass-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            placeholder="e.g. Shopping SignetPass"
            autoComplete="off"
            className="h-12 rounded-full bg-card px-4"
            aria-invalid={!!error}
            aria-describedby={error ? "name-error" : undefined}
          />
          {error && (
            <p id="name-error" role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="mt-6 flex items-center justify-between border-y py-4 text-sm">
            <span className="text-muted-foreground">Initial balance</span>
            <span className="font-semibold">0.00 {feeToken}</span>
          </div>
          <Button type="submit" className="mt-6 h-12 w-full">
            Create SignetPass
          </Button>
        </form>
        <DeploymentFeeDialog
          open={feeOpen}
          title="Create SignetPass"
          cancelTo="/agentic"
          chainId={chainId}
          onCancel={() => setFeeOpen(false)}
          onAccept={() => {
            setFeeOpen(false);
            setConfirmOpen(true);
          }}
        />
        <TransactionConfirm
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          action="Deploy SignetPass smart contract"
          details={[
            ["SignetPass", name.trim()],
            ["Blockchain", `${chain.name} · ${feeToken}`],
          ]}
          chainId={chainId}
          onConfirm={create}
        />
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Owned by your main wallet · {feeToken} on {chain.name}
        </p>
      </main>
    </div>
  );
}
