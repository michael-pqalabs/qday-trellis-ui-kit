import { useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  startRevokeAgent,
  type QPassState,
  type RegisteredAgent,
  type RevokeOutcome,
} from "@/lib/qpass";
import { cn } from "@/lib/utils";

/** The badge text for an agent whose revocation is awaiting on-chain confirmation. */
export const REVOKING_LABEL = "Revoking — awaiting on-chain confirmation";

/**
 * Revoking is an on-chain transaction. After it is submitted the agent keeps its access until the
 * confirmation arrives. This notice explains the pending state and, if the confirmation failed,
 * says that access is still live and what to do next. Preview only: nothing is sent.
 */
export function RevocationNotice({ agent }: { agent: RegisteredAgent }) {
  if (agent.status === "revoking") {
    return (
      <div
        role="status"
        className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs"
      >
        <LoaderCircle
          className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold text-amber-700 dark:text-amber-300">{REVOKING_LABEL}</p>
          <p className="mt-0.5 leading-relaxed text-muted-foreground">
            {agent.name} can still spend until the revocation is confirmed.
          </p>
        </div>
      </div>
    );
  }
  if (agent.revokeFailedAt) {
    return (
      <div
        role="alert"
        className="mt-3 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs"
      >
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
        <div>
          <p className="font-semibold text-destructive">Revocation was not confirmed</p>
          <p className="mt-0.5 leading-relaxed text-muted-foreground">
            Access is not revoked: {agent.name} can still spend. Try again, or end its spending
            session to stop it now.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

/** Confirm dialog for revoking an agent, with a preview switch for how the confirmation ends. */
export function RevokeAgentDialog({
  agent,
  passName,
  open,
  onOpenChange,
  onSubmitted,
}: {
  agent: RegisteredAgent | undefined;
  passName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (state: QPassState) => void;
}) {
  const [outcome, setOutcome] = useState<RevokeOutcome>("confirmed");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke agent access?</AlertDialogTitle>
          <AlertDialogDescription>
            {agent?.name ?? "This agent"} will be unlinked from {passName} and can no longer spend.
            Revoking is confirmed on-chain, so access stays active until then.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2.5">
          <span className="text-[10px] leading-tight text-muted-foreground">
            Preview only
            <br />
            Confirmation
          </span>
          <div
            className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-0.5"
            role="radiogroup"
            aria-label="Preview confirmation"
          >
            {(
              [
                ["confirmed", "Succeeds"],
                ["failed", "Fails"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={outcome === value}
                onClick={() => setOutcome(value)}
                className={cn(
                  "h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-medium transition-colors",
                  outcome === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (!agent) return;
              onSubmitted(startRevokeAgent(agent.id, outcome));
              toast("Revocation submitted", {
                description: "Awaiting on-chain confirmation. Preview only: nothing is sent.",
              });
            }}
          >
            Revoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
