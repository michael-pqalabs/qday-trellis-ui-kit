import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Check, Eye, EyeOff, RefreshCw, ShieldAlert, ChevronRight, PenLine, WifiOff, UserX } from "lucide-react";
import { makePhrase, savePhrase } from "@/lib/phrase";

export const Route = createFileRoute("/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery Phrase — Trellis Wallet" },
      { name: "description", content: "Back up your 12-word secret recovery phrase for Trellis Wallet." },
      { property: "og:title", content: "Recovery Phrase — Trellis Wallet" },
      { property: "og:description", content: "Back up your 12-word secret recovery phrase for Trellis Wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Recovery,
});

function Recovery() {
  const [phrase, setPhrase] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const p = makePhrase();
    setPhrase(p);
    savePhrase(p);
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(phrase.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="relative flex min-h-screen w-full max-w-md flex-col bg-hero px-6 pb-8 pt-6">
        <header className="flex items-center justify-between">
          <Link to="/" aria-label="Back" className="glass grid h-10 w-10 place-items-center rounded-xl border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <span className="h-1.5 w-6 rounded-full bg-secondary" />
          </div>
          <span className="w-10 text-right text-xs text-muted-foreground">2/3</span>
        </header>

        <section className="mt-8">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
            Your secret <span className="text-accent">recovery phrase</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Write these 12 words down in order. They're the only way to restore your Trellis Wallet.
          </p>
        </section>

        <section className="relative mt-6">
          <div className={`glass grid grid-cols-2 gap-2.5 rounded-3xl border p-4 transition-all duration-500 ${revealed ? "" : "select-none blur-md"}`}>
            {(phrase.length ? phrase : Array(12).fill("•••••")).map((w, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border bg-secondary/60 px-3 py-2.5">
                <span className="w-5 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="font-display font-medium">{w}</span>
              </div>
            ))}
          </div>
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                <Eye className="h-6 w-6" />
              </span>
              <span className="font-display font-semibold">Tap to reveal</span>
              <span className="text-xs text-muted-foreground">Make sure no one is watching your screen</span>
            </button>
          )}
        </section>

        <div className="mt-3 flex gap-2">
          <button onClick={copy} disabled={!revealed} className="glass flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm disabled:opacity-40">
            {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={() => setRevealed((r) => !r)} className="glass flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm">
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {revealed ? "Hide" : "Show"}
          </button>
          <button onClick={() => { const p = makePhrase(); setPhrase(p); savePhrase(p); setRevealed(false); }} aria-label="New phrase" className="glass grid h-11 w-11 place-items-center rounded-xl border">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-6 space-y-3">
          {[
            { icon: PenLine, t: "Write it on paper and store it somewhere safe" },
            { icon: WifiOff, t: "Never save it in screenshots, email or the cloud" },
            { icon: UserX, t: "Trellis support will never ask for your phrase" },
          ].map(({ icon: I, t }) => (
            <li key={t} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-accent"><I className="h-4 w-4" /></span>
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-muted-foreground">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
            <span className="flex gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
              I understand that if I lose this phrase, I lose access to my funds forever.
            </span>
          </label>
          <button
            onClick={() => navigate({ to: "/confirm" })}
            disabled={!saved || !revealed}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-base font-semibold text-primary-foreground shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            I've saved it <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
