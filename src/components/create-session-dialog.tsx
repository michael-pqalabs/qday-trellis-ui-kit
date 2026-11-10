import { useEffect, useState } from "react";
import { Bot, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStableToken } from "@/components/wallet-preview-provider";
import { cn } from "@/lib/utils";
import {
  MAX_SESSION_DAYS,
  MAX_TASK_SUMMARY,
  validateNewSession,
  type ApprovalLimits,
  type LimitField,
} from "@/lib/qpass";

/** How long the illustrative Passkey confirmation takes. */
export const PASSKEY_CONFIRM_MS = 1400;
const FIELDS: { field: LimitField; label: string; inputMode: "decimal" | "numeric" }[] = [
  { field: "perPaymentLimit", label: "Per payment", inputMode: "decimal" },
  { field: "totalBudget", label: "Total budget", inputMode: "decimal" },
  { field: "durationDays", label: "Duration (days)", inputMode: "numeric" },
];
const DEFAULTS = { perPaymentLimit: "5", totalBudget: "50", durationDays: "7" };

/**
 * Lets the user create a spending session for a registered agent from Trellis, instead of waiting
 * for the agent to ask from its terminal. The user sets the per-payment limit, total budget and
 * duration, then confirms with the (simulated) Passkey. Preview only: nothing is sent or charged.
 */
export function CreateSessionDialog({
  open,
  onOpenChange,
  agentName,
  agentVendor,
  passName,
  chainId,
  passActive,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  /** Who the agent says it is (vendor and model), when known. */
  agentVendor?: string | undefined;
  passName: string;
  /** Blockchain of the agent's SignetPass; it decides the stablecoin. */
  chainId?: string | undefined;
  passActive: boolean;
  onCreate: (limits: ApprovalLimits, taskSummary: string) => void;
}) {
  const { stable, chainName } = useStableToken(chainId);
  const [task, setTask] = useState("");
  const [input, setInput] = useState(DEFAULTS);
  const [errors, setErrors] = useState<Partial<Record<LimitField, string>>>({});
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInput(DEFAULTS);
    setTask("");
    setErrors({});
    setConfirming(false);
  }, [open]);

  const preview = validateNewSession(input).values;
  const endsOn = preview
    ? new Date(Date.now() + preview.durationDays * 86400000).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const submit = () => {
    const { values, errors: found } = validateNewSession(input);
    setErrors(found);
    if (!values) return;
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      onCreate(values, task.trim());
    }, PASSKEY_CONFIRM_MS);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && confirming) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center text-center">
          <span className="mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Bot className="h-7 w-7" />
          </span>
          <DialogTitle>Create spending session</DialogTitle>
          <DialogDescription className="text-xs">
            {agentName} can pay up to these limits from {passName}, until the session ends.
          </DialogDescription>
          {agentVendor && (
            <p className="text-[11px] text-muted-foreground">
              {agentVendor} · {chainName}
            </p>
          )}
        </DialogHeader>
        <form
          noValidate
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ field, label, inputMode }) => {
              const id = `new-session-${field}`;
              const unit = field === "durationDays" ? "" : ` (${stable})`;
              return (
                <div key={field} className={field === "durationDays" ? "col-span-2" : undefined}>
                  <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">
                    {label}
                    {unit}
                  </label>
                  <Input
                    id={id}
                    inputMode={inputMode}
                    value={input[field]}
                    disabled={confirming}
                    aria-invalid={errors[field] ? true : undefined}
                    aria-describedby={errors[field] ? `${id}-error` : undefined}
                    onChange={(e) => {
                      setInput((v) => ({ ...v, [field]: e.target.value }));
                      setErrors((v) => ({ ...v, [field]: undefined }));
                    }}
                    className={cn(
                      errors[field] && "border-destructive focus-visible:ring-destructive/20",
                    )}
                  />
                  {errors[field] && (
                    <p
                      id={`${id}-error`}
                      role="alert"
                      className="mt-1 text-[11px] text-destructive"
                    >
                      {errors[field]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div>
            <label htmlFor="new-session-task" className="mb-1 block text-xs text-muted-foreground">
              What is it for? (optional)
            </label>
            <Input
              id="new-session-task"
              value={task}
              maxLength={MAX_TASK_SUMMARY}
              disabled={confirming}
              placeholder="e.g. Buy a USB-C cable"
              onChange={(e) => setTask(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Session ends</span>
            <span className="font-medium">{endsOn ?? "—"}</span>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            An agent has one spending session at a time. It stops at the budget or after the
            duration (up to {MAX_SESSION_DAYS} days), and you can end it any time. This preview
            cannot move funds.
          </p>
          {!passActive && (
            <p role="alert" className="text-center text-xs text-destructive">
              Activate this SignetPass before creating a session.
            </p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={confirming}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={confirming || !passActive}>
              {confirming ? (
                <>
                  <Loader2 className="animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  <ShieldCheck />
                  Create session
                </>
              )}
            </Button>
          </div>
          {confirming && (
            <p role="status" className="animate-fade-up text-center text-xs text-primary">
              Simulating Passkey confirmation…
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
