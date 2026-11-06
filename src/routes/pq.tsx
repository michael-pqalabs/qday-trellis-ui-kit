import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STEPS = [
  "Derive the ML-DSA-65 key",
  "Bind the public key to your account",
  "Require ECDSA + ML-DSA signatures",
] as const;
const STEP_MS = 1100;

export const Route = createFileRoute("/pq")({
  head: () => ({
    meta: [
      { title: "Quantum protection — Trellis Wallet" },
      {
        name: "description",
        content: "Preview of Classic and Hybrid quantum protection modes for the wallet.",
      },
      { property: "og:title", content: "Quantum protection — Trellis Wallet" },
      { property: "og:description", content: "Switch from Classic to Hybrid. Preview only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PqPage,
});

function PqPage() {
  const [hybrid, setHybrid] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(-1);
  const running = step >= 0 && step < STEPS.length;
  const start = () => {
    setStep(0);
    STEPS.forEach((_, i) =>
      setTimeout(
        () => {
          setStep(i + 1);
          if (i === STEPS.length - 1) {
            setHybrid(true);
            setOpen(false);
            setStep(-1);
            toast.success("Hybrid protection is on", { description: "Preview only." });
          }
        },
        (i + 1) * STEP_MS,
      ),
    );
  };
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to settings">
            <Link to="/settings">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Quantum protection</h1>
        </header>
        <section className="mt-6 rounded-2xl border border-primary/20 bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
              {hybrid ? <ShieldCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Current mode</p>
              <h2 className="font-display text-lg font-semibold">
                {hybrid ? "Hybrid" : "Classic"}
              </h2>
            </div>
            <Badge variant={hybrid ? "default" : "secondary"}>
              {hybrid ? "ECDSA + ML-DSA-65" : "ECDSA"}
            </Badge>
          </div>
          {hybrid && (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b border-divider pb-2">
                <dt className="text-muted-foreground">Public key version</dt>
                <dd className="font-medium">1</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-divider pb-2">
                <dt className="text-muted-foreground">Key identifier</dt>
                <dd className="font-mono text-xs">0x4be1…c7a0</dd>
              </div>
              <div className="flex justify-between gap-4 pb-1">
                <dt className="text-muted-foreground">Verified on-chain</dt>
                <dd className="font-medium">Just now (sample)</dd>
              </div>
            </dl>
          )}
        </section>
        <section className="mt-6" aria-labelledby="hybrid-title">
          <h2 id="hybrid-title" className="text-sm font-semibold">
            Hybrid protection
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Every transaction needs two signatures, so a break in one scheme alone is not enough to
            move your funds. Your account address stays the same.
          </p>
          <ol className="mt-3 space-y-2">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-sm"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {hybrid ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
          {!hybrid && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hybrid and PQC are not available on Testnet yet. Requires wallet signing and on-chain
              verifier integration. No upgrade transaction is available yet.
            </p>
          )}
          {hybrid ? (
            <p role="status" className="mt-4 text-xs text-muted-foreground">
              Hybrid cannot be turned off in this version. Agent spending sessions are not supported
              in Hybrid mode yet, so each payment asks you to confirm.
            </p>
          ) : (
            <>
              <Button className="mt-4 w-full" disabled>
                Enable Hybrid · Not available yet
              </Button>
              <Button variant="outline" className="mt-2 w-full" onClick={() => setOpen(true)}>
                Preview the Hybrid flow
              </Button>
            </>
          )}
          {hybrid && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setHybrid(false)}
            >
              Reset preview
            </Button>
          )}
        </section>
        <Dialog open={open} onOpenChange={(o) => !running && setOpen(o)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Enable Hybrid protection?</DialogTitle>
              <DialogDescription>
                Transactions will need two signatures. Your address stays the same, and existing
                agent sessions stop working until you approve new ones. You confirm with your
                device.
              </DialogDescription>
            </DialogHeader>
            {running && (
              <ol className="space-y-2" aria-live="polite">
                {STEPS.map((label, i) => (
                  <li key={label} className="flex items-center gap-2 text-sm">
                    {i < step ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : i === step ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="h-4 w-4" />
                    )}
                    <span className={i > step ? "text-muted-foreground" : undefined}>{label}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="text-center text-[11px] text-muted-foreground">
              Preview only: nothing is sent and no key is created.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={running}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1" disabled={running} onClick={start}>
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
