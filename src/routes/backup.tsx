import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, EyeOff, Fingerprint, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadPhrase } from "@/lib/phrase";

const REVEAL_SECONDS = 30;
type Secret = "phrase" | "key";
// Demo placeholder only: not derived from anything and not a usable private key.
const SAMPLE_KEY = "0x" + "demo".repeat(16);

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
  const [authing, setAuthing] = useState<Secret | null>(null);
  const [shown, setShown] = useState<{ secret: Secret; left: number } | null>(null);
  const [phrase, setPhrase] = useState<string[]>([]);
  useEffect(() => setPhrase(loadPhrase()), []);
  useEffect(() => {
    if (!shown) return;
    if (shown.left <= 0) return setShown(null);
    const timer = setTimeout(() => setShown({ ...shown, left: shown.left - 1 }), 1000);
    return () => clearTimeout(timer);
  }, [shown]);
  const reveal = (secret: Secret) => {
    setAuthing(secret);
    setTimeout(() => {
      setAuthing(null);
      setShown({ secret, left: REVEAL_SECONDS });
    }, 1000);
  };
  const card = (secret: Secret, title: string, button: string) => (
    <section className="mt-4 rounded-2xl border bg-card p-4" aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {shown?.secret === secret ? (
        <>
          {secret === "phrase" ? (
            <ol className="mt-3 grid grid-cols-3 gap-2">
              {phrase.map((word, i) => (
                <li key={i} className="rounded-lg bg-secondary/60 px-2 py-1.5 text-xs">
                  <span className="mr-1 text-muted-foreground">{i + 1}</span>
                  {word}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 break-all rounded-lg bg-secondary/60 p-3 font-mono text-xs">
              {SAMPLE_KEY}
            </p>
          )}
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
        <Button
          variant="outline"
          className="mt-3 w-full"
          disabled={authing !== null || shown !== null}
          onClick={() => reveal(secret)}
        >
          {authing === secret ? (
            <>
              <Loader2 className="animate-spin" />
              Authenticating…
            </>
          ) : (
            <>
              <Fingerprint />
              {button}
            </>
          )}
        </Button>
      )}
    </section>
  );
  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
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
          <p>
            Keep these secrets offline. Anyone with your recovery phrase or owner key can control
            every AA account created from this backup.
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The owner key is not a private key for the AA contract address. Importing it into another
          wallet does not automatically restore your AA wallet.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Account index: 0</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Device authentication is required. Secrets hide after 30 seconds or when you leave this
          screen. Clipboard copying is disabled.
        </p>
        {card("phrase", "Recovery phrase", "Authenticate to view recovery phrase")}
        {card("key", "Owner private key", "Authenticate to view owner private key")}
        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          Preview only · the phrase is a demo sample and the key is a placeholder
        </p>
      </main>
    </div>
  );
}
