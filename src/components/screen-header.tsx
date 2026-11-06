import type { ReactNode } from "react";
import { TrellisLockup } from "@/components/trellis-lockup";

/** Round bordered icon button for the top-right of a main screen (settings, sign out). */
export const headerActionClass =
  "relative h-9 w-9 rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm after:absolute after:-inset-1 after:content-[''] hover:bg-secondary hover:text-primary";
/** Round "+" button at the end of a main screen's selector row (add wallet, create SignetPass). */
export const rowActionClass =
  "h-11 w-11 shrink-0 rounded-full border-primary/30 bg-card text-primary shadow-sm hover:bg-primary/10 hover:text-primary";

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
