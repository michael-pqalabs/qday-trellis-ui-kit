import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Link2, Plug, Plus, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Session = { id: string; startedAt: number; expiresAt: number; calls: number };
const HOUR = 3600000;

export const Route = createFileRoute("/connections")({
  head: () => ({
    meta: [
      { title: "Connections — Trellis Wallet" },
      {
        name: "description",
        content: "Connected dApps and scoped session permissions in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Connections — Trellis Wallet" },
      { property: "og:description", content: "Preview of dApp connections and sessions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnectionsPage,
});

const left = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function ConnectionsPage() {
  const [now, setNow] = useState(0);
  const [counter, setCounter] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [ended, setEnded] = useState<{ at: number; why: "revoked" | "expired" }[]>([]);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const active = session && session.expiresAt > now ? session : null;
  useEffect(() => {
    if (session && now && session.expiresAt <= now) {
      setEnded((e) => [{ at: session.expiresAt, why: "expired" }, ...e]);
      setSession(null);
    }
  }, [session, now]);
  const authorize = () => {
    const at = Date.now();
    setSession({ id: crypto.randomUUID(), startedAt: at, expiresAt: at + HOUR, calls: 0 });
    toast.success("Session authorized for one hour", {
      description: "Preview only: no permission was granted.",
    });
  };
  const increment = () => {
    setCounter((c) => c + 1);
    if (active) setSession({ ...active, calls: active.calls + 1 });
    else toast.info("Approve this call", { description: "Without a session each call asks you." });
  };
  const revoke = () => {
    if (!session) return;
    setEnded((e) => [{ at: Date.now(), why: "revoked" }, ...e]);
    setSession(null);
    toast.success("Session revoked");
  };
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to wallet">
            <Link to="/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Connections</h1>
        </header>
        <section className="mt-6 rounded-2xl border bg-card p-4" aria-label="Connected dApp">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Plug className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Trellis Counter</p>
              <p className="text-xs text-muted-foreground">A dApp for scoped permissions</p>
            </div>
            <Badge variant="secondary">Demo</Badge>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            WalletConnect integration is not available on Testnet yet.
          </p>
          <Button className="mt-3 w-full" disabled>
            <Plus />
            Connect dApp · Not available yet
          </Button>
        </section>
        <section className="mt-4 rounded-2xl border bg-card p-4" aria-label="Counter">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Counter</h2>
            <span className="font-display text-2xl font-semibold tabular-nums">{counter}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            An on-chain counter the dApp can call. The value here is only a preview.
          </p>
          <div className="mt-3 flex gap-3">
            <Button className="flex-1" onClick={increment}>
              Increment counter
            </Button>
            <Button variant="outline" className="flex-1" disabled={!!active} onClick={authorize}>
              <Timer />
              Authorize for one hour
            </Button>
          </div>
        </section>
        <section className="mt-6" aria-label="Sessions">
          <h2 className="text-xs font-semibold text-muted-foreground">Session permissions</h2>
          {active ? (
            <div className="mt-2 rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Counter calls only</p>
                <Badge>Active</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                No asset transfers. Expires in {left(active.expiresAt - now)} · {active.calls} call
                {active.calls === 1 ? "" : "s"} made
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-destructive"
                onClick={revoke}
              >
                <Trash2 />
                Revoke session
              </Button>
            </div>
          ) : (
            <div role="status" className="flex flex-col items-center py-8 text-center">
              <Link2 className="mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">No active session permissions</p>
            </div>
          )}
          {ended.length > 0 && (
            <ul className="mt-2 divide-y divide-divider text-xs text-muted-foreground">
              {ended.map((e) => (
                <li key={e.at} className="flex justify-between py-2">
                  <span>Counter calls only</span>
                  <span>
                    {e.why === "revoked" ? "Revoked" : "Expired"} ·{" "}
                    {new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <p className="mt-8 text-center text-[10px] text-muted-foreground">
          Preview only · no dApp is connected and no permission is granted
        </p>
      </main>
    </div>
  );
}
