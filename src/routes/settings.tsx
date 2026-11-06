import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  BookUser,
  ChevronRight,
  Droplets,
  ExternalLink,
  Eye,
  FileCheck,
  Fingerprint,
  Globe,
  History,
  Info,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Plug,
  Rocket,
  Search,
  Shield,
  ShieldCheck,
  TrendingUp,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "@/components/theme-provider";
import { useQDayPreview } from "@/components/qday-preview-provider";
import { emptyQDayPreview } from "@/lib/qday-preview";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Trellis Wallet" },
      {
        name: "description",
        content: "Manage security, appearance, account and testnet tools in Trellis Wallet.",
      },
      { property: "og:title", content: "Settings — Trellis Wallet" },
      {
        property: "og:description",
        content: "Security, appearance and account settings for Trellis Wallet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="divide-y divide-divider overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        {children}
      </div>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  detail,
  right,
  onClick,
  href,
  to,
}: {
  icon: typeof Shield;
  label: string;
  detail?: string;
  right?: ReactNode;
  onClick?: () => void;
  href?: string;
  /** Opens another screen of this app. */
  to?: LinkProps["to"];
}) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-medium">{label}</span>
        {detail && <span className="block text-xs text-muted-foreground">{detail}</span>}
      </span>
      {right ??
        (href ? (
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        ) : onClick || to ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : null)}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/5";
  if (to)
    return (
      <Link to={to} className={cls}>
        {body}
      </Link>
    );
  if (href)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {body}
      </a>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  return <div className={cls}>{body}</div>;
}

function Settings() {
  const { theme, setTheme } = useTheme();
  const { state, update } = useQDayPreview();
  const [biometric, setBiometric] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  const soon = (name: string) =>
    toast(name, { description: "This option is a preview and isn't available yet." });

  return (
    <div className="flex min-h-dvh justify-center bg-background">
      <main className="flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to wallet">
            <Link to="/wallet">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-semibold">Settings</h1>
        </header>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-card p-4 shadow-card">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-semibold">
            {(state.email ?? "T").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {state.email ?? "Not signed in to Signet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {state.email ? "Signet account" : "Sign in from Agentic Payments"}
            </p>
          </div>
        </div>

        <Section title="Account">
          <Row
            icon={WalletCards}
            label="Accounts"
            detail="Details, nickname and add account"
            to="/accounts"
          />
          <Row
            icon={Rocket}
            label="Account activation"
            detail="Smart account deployment status"
            to="/account-activation"
          />
        </Section>

        <Section title="Wallet">
          <Row
            icon={History}
            label="Activity"
            detail="Sent and received transfers"
            to="/activity"
          />
          <Row icon={BookUser} label="Address book" detail="Saved recipients" to="/contacts" />
          <Row
            icon={Eye}
            label="Watch address"
            detail="Read-only balances of a public address"
            to="/watch-address"
          />
          <Row
            icon={Plug}
            label="Connections"
            detail="dApps and session permissions"
            to="/connections"
          />
          <Row
            icon={ShieldCheck}
            label="Quantum protection"
            detail="Classic or Hybrid signatures"
            to="/pq"
          />
          <Row
            icon={FileCheck}
            label="Token approvals"
            detail="Check or revoke an allowance"
            to="/token-approvals"
          />
        </Section>

        <Section title="Security">
          <Row
            icon={Fingerprint}
            label="Biometric unlock"
            detail="Passkey · Touch ID or Face ID"
            right={
              <Switch
                checked={biometric}
                onCheckedChange={setBiometric}
                aria-label="Biometric unlock"
              />
            }
          />
          <Row
            icon={Lock}
            label="Auto-lock"
            detail="Lock after 5 minutes"
            right={
              <Switch checked={autoLock} onCheckedChange={setAutoLock} aria-label="Auto-lock" />
            }
          />
          <Row icon={KeyRound} label="Recovery phrase" detail="View or back up" to="/backup" />
          <Row
            icon={Shield}
            label="Manage Trellis passkeys"
            detail="App sign-in keys, separate from Signet"
            onClick={() => soon("Manage Trellis passkeys")}
          />
        </Section>

        <Section title="Appearance">
          <Row
            icon={Moon}
            label="Dark mode"
            right={
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                aria-label="Dark mode"
              />
            }
          />
        </Section>

        <Section title="Discover">
          <Row
            icon={Droplets}
            label="Testnet faucet"
            detail="Aevum Testnet · Get tUSD8 for testing"
            to="/faucet"
          />
          <Row icon={BookOpen} label="Wiki" href="https://example.com" />
          <Row icon={TrendingUp} label="Price Oracle" href="https://example.com" />
          <Row icon={Globe} label="Website" href="https://example.com" />
          <Row icon={Search} label="Explorer" href="https://example.com" />
        </Section>

        <Section title="Data">
          <Row
            icon={Trash2}
            label="Reset app data"
            detail="Sign-in, cache and local data"
            to="/reset-data"
          />
        </Section>

        <Section title="About">
          <Row
            icon={Info}
            label="About this demo"
            detail="What is real and what isn't"
            onClick={() => setAboutOpen(true)}
          />
          <Row
            icon={Info}
            label="Version"
            right={<span className="text-xs text-muted-foreground">v0.1.0 (26)</span>}
          />
        </Section>

        {state.email && (
          <Button
            variant="outline"
            className="mt-6 text-destructive"
            onClick={() => {
              update((s) => ({ ...emptyQDayPreview, walletReady: s.walletReady }));
              toast("Signed out of Signet");
            }}
          >
            <LogOut />
            Sign out of Signet
          </Button>
        )}

        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display tracking-normal">About this demo</DialogTitle>
              <DialogDescription>Trellis Wallet · interface preview</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Balances are zero and every address shown is illustrative. Nothing here is derived
              from your recovery phrase, and no real funds can be sent.
            </p>
            <Button onClick={() => setAboutOpen(false)} className="mt-1">
              Got it
            </Button>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
