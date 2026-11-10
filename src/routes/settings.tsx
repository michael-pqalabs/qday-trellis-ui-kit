import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  BookUser,
  ChevronRight,
  Droplets,
  ExternalLink,
  Fingerprint,
  Globe,
  Info,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Search,
  Shield,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  detail?: ReactNode;
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
  const [biometricType, setBiometricType] = useState<"touch" | "face">("touch");
  const [autoLock, setAutoLock] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);

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

        <Section title="Wallet">
          <Row icon={BookUser} label="Address book" detail="Saved recipients" to="/contacts" />
        </Section>

        <Section title="Security">
          <Row
            icon={Fingerprint}
            label="Biometric unlock"
            detail={
              biometric ? (
                <span
                  role="radiogroup"
                  aria-label="Biometric method"
                  className="mt-2 flex w-fit gap-1 rounded-full bg-muted p-0.5"
                >
                  {(
                    [
                      ["touch", "Touch ID"],
                      ["face", "Face ID"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={biometricType === id}
                      onClick={() => setBiometricType(id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        biometricType === id
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </span>
              ) : (
                "Passkey"
              )
            }
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
          <Row
            icon={BookOpen}
            label="Resources"
            detail="Wiki, Price Oracle, Website, Explorer"
            onClick={() => setResourcesOpen(true)}
          />
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

        <Sheet open={resourcesOpen} onOpenChange={setResourcesOpen}>
          <SheetContent
            side="bottom"
            className="mx-auto flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl px-5 pb-8 pt-6"
          >
            <SheetHeader className="text-left">
              <SheetTitle>Resources</SheetTitle>
              <SheetDescription>
                Opens in a new tab. Placeholder links in this preview.
              </SheetDescription>
            </SheetHeader>
            <div className="divide-y divide-divider overflow-hidden rounded-2xl border border-border/60 bg-card">
              <Row icon={BookOpen} label="Wiki" href="https://example.com" />
              <Row icon={TrendingUp} label="Price Oracle" href="https://example.com" />
              <Row icon={Globe} label="Website" href="https://example.com" />
              <Row icon={Search} label="Explorer" href="https://example.com" />
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
