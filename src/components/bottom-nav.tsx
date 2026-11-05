import { Link } from "@tanstack/react-router";
import { Bot, Wallet } from "lucide-react";

const items = [
  { to: "/wallet", label: "QDay Wallet", icon: Wallet },
  { to: "/agentic", label: "Agentic Payments", icon: Bot },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 mt-auto flex w-full justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
    >
      {/*
        Fade behind the tabs. It repeats the screen's own mesh background, fixed to the viewport so the
        pixels line up, and spans the full column. A flat `bg-background` fill showed as a pale box.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-5 bottom-0 h-40"
        style={{
          backgroundImage: "var(--gradient-mesh)",
          backgroundAttachment: "fixed",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          maskImage: "linear-gradient(to top, black 55%, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black 55%, transparent)",
        }}
      />
      <div className="relative z-10 flex w-full max-w-xs items-center gap-1 rounded-full border border-primary/20 bg-card p-1.5 shadow-glow">
        {items.map((item) => (
          // Both tabs stay reachable before Signet sign-in, so users can always return to their
          // self-custody wallet while Signet setup is incomplete.
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-1 flex-col items-center gap-1 rounded-full px-2 py-2 text-[11px] font-medium transition-colors hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            activeProps={{ "aria-current": "page" as const }}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
