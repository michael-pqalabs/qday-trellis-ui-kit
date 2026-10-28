import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ShieldCheck, Sparkles, RotateCcw, ChevronRight, PartyPopper } from "lucide-react";
import { loadPhrase, shuffle, distractors, pickSpots, clearPhrase } from "@/lib/phrase";
import { Button } from "@/components/ui/button";
import { useQDayPreview } from '@/components/qday-preview-provider';

export const Route = createFileRoute("/confirm")({
  head: () => ({
    meta: [
      { title: "Confirm Phrase — Trellis Wallet" },
      { name: "description", content: "Confirm three words from your recovery phrase to finish setting up Trellis Wallet." },
      { property: "og:title", content: "Confirm Phrase — Trellis Wallet" },
      { property: "og:description", content: "Confirm three words from your recovery phrase to finish setting up Trellis Wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfirmPhrase,
});

const ORDINAL = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

function ConfirmPhrase() {
  const { update } = useQDayPreview();
  const navigate = useNavigate();
  const [phrase, setPhrase] = useState<string[]>([]);
  const [spots, setSpots] = useState<number[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([null, null, null]);
  const [used, setUsed] = useState<string[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const p = loadPhrase();
    setPhrase(p);
    setSpots(pickSpots(p));
  }, []);

  // The three words we expect, in slot order.
  const checks = useMemo(() => spots.map((i) => phrase[i] ?? ""), [phrase, spots]);

  const bank = useMemo(() => {
    if (!phrase.length || spots.length !== 3) return [] as string[];
    return shuffle([...checks, ...distractors(6, phrase)]);
  }, [phrase, spots, checks]);

  const active = answers.findIndex((a) => a === null);
  const complete = active === -1;

  const tap = (word: string) => {
    if (done || active === -1 || used.includes(word)) return;
    const next = [...answers];
    next[active] = word;
    setAnswers(next);
    setUsed((u) => [...u, word]);
    setWrong([]);
  };

  const confirm = () => {
    const bad = answers.map((w, i) => (w === checks[i] ? -1 : i)).filter((i) => i >= 0);
    if (!bad.length) {
      clearPhrase();
      update(state => ({ ...state, walletReady: true }));
      setDone(true);
      return;
    }
    const badWords = bad.map((i) => answers[i] ?? "");
    setWrong(bad);
    setMisses((m) => m + 1);
    setTimeout(() => {
      setAnswers((a) => a.map((w, i) => (bad.includes(i) ? null : w)));
      setUsed((u) => u.filter((w) => !badWords.includes(w)));
      setWrong([]);
    }, 620);
  };

  const clearSlot = (i: number) => {
    if (done || answers[i] === null) return;
    const word = answers[i] as string;
    setAnswers((a) => a.map((w, j) => (j === i ? null : w)));
    setUsed((u) => u.filter((w) => w !== word));
  };

  const reset = () => {
    setAnswers([null, null, null]);
    setUsed([]);
    setWrong([]);
  };

  if (done) {
    return (
      <div className="flex min-h-screen justify-center bg-background">
        <main className="relative flex min-h-screen w-full max-w-md flex-col bg-hero px-6 pb-8 pt-6">
          <header className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl border text-accent">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-6 rounded-full bg-primary" />
              <span className="h-1.5 w-6 rounded-full bg-primary" />
              <span className="h-1.5 w-6 rounded-full bg-primary" />
            </div>
            <span className="w-10 text-right text-xs text-muted-foreground">3/3</span>
          </header>

          <section className="mt-auto mb-auto text-center">
            <div className="mx-auto grid h-24 w-24 animate-bloom place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
                <Check className="h-8 w-8" strokeWidth={3} />
              </span>
            </div>
            <h1 className="mt-7 font-display text-3xl font-semibold leading-tight tracking-tight">
              Your wallet is <span className="text-accent">ready</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
              Phrase confirmed and backed up. Trellis never stored a copy of it.
            </p>

            <div className="mt-7 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              {misses === 0 ? "First try — no mistakes" : `${misses} wrong tap${misses > 1 ? "s" : ""} along the way`}
            </div>
          </section>

          <div className="mt-auto">
            <Button
              onClick={() => {
                clearPhrase();
                navigate({ to: "/wallet" });
              }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-base font-semibold text-primary-foreground shadow-glow transition-all active:scale-[0.98]"
            >
              <PartyPopper className="h-5 w-5" /> Open Trellis
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Keep your phrase offline — it's the only way back in.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="relative flex min-h-screen w-full max-w-md flex-col bg-hero px-6 pb-8 pt-6">
        <header className="flex items-center justify-between">
          <Link to="/recovery" aria-label="Back" className="glass grid h-10 w-10 place-items-center rounded-xl border">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <span className="h-1.5 w-6 rounded-full bg-primary" />
          </div>
          <span className="w-10 text-right text-xs text-muted-foreground">3/3</span>
        </header>

        <section className="mt-8">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
            Confirm your <span className="text-accent">phrase</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tap the words that sit in positions {spots.map((s) => s + 1).join(", ") || "…"} of your phrase.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          {spots.map((spot, i) => {
            const filled = answers[i];
            const correct = filled !== null && filled === checks[i];
            const bad = wrong.includes(i);
            return (
              <button
                key={spot}
                onClick={() => clearSlot(i)}
                className={`flex h-14 w-full items-center gap-3 rounded-2xl border px-4 text-left transition-all ${
                  bad
                    ? "animate-shake border-destructive/60 bg-destructive/10"
                    : correct
                      ? "animate-pop border-primary/50 bg-primary/10"
                      : active === i
                        ? "border-primary/40 bg-secondary/60"
                        : "glass border-dashed"
                }`}
              >
                <span className="w-14 shrink-0 text-xs text-muted-foreground">{ORDINAL(spot + 1)} word</span>
                <span className={`flex-1 font-display text-lg font-medium ${filled ? "" : "text-muted-foreground/50"}`}>
                  {filled ?? "tap a word below"}
                </span>
                {correct ? (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground/40">{i + 1}/3</span>
                )}
              </button>
            );
          })}
        </section>

        <section className="mt-6">
          <div className="flex flex-wrap gap-2">
            {bank.map((word) => {
              const spent = used.includes(word);
              return (
                <button
                  key={word}
                  disabled={spent}
                  onClick={() => tap(word)}
                  className={`rounded-xl border px-4 py-2.5 font-display text-sm font-medium transition-all active:scale-95 ${
                    spent
                      ? "border-transparent bg-secondary/30 text-muted-foreground/30 line-through"
                      : "glass hover:border-primary/50"
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
          <span>
            {wrong.length
              ? "Those words don't match your phrase — tap them again."
              : misses > 1
                ? "No rush — go back to the phrase any time and try again."
                : "We only check three words, so nobody watching can copy your whole phrase."}
          </span>
        </div>

        <div className="mt-auto pt-8">
          <div className="mb-4 flex items-center justify-between text-xs">
            <Link to="/recovery" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Not sure? See the phrase again
            </Link>
            <button onClick={reset} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
          </div>
          <button
            onClick={confirm}
            disabled={!complete}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-base font-semibold text-primary-foreground shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            Confirm phrase <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </main>
    </div>
  );
}
