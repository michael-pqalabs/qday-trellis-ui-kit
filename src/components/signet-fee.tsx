import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CircleAlert, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { chainForNetwork, describeNetwork, signetPassFee } from "@/lib/wallet-preview";
import { cn } from "@/lib/utils";

const PREVIEW_ENOUGH_BALANCE = 10;
const money = (value: number) => value.toFixed(2);

const INTRO =
  "Creating your SignetPass requires a one-time smart-contract deployment fee, charged on your Main Wallet.";

/** The fee card, balance check, actions and preview switch shared by the page and dialog versions. */
function FeeBody({
  cancelTo,
  onAccept,
}: {
  cancelTo: "/wallet" | "/agentic";
  onAccept: () => void;
}) {
  const [balance, setBalance] = useState<"enough" | "low">("enough");
  const { networkId } = useWalletPreview();
  const { amount, token } = signetPassFee(chainForNetwork(networkId).id);
  const enough = balance === "enough";
  const available = enough ? PREVIEW_ENOUGH_BALANCE : 0;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="px-4 py-4 text-center">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">
            Deployment fee
          </p>
          <p className="mt-1 flex items-baseline justify-center gap-2 font-display font-semibold tabular-nums">
            <span className="text-3xl leading-none">{money(amount)}</span>
            <span className="text-sm text-muted-foreground">{token}</span>
          </p>
        </div>
        <dl className="space-y-2.5 border-t border-divider px-4 py-3.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Main Wallet balance</dt>
            <dd className="flex items-center gap-2 font-medium tabular-nums">
              {!enough && (
                <CircleAlert className="h-4 w-4 text-destructive" aria-label="Not enough" />
              )}
              {money(available)} {token}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Remaining after fee</dt>
            <dd className="font-medium tabular-nums">
              {enough ? `${money(available - amount)} ${token}` : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {!enough && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-semibold text-destructive">Not enough {token}</p>
            <p className="mt-0.5 leading-relaxed text-muted-foreground">
              You don’t have enough {token} in your Main Wallet to cover the creation fee. Top up to
              continue.
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-11 text-sm">
          <Link to={cancelTo}>Cancel</Link>
        </Button>
        {enough ? (
          <Button className="h-11 text-sm" onClick={onAccept}>
            OK
          </Button>
        ) : (
          <Button asChild className="h-11 text-sm">
            <Link
              to="/receive"
              search={{ wallet: "main", token: token.toLowerCase(), network: networkId }}
            >
              Top-Up {token}
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2.5">
        <span className="text-[10px] leading-tight text-muted-foreground">
          Preview only
          <br />
          Balance
        </span>
        <div
          className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-0.5"
          role="radiogroup"
          aria-label="Preview balance"
        >
          {(
            [
              ["enough", "Enough"],
              ["low", "Not enough"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={balance === value}
              onClick={() => setBalance(value)}
              className={cn(
                "h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors",
                balance === value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Full-page version, shown before the first sign-in setup: creating a SignetPass costs a smart contract
 * deployment fee charged on the Main Wallet. The balances are illustrative, so a preview switch shows
 * both outcomes.
 */
export function DeploymentFeeNotice({
  title,
  subtitle,
  cancelTo,
  onAccept,
}: {
  title: string;
  subtitle: string;
  /** Where Cancel goes. */
  cancelTo: "/wallet" | "/agentic";
  onAccept: () => void;
}) {
  return (
    <section className="pb-32 pt-6" aria-labelledby="fee-title">
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Wallet className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 id="fee-title" className="font-display text-xl font-semibold leading-tight">
            {title}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className="mb-5 mt-4 text-xs leading-relaxed text-muted-foreground">{INTRO}</p>
      <FeeBody cancelTo={cancelTo} onAccept={onAccept} />
    </section>
  );
}

/**
 * Dialog version, opened over the screen it leads to (for example the Create SignetPass form), so the
 * notice is a step in the flow instead of a bare page. Closing it counts as Cancel.
 */
export function DeploymentFeeDialog({
  open,
  title,
  cancelTo,
  onAccept,
}: {
  open: boolean;
  title: string;
  cancelTo: "/wallet" | "/agentic";
  onAccept: () => void;
}) {
  const navigate = useNavigate();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && open) navigate({ to: cancelTo });
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm gap-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{INTRO}</DialogDescription>
        </DialogHeader>
        <FeeBody cancelTo={cancelTo} onAccept={onAccept} />
      </DialogContent>
    </Dialog>
  );
}

/** Transaction details shown before anything is confirmed. Nothing is sent or charged in the preview. */
export function TransactionConfirm({
  open,
  onOpenChange,
  action,
  details = [],
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the transaction does, e.g. "Deploy spending wallet smart contract". */
  action: string;
  /** Extra rows shown after the action, e.g. the SignetPass name. */
  details?: readonly (readonly [string, string])[];
  onConfirm: () => void;
}) {
  const { networkId } = useWalletPreview();
  const fee = signetPassFee(chainForNetwork(networkId).id);
  const rows: (readonly [string, string])[] = [
    ["Action", action],
    ...details,
    ["Network", describeNetwork(networkId).label],
    ["Paid from", "Main Wallet"],
    ["Gas fee", `${fee.amount.toFixed(2)} ${fee.token}`],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm transaction</DialogTitle>
          <DialogDescription>
            Review the details. This is a preview: nothing is sent or charged.
          </DialogDescription>
        </DialogHeader>
        <dl className="divide-y divide-divider rounded-xl border bg-card text-xs">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 px-3.5 py-2.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words text-right font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
