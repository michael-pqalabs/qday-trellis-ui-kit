import type { ReactNode } from "react";
import { TrellisLockup } from "@/components/trellis-lockup";
import { cn } from "@/lib/utils";

/** Round bordered icon button for the top-right of a main screen (settings, sign out). */
export const headerActionClass =
  "relative h-9 w-9 rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm hover:bg-secondary hover:text-primary";
/** Round "+" button beside a main screen's title (add wallet, create SignetPass). */
export const titleActionClass =
  "h-10 w-10 shrink-0 rounded-full border-primary/30 bg-card text-primary shadow-sm hover:bg-primary/10 hover:text-primary";

/**
 * Header shared by /wallet and /agentic: logo lockup on the left, one action on the right.
 * Both screens use the same sizes and spacing so nothing jumps when switching with the bottom nav.
 */
export function ScreenHeader({ action }: { action: ReactNode }) {
  return (
    <header className="mt-1 flex h-9 items-center justify-between">
      <TrellisLockup />
      {action}
    </header>
  );
}

/** Title row below the header: big title and one round action. */
export function ScreenTitle({
  title,
  action,
  className,
}: {
  title: string;
  action: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 mt-6 flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="truncate font-display text-3xl font-semibold">{title}</h1>
      </div>
      {action}
    </div>
  );
}
