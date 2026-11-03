import onDark from "@/assets/trellis-lockup-on-dark.svg";
import onLight from "@/assets/trellis-lockup-on-light.svg";
import { cn } from "@/lib/utils";

/**
 * Brand kit horizontal lockup (mark + "Trellis Wallet on QDay"). Both colour variants render and
 * CSS picks one from the `.dark` class, so theme changes need no JS and cannot mismatch on hydration.
 * Brand minimum: 140px wide; keep clear space of half the mark height around it.
 */
export function TrellisLockup({ className }: { className?: string }) {
  return (
    <>
      <img
        src={onLight}
        alt="Trellis Wallet on QDay"
        className={cn("h-auto w-[150px] dark:hidden", className)}
      />
      <img
        src={onDark}
        alt=""
        aria-hidden="true"
        className={cn("hidden h-auto w-[150px] dark:block", className)}
      />
    </>
  );
}
