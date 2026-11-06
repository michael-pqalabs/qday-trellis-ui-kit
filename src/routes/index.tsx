import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TrellisLockup } from "@/components/trellis-lockup";
import { ShieldCheck, ShieldAlert, Plus, Download, ChevronRight, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useQDayPreview } from "@/components/qday-preview-provider";
import { isPhraseLengthValid, phraseWordCount } from "@/lib/wallet-preview";
import { clearPhrase } from "@/lib/phrase";
import { cn } from "@/lib/utils";
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
  const [importPhrase, setImportPhrase] = useState("");
  const { update } = useQDayPreview();
  const navigate = useNavigate();
  const importWords = phraseWordCount(importPhrase);
  const importOk = isPhraseLengthValid(importPhrase);
  const [agreed, setAgreed] = useState(false);
  const [introFailed, setIntroFailed] = useState(false);
  const introRef = useRef<HTMLVideoElement>(null);
  // The intro has a transparent background. Chrome and Firefox read it from the VP9 WebM, but
  // Safari (and every browser on iOS) ignores WebM alpha and paints it black, so WebKit gets an
  // HEVC-with-alpha copy instead. Chrome would also pick HEVC and lose the alpha, so the source is
  // chosen by engine rather than by codec support. Set after mount to keep server markup stable.
  const [introSrc, setIntroSrc] = useState<string | null>(null);
  // The video can fail before hydration, in which case onError never reaches React.
  useEffect(() => {
    const ua = navigator.userAgent;
    const webkit =
      /AppleWebKit/.test(ua) &&
      (!/Chrome|Chromium|Edg|Android/.test(ua) || /CriOS|FxiOS|EdgiOS/.test(ua));
    setIntroSrc(webkit ? "/trellis-intro-alpha.mov" : "/trellis-intro.webm");
    if (introRef.current?.error) setIntroFailed(true);
    // Brand kit: logo animations respect reduced motion and show the final frame (the static icon).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setIntroFailed(true);
  }, []);

  // Autoplay can be refused (iOS Low Power Mode, data saver). Show the static icon instead of a
  // frozen frame with a play button.
  useEffect(() => {
    if (!introSrc) return;
    introRef.current?.play().catch(() => setIntroFailed(true));
  }, [introSrc]);

  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="relative flex min-h-dvh w-full max-w-md flex-col justify-between gap-3 overflow-hidden bg-hero px-5 pb-5 pt-6 [@media(min-height:700px)]:gap-6 [@media(min-height:700px)]:pb-8">
        <header className="flex items-center justify-between">
          <TrellisLockup />
          <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Self-custody
          </span>
        </header>

        {/* Visual */}
        <div className="relative mx-auto grid size-[clamp(8rem,26dvh,14rem)] shrink-0 place-items-center">
          {/* A radial gradient, not a blurred circle: Safari clips CSS blur to the video's square when a
              transparent video sits on top, which showed as a lighter box in dark mode. */}
          <div className="pointer-events-none absolute -inset-16 bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--primary)_35%,transparent),transparent)]" />
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
            // Same frame and size as the video's last frame, so switching between them never jumps.
            <img
              src="/trellis-intro-poster.png"
              alt="Trellis Wallet"
              className="animate-floaty h-full w-full scale-150 object-contain"
            />
          ) : (
            <video
              ref={introRef}
              src={introSrc ?? undefined}
              autoPlay
              muted
              playsInline
              aria-label="Trellis Wallet"
              onError={() => setIntroFailed(true)}
              className="trellis-intro animate-floaty h-full w-full scale-150 object-contain"
            />
          )}
        </div>

        <section className="text-center">
          <h1 className="font-display text-2xl font-semibold leading-[1.05] min-[375px]:text-3xl tracking-tight">
            The post-quantum wallet built for you and your AI agents
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
            Send and receive safely today and into the quantum era
          </p>
        </section>

        <div>
          <label className="mb-4 flex cursor-pointer items-center gap-3 text-xs text-muted-foreground">
            <Checkbox
              checked={agreed}
              onCheckedChange={(value) => setAgreed(value === true)}
              aria-label="Agree to Terms and Privacy Policy"
            />
            <span>
              I agree to the{" "}
              <a
                href="https://example.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="https://example.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Privacy Policy
              </a>
            </span>
          </label>
          <Button
            disabled={!agreed}
            onClick={() => {
              clearPhrase(); // a new wallet always gets a new phrase
              navigate({ to: "/recovery" });
            }}
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
        <Dialog
          open={importOpen}
          onOpenChange={(open) => {
            setImportOpen(open);
            // The phrase is never kept: closing the dialog drops it.
            if (!open) setImportPhrase("");
          }}
        >
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
            <DialogHeader>
              <DialogTitle>Import existing wallet</DialogTitle>
              <DialogDescription>
                Enter the 12 or 24-word recovery phrase of your existing wallet.
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!importOk) return;
                // Preview only: the phrase is counted, never verified or stored.
                setImportPhrase("");
                setImportOpen(false);
                update((state) => ({ ...state, walletReady: true }));
                navigate({ to: "/wallet" });
              }}
            >
              <div className="flex items-start gap-2 rounded-lg bg-secondary/70 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                <ShieldAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <span>
                  Preview only. Never enter a real recovery phrase here. It is not verified or
                  stored.
                </span>
              </div>
              <label className="block space-y-2 text-xs text-muted-foreground">
                Recovery phrase
                <Textarea
                  value={importPhrase}
                  onChange={(event) => setImportPhrase(event.target.value)}
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
                  importWords === 0 || importOk ? "text-muted-foreground" : "text-destructive",
                )}
                aria-live="polite"
              >
                {importWords === 0
                  ? "Paste or type your phrase."
                  : importOk
                    ? `${importWords} words`
                    : `${importWords} words. A phrase has 12 or 24.`}
              </p>
              <Button type="submit" className="w-full" disabled={!importOk}>
                <Download />
                Import wallet
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
