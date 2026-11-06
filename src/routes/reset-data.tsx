import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Kind = "cache" | "all";
type Phase = "idle" | "working" | "done" | "failed";

export const Route = createFileRoute("/reset-data")({
  head: () => ({
    meta: [
      { title: "Reset app data — Trellis Wallet" },
      {
        name: "description",
        content: "Reset sign-in and cache or delete local data in the Trellis Wallet preview.",
      },
      { property: "og:title", content: "Reset app data — Trellis Wallet" },
      {
        property: "og:description",
        content: "Reset sign-in and cache or delete local data in the Trellis Wallet preview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetDataPage,
});

function ResetDataPage() {
  const [confirm, setConfirm] = useState<Kind | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [ack, setAck] = useState(false);
  const [typed, setTyped] = useState("");
  const [fails, setFails] = useState(false);
  const run = () => {
    setConfirm(null);
    setPhase("working");
    setTimeout(() => setPhase(fails ? "failed" : "done"), 1500);
  };
  const ready = ack && typed === "DELETE";
  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to settings">
            <Link to="/settings">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-xl font-semibold">Reset app data</h1>
        </header>
        <p className="mt-4 text-xs text-muted-foreground">
          These actions affect this device only. They do not delete your server account, unlink your
          wallet, delete Passkeys from your password manager, or revoke on-chain or agent
          permissions.
        </p>
        {phase === "working" && (
          <p role="status" className="mt-5 flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Resetting local data. Keep the app open…
          </p>
        )}
        {phase === "failed" && (
          <div role="alert" className="mt-5 rounded-2xl border border-destructive/30 p-3 text-xs">
            Reset did not finish. Some data may already be removed. Retry to complete it; do not
            reinstall the app. If this continues, share this screen with support.
            <Button size="sm" className="mt-3 w-full" onClick={run}>
              Retry reset
            </Button>
          </div>
        )}
        {phase === "done" && (
          <div role="status" className="mt-5 rounded-2xl border bg-card p-3 text-xs">
            Local reset complete. Restart the app to continue. Server accounts, wallet links, system
            Passkeys and on-chain permissions are unchanged.
            <Button size="sm" className="mt-3 w-full" onClick={() => setPhase("idle")}>
              Restart app
            </Button>
          </div>
        )}
        {phase === "idle" && (
          <>
            <section className="mt-5 rounded-2xl border bg-card p-4">
              <h2 className="text-sm font-semibold">Reset sign-in and cache</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Clear local sign-in, open forms and cached API results. Disable notifications on
                this installation. Keep all wallets, contacts, custom tokens, preferences and
                transaction recovery records. Sign in again to reconnect.
              </p>
              <Button variant="outline" className="mt-3 w-full" onClick={() => setConfirm("cache")}>
                Reset
              </Button>
            </section>
            <section className="mt-4 rounded-2xl border border-destructive/30 bg-card p-4">
              <h2 className="text-sm font-semibold text-destructive">Clear all local data</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Delete every local wallet and its recovery phrase or private key, saved accounts,
                contacts, custom tokens, preferences and transaction recovery records. Back up every
                wallet first. Email sign-in cannot restore wallet keys.
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                If you have not backed up your wallet, cancel and resolve the unlock issue before
                deleting anything.
              </p>
              <Button asChild variant="outline" className="mt-3 w-full">
                <Link to="/backup">Back up wallet first</Link>
              </Button>
              <div className="mt-4 flex items-start gap-3">
                <Checkbox
                  id="r-ack"
                  className="mt-[3px]"
                  checked={ack}
                  onCheckedChange={(v) => setAck(v === true)}
                />
                <Label htmlFor="r-ack" className="text-sm font-normal leading-snug">
                  I have backed up every wallet and understand this cannot be undone.
                </Label>
              </div>
              <Label
                htmlFor="r-delete"
                className="mt-5 text-xs text-muted-foreground font-normal block"
              >
                Type <span className="text-destructive font-bold text-xs">DELETE</span> to confirm
              </Label>
              <p className="mb-2 mt-1 text-xs text-muted-foreground">
                Device authentication is required.
              </p>
              <Input
                id="r-delete"
                aria-label="Type DELETE to confirm deletion"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
              <Button
                variant="destructive"
                className="mt-3 w-full"
                disabled={!ready}
                onClick={() => setConfirm("all")}
              >
                Delete and reset
              </Button>
            </section>
          </>
        )}
        <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2">
          <span className="text-[10px] leading-tight text-muted-foreground">
            Preview only
            <br />
            Reset result
          </span>
          <div
            className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-0.5"
            role="radiogroup"
            aria-label="Preview reset result"
          >
            {(
              [
                [false, "Completes"],
                [true, "Fails"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={fails === value}
                onClick={() => setFails(value)}
                className={cn(
                  "h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors",
                  fails === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Preview only · nothing is deleted
        </p>
        <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirm === "all" ? "Delete all local wallet data?" : "Reset sign-in and cache?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirm === "all"
                  ? "All local wallet recovery phrases and private keys will be removed. Without backups for every wallet, access to funds may be permanently lost. This cannot cancel submitted transactions or revoke permissions."
                  : "You will be signed out and the wallet locked. Wallet keys and transaction recovery records will be kept."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button variant={confirm === "all" ? "destructive" : "default"} onClick={run}>
                {confirm === "all" ? "Delete and reset" : "Reset"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
