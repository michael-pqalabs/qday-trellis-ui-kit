import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown, EyeOff, Fingerprint, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useWalletPreview } from "@/components/wallet-preview-provider";
import { loadPhrase } from "@/lib/phrase";

const REVEAL_SECONDS = 30;

export const Route = createFileRoute("/backup")({
  head: () => ({
    meta: [
      { title: "Wallet backup — Trellis Wallet" },
      {
        name: "description",
        content: "View the recovery phrase and owner key in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Wallet backup — Trellis Wallet" },
      {
        property: "og:description",
        content: "View the recovery phrase and owner key in the Trellis Wallet preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BackupPage,
});

function BackupPage() {
  const { quantumMode } = useWalletPreview();
  const [authing, setAuthing] = useState(false);
  const [shown, setShown] = useState<{ left: number } | null>(null);
  const [phrase, setPhrase] = useState<string[]>([]);
  useEffect(() => setPhrase(loadPhrase()), []);
  useEffect(() => {
    if (!shown) return;
    if (shown.left <= 0) return setShown(null);
    const timer = setTimeout(() => setShown({ left: shown.left - 1 }), 1000);
    return () => clearTimeout(timer);
  }, [shown]);
  // One device authentication unlocks the page's secret.
  const reveal = () => {
    setAuthing(true);
    setTimeout(() => {
      setAuthing(false);
      setShown({ left: REVEAL_SECONDS });
    }, 1000);
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
          <h1 className="font-display text-xl font-semibold">Wallet backup</h1>
        </header>
        <div
          role="note"
          className="mt-5 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-xs"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>Keep this phrase offline. Anyone with it can control your wallet.</p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Device authentication is required. The phrase hides after 30 seconds or when you leave
          this screen. Clipboard copying is disabled.
        </p>
        <section className="mt-4 rounded-2xl border bg-card p-4" aria-label="Recovery phrase">
          <h2 className="text-sm font-semibold">Recovery phrase</h2>
          {shown ? (
            <>
              <ol className="mt-3 grid grid-cols-3 gap-2">
                {phrase.map((word, i) => (
                  <li key={i} className="rounded-lg bg-secondary/60 px-2 py-1.5 text-xs">
                    <span className="mr-1 text-muted-foreground">{i + 1}</span>
                    {word}
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground" role="timer">
                  Hides in {shown.left}s
                </span>
                <Button variant="outline" size="sm" onClick={() => setShown(null)}>
                  <EyeOff />
                  Hide now
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" className="mt-3 w-full" disabled={authing} onClick={reveal}>
              {authing ? (
                <>
                  <Loader2 className="animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <Fingerprint />
                  Authenticate to view recovery phrase
                </>
              )}
            </Button>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {quantumMode === "hybrid"
              ? "This phrase also restores your ML-DSA-65 key."
              : "Your wallet uses Classic (ECDSA) protection, so there is no ML-DSA-65 key to restore."}
          </p>
        </section>
        <Collapsible className="mt-4 rounded-2xl border bg-card">
          <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 p-4 text-left text-sm font-semibold">
            Technical details
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
            <p>
              Your AA account is controlled by an owner key made from this phrase. The owner key is
              not a private key for the AA contract address, so importing it into another wallet
              does not automatically restore your AA wallet.
            </p>
            <p>Account index: 0</p>
          </CollapsibleContent>
        </Collapsible>
        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          Preview only · the phrase is a demo sample
        </p>
      </main>
    </div>
  );
}
