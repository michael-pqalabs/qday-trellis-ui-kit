import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { shortAddress } from "@/lib/wallet-preview";

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT = /^\d{1,12}(?:\.\d{1,6})?$/;
const GAS_SERVICE = "0x00000000000000000000000000000000000a5e11";
const MAX_FEE = "0.04";
type Saved = { id: string; label: string; amount: string; status: "confirmed" | "unconfirmed" };

export const Route = createFileRoute("/token-approvals")({
  head: () => ({
    meta: [
      { title: "Token approvals — Trellis Wallet" },
      {
        name: "description",
        content: "Preview of checking, granting and revoking a token allowance for one spender.",
      },
      { property: "og:title", content: "Token approvals — Trellis Wallet" },
      { property: "og:description", content: "Inspect and change one token allowance. Preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TokenApprovalsPage,
});

function TokenApprovalsPage() {
  const { wallets } = useWalletPreview();
  const main = wallets[0];
  const [token, setToken] = useState("");
  const [spender, setSpender] = useState("");
  const [errors, setErrors] = useState<{ token?: string; spender?: string; amount?: string }>({});
  const [allowance, setAllowance] = useState<{ amount: string; block: number } | null>(null);
  const [next, setNext] = useState("");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [failNext, setFailNext] = useState(false);
  const isGasService = spender.trim().toLowerCase() === GAS_SERVICE;
  const check = () => {
    const found: typeof errors = {};
    if (!ADDRESS.test(token.trim())) found.token = "Enter a valid 0x token contract address.";
    if (!ADDRESS.test(spender.trim())) found.spender = "Enter a valid 0x spender address.";
    setErrors(found);
    setReview(false);
    if (Object.keys(found).length) return setAllowance(null);
    // Illustrative: a spender ending in an even digit has a sample allowance, otherwise none.
    const even = "02468aceACE".includes(spender.trim().slice(-1));
    setAllowance({ amount: even ? "50" : "0", block: 1_204_118 });
    setNext("");
  };
  const current = allowance ? Number(allowance.amount) : 0;
  const reviewChange = () => {
    if (!AMOUNT.test(next.trim()))
      return setErrors({ amount: "Enter an amount, up to 6 decimals." });
    if (current > 0 && Number(next) > 0)
      return setErrors({
        amount:
          "To change a nonzero allowance, revoke it first (enter 0) and wait for confirmation.",
      });
    if (Number(next) === current)
      return setErrors({ amount: "This is already the current allowance." });
    setErrors({});
    setReview(true);
  };
  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setReview(false);
      const revoke = Number(next) === 0;
      const ok = !failNext;
      setSaved({
        id: crypto.randomUUID().slice(0, 8),
        label: revoke ? "Revoke allowance" : "Grant allowance",
        amount: next,
        status: ok ? "confirmed" : "unconfirmed",
      });
      if (ok) setAllowance({ amount: next, block: 1_204_121 });
      setNext("");
      toast[ok ? "success" : "error"](ok ? "Approval confirmed" : "Result not confirmed", {
        description: "Preview only: nothing was sent.",
      });
    }, 1400);
  };
  const fieldCls = (bad?: string) => (bad ? "border-destructive" : undefined);
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to settings">
            <Link to="/settings">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Token approvals</h1>
        </header>
        <p className="mt-4 text-xs text-muted-foreground">
          Inspect a specific token and spender. This is not a complete list of your authorizations.
          Agent spending sessions are managed in Agentic Payments.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Changes use your linked Main Wallet and native QDAY for gas. To change a nonzero
          allowance, revoke it first and wait for confirmation.
        </p>
        <section className="mt-5 space-y-3 rounded-2xl border bg-card p-4">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Wallet</span>
            <span className="font-medium">
              {main ? `${main.name} · ${shortAddress(main.address)}` : "—"}
            </span>
          </div>
          <div>
            <Label htmlFor="ta-token" className="mb-2 block">
              Token contract
            </Label>
            <Input
              id="ta-token"
              placeholder="0x…"
              value={token}
              aria-invalid={errors.token ? true : undefined}
              className={fieldCls(errors.token)}
              onChange={(e) => setToken(e.target.value)}
            />
            {errors.token && (
              <p role="alert" className="mt-1 text-[11px] text-destructive">
                {errors.token}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="ta-spender" className="mb-2 block">
              Spender
            </Label>
            <Input
              id="ta-spender"
              placeholder="0x…"
              value={spender}
              aria-invalid={errors.spender ? true : undefined}
              className={fieldCls(errors.spender)}
              onChange={(e) => setSpender(e.target.value)}
            />
            {errors.spender && (
              <p role="alert" className="mt-1 text-[11px] text-destructive">
                {errors.spender}
              </p>
            )}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-1 h-auto px-0 py-0 text-[11px]"
              onClick={() => setSpender(GAS_SERVICE)}
            >
              Use the wallet gas service (sample)
            </Button>
          </div>
          <Button className="w-full" onClick={check}>
            Check allowance
          </Button>
        </section>
        {allowance && (
          <section className="mt-4 rounded-2xl border bg-card p-4" aria-label="Allowance">
            <p className="text-xs text-muted-foreground">Current allowance</p>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {allowance.amount} <span className="text-sm text-muted-foreground">tokens</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Checked at block {allowance.block}</p>
            {isGasService && (
              <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
                This spender is a wallet gas service. Revoking or reducing its allowance may prevent
                USD8-paid operations until you authorize it again.
              </p>
            )}
            <Label htmlFor="ta-next" className="mb-2 mt-4 block">
              New total allowance (0 to revoke)
            </Label>
            <Input
              id="ta-next"
              inputMode="decimal"
              value={next}
              aria-invalid={errors.amount ? true : undefined}
              className={fieldCls(errors.amount)}
              onChange={(e) => {
                setNext(e.target.value);
                setErrors({});
                setReview(false);
              }}
            />
            {errors.amount && (
              <p role="alert" className="mt-1 text-[11px] text-destructive">
                {errors.amount}
              </p>
            )}
            {!review && (
              <Button variant="outline" className="mt-3 w-full" onClick={reviewChange}>
                Review change
              </Button>
            )}
            {review && (
              <div className="mt-3 space-y-3 rounded-xl bg-primary/5 p-3">
                <p className="text-sm font-semibold">
                  {Number(next) === 0 ? "Revoke allowance" : "Grant allowance"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {current} → {next} for {shortAddress(spender.trim())}
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Maximum gas fee</span>
                  <span className="font-medium">{MAX_FEE} QDAY</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3 py-2">
                  <Label
                    htmlFor="ta-fail"
                    className="text-[10px] font-normal leading-tight text-muted-foreground"
                  >
                    Preview only
                    <br />
                    Result is not confirmed
                  </Label>
                  <Checkbox
                    id="ta-fail"
                    checked={failNext}
                    onCheckedChange={(v) => setFailNext(v === true)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => setReview(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1" disabled={busy} onClick={submit}>
                    {busy ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Authenticate and submit"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}
        {saved && (
          <section
            className="mt-4 rounded-2xl border bg-card p-4"
            aria-label="Saved approval operation"
          >
            <h2 className="text-sm font-semibold">Saved approval operation</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {saved.label} · {saved.amount} (amount in token units)
            </p>
            {saved.status === "confirmed" ? (
              <p role="status" className="mt-2 text-xs text-success">
                Confirmed: matching Approval event found. Refresh the allowance to check its current
                value.
              </p>
            ) : (
              <>
                <p role="alert" className="mt-2 text-xs text-destructive">
                  Unconfirmed. Check the current allowance; do not assume it changed.
                </p>
                <div className="mt-3 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSaved({ ...saved, status: "confirmed" });
                      toast.info("Checked on-chain result", { description: "Preview only." });
                    }}
                  >
                    Check on-chain result
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setFailNext(false);
                      setSaved({ ...saved, status: "confirmed" });
                    }}
                  >
                    Authenticate and resend original
                  </Button>
                </div>
              </>
            )}
          </section>
        )}
        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          Preview only · no allowance is read or changed
        </p>
      </main>
    </div>
  );
}
