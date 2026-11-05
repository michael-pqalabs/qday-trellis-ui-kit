import { useEffect, useState } from "react";
import logo from "@/assets/trellis-app-icon.svg";
import { cn } from "@/lib/utils";

/** Shortest time the launch splash stays up, so it never flashes by. */
const MIN_VISIBLE_MS = 3000;
const FADE_MS = 350;

/**
 * Loading state as wide as the app column (`max-w-md`), not the whole window: app mark, name and an indeterminate loading bar. Used as the router's pending
 * screen and, through {@link AppSplash}, as the launch splash. Presentation only; it loads nothing.
 */
export function SplashScreen({
  label = "Loading your wallet…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{ backgroundImage: "var(--gradient-mesh)" }}
      className={cn(
        "flex min-h-screen flex-col items-center justify-between bg-background px-8 pb-12 pt-24",
        className,
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative grid h-28 w-28 place-items-center">
          <span
            aria-hidden="true"
            className="animate-splash-ring absolute inset-0 rounded-[32px] border border-primary/40 motion-reduce:hidden"
          />
          <span
            aria-hidden="true"
            style={{ animationDelay: "1.2s" }}
            className="animate-splash-ring absolute inset-0 rounded-[32px] border border-primary/30 motion-reduce:hidden"
          />
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            className="animate-bloom relative h-24 w-24 rounded-[26px] shadow-glow ring-1 ring-primary/20 motion-reduce:animate-none"
          />
        </div>
        <h1 className="animate-fade-up mt-8 font-display text-2xl font-semibold tracking-tight">
          Trellis <span className="text-accent">Wallet</span>
        </h1>
        <p className="animate-fade-up mt-1.5 text-sm text-muted-foreground">Self-custody on QDay</p>
      </div>

      <div className="w-full max-w-[220px] text-center">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
          <span className="animate-splash-bar absolute inset-y-0 left-0 w-2/5 rounded-full bg-primary shadow-primary motion-reduce:w-full motion-reduce:animate-none" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/**
 * Launch splash for the whole app, as wide as the phone column. It is part of the server markup, so it covers the page before
 * hydration, then fades out once the app is interactive. Mounted once in the root.
 */
export function AppSplash() {
  const [phase, setPhase] = useState<"shown" | "leaving" | "gone">("shown");

  useEffect(() => {
    const leave = setTimeout(() => setPhase("leaving"), MIN_VISIBLE_MS);
    const gone = setTimeout(() => setPhase("gone"), MIN_VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-1/2 z-[100] w-full max-w-md -translate-x-1/2 bg-background transition-opacity ease-out",
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100",
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <SplashScreen />
    </div>
  );
}
