import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import logo from "@/assets/trellis-icon-blue.png";
import { ShieldCheck, Plus, Download, ChevronRight, Fingerprint } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Create Wallet — Trellis Wallet" },
      { name: "description", content: "Create or import your self-custody Trellis Wallet in seconds." },
      { property: "og:title", content: "Create Wallet — Trellis Wallet" },
      { property: "og:description", content: "Create or import your self-custody Trellis Wallet in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateWallet,
});

function TrellisMark() {
  return <img src={logo} alt="Trellis logo" className="h-8 w-8 rounded-lg" />;
}

const options = [
  { id: "new", icon: Plus, title: "Create a new wallet", desc: "Generate a fresh 12-word recovery phrase" },
  { id: "import", icon: Download, title: "Import existing wallet", desc: "Use a recovery phrase or private key" },
] as const;

function CreateWallet() {
  const [selected, setSelected] = useState<string>("new");
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <main className="relative flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-hero px-6 pb-8 pt-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <TrellisMark />
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">Trellis</span>
          </div>
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
          <img src={logo} alt="Trellis Wallet" className="animate-floaty h-28 w-28 rounded-[2rem] shadow-glow" />
        </div>

        <section className="mt-8 text-center">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight">
            Grow your <span className="text-accent">on-chain</span> life.
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
            Your keys, your crypto. Set up Trellis Wallet in under a minute.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          {options.map(({ id, icon: Icon, title, desc }) => {
            const active = selected === id;
            return (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                  active ? "border-primary/60 bg-primary/10" : "glass hover:border-foreground/20"
                }`}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-xs text-muted-foreground">{desc}</span>
                </span>
                <ChevronRight className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
              </button>
            );
          })}
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Trellis never stores your recovery phrase. Write it down and keep it offline — it's the only way to restore your wallet.
          </p>
        </div>

        <div className="mt-auto pt-8">
          <label className="mb-4 flex cursor-pointer items-center gap-3 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            I agree to the <span className="text-foreground underline underline-offset-2">Terms</span> and{" "}
            <span className="text-foreground underline underline-offset-2">Privacy Policy</span>
          </label>
          <button
            disabled={!agreed}
            onClick={() => selected === "new" && navigate({ to: "/recovery" })}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-display text-base font-semibold text-primary-foreground shadow-glow transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
          >
            {selected === "new" ? "Create wallet" : selected === "import" ? "Import wallet" : "Connect device"}
            <ChevronRight className="h-5 w-5" />
          </button>
          <button className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm text-muted-foreground hover:text-foreground">
            <Fingerprint className="h-4 w-4" /> Protect with Face ID after setup
          </button>
        </div>
      </main>
    </div>
  );
}
