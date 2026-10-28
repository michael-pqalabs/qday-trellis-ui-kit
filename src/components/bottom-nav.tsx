import { Link, useLocation } from "@tanstack/react-router";
import { Bot, Wallet } from "lucide-react";
import { useQDayPreview } from '@/components/qday-preview-provider';
import { Button } from '@/components/ui/button';
import { isWalletTabBlocked } from '@/lib/qday-preview';

const items = [
  { to: "/wallet", label: "Qday Wallet", icon: Wallet },
  { to: "/agentic", label: "Agentic Payment", icon: Bot },
] as const;

export function BottomNav() {
  const { state, ready } = useQDayPreview();
  const location = useLocation();
  const blocked = isWalletTabBlocked(location.pathname, state.email, ready);
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-20 mt-auto flex w-full justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-background" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/90 to-transparent" />
      <div className="relative z-10 flex w-full max-w-xs items-center gap-1 rounded-full border border-primary/20 bg-card p-1.5 shadow-glow">
        {items.map((item) => blocked && item.to === '/wallet' ? <Button key={item.to} disabled variant="ghost" title="Sign in to QDay first" className="h-auto flex-1 flex-col gap-1 py-2 text-[11px]"><item.icon className="h-5 w-5" /><span>{item.label}</span></Button> : (
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
