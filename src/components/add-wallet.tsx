import { rowActionClass } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CHAIN_ID,
  WALLET_NAME_MAX,
  chainForNetwork,
  defaultNetworkId,
  describeNetwork,
  feeTokenFor,
  getChain,
  isPhraseLengthValid,
  nextWalletName,
  phraseWordCount,
  previewChains,
  validateWalletName,
  type PreviewWallet,
} from "@/lib/wallet-preview";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, Download, Pencil, Plus, ShieldAlert, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Wallet name with a small pen icon that turns it into an inline field. */
function EditableWalletName({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    onChange(draft);
    setEditing(false);
  };

  return (
    <div>
      {editing ? (
        // A plain row, not a nested <form>: Enter must save the name without submitting the dialog.
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              } else if (event.key === "Escape") {
                event.stopPropagation();
                setDraft(value);
                setEditing(false);
              }
            }}
            aria-label="Wallet name"
            aria-invalid={Boolean(error)}
            maxLength={WALLET_NAME_MAX}
            autoComplete="off"
            className="h-9"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Save wallet name"
            onClick={commit}
            // Keep the field focused until the click lands so blur does not commit twice.
            onMouseDown={(event) => event.preventDefault()}
            className="h-9 w-9 shrink-0 text-primary"
          >
            <Check />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span
            className="min-w-0 truncate font-display text-lg font-semibold"
            data-testid="new-wallet-name"
          >
            {value}
          </span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Edit wallet name"
            title="Edit wallet name"
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="!h-3.5 !w-3.5" />
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function WalletNameCard({
  name,
  onNameChange,
  error,
  where,
}: {
  name: string;
  onNameChange: (value: string) => void;
  error?: string | undefined;
  where: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-card bg-card-hero px-4 py-3 shadow-card">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Wallet className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <EditableWalletName value={name} onChange={onNameChange} error={error} />
        <p className="mt-0.5 text-xs text-muted-foreground">{where}</p>
      </div>
    </div>
  );
}

/**
 * Pick the blockchain a new Main Wallet lives on. Each option reads "Chain Stablecoin" (Base USDC,
 * QDay USD8) so the choice and the token it pays fees in are one thing.
 */
function ChainChoice({
  value,
  activeNetworkId,
  onChange,
}: {
  value: string;
  activeNetworkId: string;
  onChange: (chainId: string) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Blockchain</legend>
      <div role="radiogroup" aria-label="Blockchain" className="grid grid-cols-2 gap-3">
        {previewChains
          .filter((chain) => chain.available)
          .map((chain) => {
            const selected = chain.id === value;
            const networkId =
              chain.id === chainForNetwork(activeNetworkId).id
                ? activeNetworkId
                : defaultNetworkId(chain.id);
            return (
              <button
                key={chain.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(chain.id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  selected
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-card hover:bg-secondary/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                    selected ? "border-primary" : "border-primary/70",
                  )}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">
                    {chain.name} {feeTokenFor(chain.id)}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {chain.id === DEFAULT_CHAIN_ID
                      ? "Default"
                      : chain.networks.find((item) => item.id === networkId)?.name}
                  </span>
                </span>
              </button>
            );
          })}
      </div>
    </fieldset>
  );
}

function CreateWalletForm({
  networkId: activeNetworkId,
  onDone,
}: {
  /** The network currently shown on the wallet screen: the default choice. */
  networkId: string;
  onDone: (wallet: PreviewWallet) => void;
}) {
  const { wallets, addWallet } = useWalletPreview();
  const [chainId, setChainId] = useState(() => chainForNetwork(activeNetworkId).id);
  const [name, setName] = useState(() => nextWalletName(wallets));
  const error = validateWalletName(name, wallets);
  // Stay on the network already open when its blockchain is chosen again (for example Mainnet).
  const networkId =
    chainId === chainForNetwork(activeNetworkId).id ? activeNetworkId : defaultNetworkId(chainId);
  const where = describeNetwork(networkId).label;
  const firstOnChain = !wallets.some(
    (wallet) =>
      wallet.source === "created" &&
      wallet.networkId &&
      chainForNetwork(wallet.networkId).id === chainId,
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (error) return;
        onDone(addWallet(name, networkId, "created"));
      }}
    >
      <ChainChoice value={chainId} activeNetworkId={activeNetworkId} onChange={setChainId} />
      <WalletNameCard name={name} onNameChange={setName} error={error} where={where} />
      <Button type="submit" className="w-full" disabled={Boolean(error)}>
        <Plus />
        Create on {getChain(chainId).name}
      </Button>
    </form>
  );
}

export function ImportWalletForm({
  networkId: activeNetworkId,
  onDone,
}: {
  /** The network open on the wallet screen: the default choice for the imported wallet. */
  networkId: string;
  onDone: (wallet: PreviewWallet) => void;
}) {
  const { wallets, addWallet } = useWalletPreview();
  const [step, setStep] = useState<1 | 2>(1);
  const [phrase, setPhrase] = useState("");
  const [chainId, setChainId] = useState(() => chainForNetwork(activeNetworkId).id);
  const [name, setName] = useState(() => nextWalletName(wallets));
  const words = phraseWordCount(phrase);
  const phraseOk = isPhraseLengthValid(phrase);
  const nameError = validateWalletName(name, wallets);
  const networkId =
    chainId === chainForNetwork(activeNetworkId).id ? activeNetworkId : defaultNetworkId(chainId);
  const where = describeNetwork(networkId).label;

  return (
    <div className="space-y-4">
      <ol className="flex items-center gap-2 text-xs" aria-label="Import progress">
        {["Recovery phrase", "Blockchain & name"].map((label, index) => {
          const active = step === index + 1;
          const done = step > index + 1;
          return (
            <li
              key={label}
              className="flex items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold",
                  active || done
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className={active ? "font-medium" : "text-muted-foreground"}>{label}</span>
              {index === 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (phraseOk) setStep(2);
          }}
        >
          <div className="flex items-start gap-2 rounded-lg bg-secondary/70 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <span>
              Preview only. Never enter a real recovery phrase here. It is not verified or stored.
            </span>
          </div>
          <label className="block space-y-2 text-xs text-muted-foreground">
            Recovery phrase
            <Textarea
              value={phrase}
              onChange={(event) => setPhrase(event.target.value)}
              rows={3}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="12 or 24 words separated by spaces"
              className="font-mono text-sm text-foreground"
            />
          </label>
          <p
            className={cn(
              "text-xs",
              words === 0 || phraseOk ? "text-muted-foreground" : "text-destructive",
            )}
            aria-live="polite"
          >
            {words === 0
              ? "Paste or type your phrase."
              : phraseOk
                ? `${words} words`
                : `${words} words. A phrase has 12 or 24.`}
          </p>
          <Button type="submit" className="w-full" disabled={!phraseOk}>
            Continue
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (nameError) return;
            // The phrase is dropped before the wallet is added; only the illustrative account remains.
            setPhrase("");
            onDone(addWallet(name, networkId, "imported"));
          }}
        >
          <ChainChoice value={chainId} activeNetworkId={activeNetworkId} onChange={setChainId} />
          <WalletNameCard name={name} onNameChange={setName} error={nameError} where={where} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={Boolean(nameError)}>
              <Download />
              Import wallet
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * The "+" beside the wallet selector: create an additional wallet in a dialog, or open the import page.
 * Both are client-only previews that add an illustrative account; nothing is created on-chain.
 */
export function AddWalletMenu({
  networkId,
  onAdded,
}: {
  /** Network open on the wallet screen. It is the default for a new wallet, which may pick another blockchain. */
  networkId: string;
  onAdded: (wallet: PreviewWallet) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"choose" | "create">("choose");

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setView("choose");
      }}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Add wallet"
        title="Add wallet"
        className={rowActionClass}
        onClick={() => {
          // Always start from the Create / Import choice, even after a previous Create.
          setView("choose");
          setOpen(true);
        }}
      >
        <Plus />
      </Button>
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl px-5 pb-8 pt-6"
      >
        {view === "choose" ? (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>Add wallet</SheetTitle>
              <SheetDescription>
                Create a new wallet or import one you already have.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setView("create")}
                className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-secondary/60"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Plus className="!h-4 !w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">Create a new wallet</span>
                  <span className="block text-xs text-muted-foreground">
                    Base USDC or QDay USD8
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/wallet/import", search: { network: networkId } });
                }}
                className="flex items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-secondary/60"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground/10 text-foreground">
                  <Download className="!h-4 !w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">Import a new wallet</span>
                  <span className="block text-xs text-muted-foreground">Use a recovery phrase</span>
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>Create a new Main Wallet</SheetTitle>
              <SheetDescription>Choose the blockchain for your new smart account</SheetDescription>
            </SheetHeader>
            <CreateWalletForm
              networkId={networkId}
              onDone={(wallet) => {
                setOpen(false);
                onAdded(wallet);
                toast.success("Wallet created", {
                  description: `${wallet.name} added as a preview. Nothing was created on-chain.`,
                });
              }}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Renames an existing wallet. The wallet's own current name is not a duplicate of itself. */
export function RenameWalletDialog({
  wallet,
  open,
  onOpenChange,
}: {
  wallet: PreviewWallet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { wallets, renameWallet } = useWalletPreview();
  const [name, setName] = useState(wallet.name);
  const others = wallets.filter((item) => item.id !== wallet.id);
  const error = validateWalletName(name, others);
  const unchanged = name.trim() === wallet.name;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setName(wallet.name);
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename wallet</DialogTitle>
          <DialogDescription>Only the name changes. The address stays the same.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (error || unchanged) return;
            renameWallet(wallet.id, name);
            onOpenChange(false);
            toast.success("Wallet renamed", { description: `Now called ${name.trim()}.` });
          }}
        >
          <label className="block space-y-2 text-xs text-muted-foreground">
            Wallet name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(error)}
              maxLength={WALLET_NAME_MAX}
              autoComplete="off"
              autoFocus
              className="text-foreground"
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={Boolean(error) || unchanged}>
            Save name
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
