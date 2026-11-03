import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TrellisLockup } from "@/components/trellis-lockup";
import logo from "@/assets/trellis-app-icon.svg";
import { ShieldCheck, Plus, Download, ChevronRight, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Create Wallet — Trellis Wallet" },
      {
        name: "description",
        content: "Create or import your self-custody Trellis Wallet in seconds.",
      },
      { property: "og:title", content: "Create Wallet — Trellis Wallet" },
      {
        property: "og:description",
        content: "Create or import your self-custody Trellis Wallet in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateWallet,
});

function CreateWallet() {
  const [importOpen, setImportOpen] = useState(false);
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [introFailed, setIntroFailed] = useState(false);
  const introRef = useRef<HTMLVideoElement>(null);
  // The video can fail before hydration, in which case onError never reaches React.
  useEffect(() => {
    if (introRef.current?.error) setIntroFailed(true);
    // Brand kit: logo animations respect reduced motion and show the final frame (the static icon).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setIntroFailed(true);
  }, []);

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-hero px-6 pb-8 pt-6">
        <header className="flex items-center justify-between">
          <TrellisLockup />
          <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Self-custody
          </span>
        </header>

        {/* Visual */}
        <div className="relative mx-auto mt-10 grid h-56 w-56 place-items-center">
          <div className="pointer-events-none absolute -inset-10 rounded-full bg-primary/35 blur-3xl" />
          <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-primary/40" />
          <div className="absolute inset-6 rounded-full border border-accent/25" />
          <div className="absolute inset-0 animate-spin-slow [animation-direction:reverse]">
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-glow" />
          </div>
          <div className="absolute inset-6 animate-spin-slow">
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
          </div>
          {/* The intro video is sized for its own padding; without the file, show the plain icon instead. */}
          {introFailed ? (
            <img
              src={logo}
              alt="Trellis Wallet"
              className="animate-floaty h-28 w-28 object-contain"
            />
          ) : (
            <video
              ref={introRef}
              src="/trellis-intro.webm"
              poster={logo}
              autoPlay
              muted
              playsInline
              aria-label="Trellis Wallet"
              onError={() => setIntroFailed(true)}
              className="animate-floaty h-56 w-56 scale-150 object-contain"
            />
          )}
        </div>

        <section className="mt-8 text-center">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Grow your <span className="text-accent">on-chain</span> life.
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
            Your keys, your crypto. Set up Trellis Wallet in under a minute.
          </p>
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Trellis never stores your recovery phrase. Write it down and keep it offline — it's the
            only way to restore your wallet.
          </p>
        </div>

        <div className="mt-auto pt-8">
          <label className="mb-4 flex cursor-pointer items-center gap-3 text-xs text-muted-foreground">
            <Checkbox
              checked={agreed}
              onCheckedChange={(value) => setAgreed(value === true)}
              aria-label="Agree to Terms and Privacy Policy"
            />
            <span>
              I agree to the{" "}
              <span className="text-foreground underline underline-offset-2">Terms</span> and{" "}
              <span className="text-foreground underline underline-offset-2">Privacy Policy</span>
            </span>
          </label>
          <Button
            disabled={!agreed}
            onClick={() => navigate({ to: "/recovery" })}
            className="h-14 w-full font-display text-base font-semibold"
          >
            <Plus />
            Create new wallet
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            disabled={!agreed}
            onClick={() => setImportOpen(true)}
            className="mt-3 h-14 w-full font-display text-base"
          >
            <Download />I already have a wallet
          </Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Fingerprint className="h-4 w-4" /> Protect with PassKey after setup
          </p>
        </div>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
            <DialogHeader>
              <DialogTitle>Import existing wallet</DialogTitle>
              <DialogDescription>
                Wallet import isn't connected in this preview. Never enter a real recovery phrase
                here.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setImportOpen(false)}>Got it</Button>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
