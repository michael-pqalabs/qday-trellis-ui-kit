import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { validateApprovalLimits, type ApprovalLimits, type LimitField } from "@/lib/qpass";

/** How long the illustrative server check takes. */
export const SERVER_CHECK_MS = 900;
type Outcome = "accepts" | "fails";
const FIELDS: {
  field: LimitField;
  label: string;
  unit: string;
  inputMode: "decimal" | "numeric";
}[] = [
  { field: "perPaymentLimit", label: "Per payment", unit: "USD8", inputMode: "decimal" },
  { field: "totalBudget", label: "Total budget", unit: "USD8", inputMode: "decimal" },
  { field: "durationDays", label: "Duration", unit: "days", inputMode: "numeric" },
];
/**
 * Lets the user lower a terminal request's spending limits before approving. The server checks the
 * values first (`Save limits`); only after it accepts them is the edited request saved and sent
 * back to the terminal to be signed again. Preview only: the server check is simulated and has a
 * switch for how it ends. Nothing is sent.
 */
export function SpendingLimitsEditor({
  current,
  onSave,
  onDiscard,
}: {
  current: ApprovalLimits;
  /** Called only after the previewed server check accepted the values. */
  onSave: (values: ApprovalLimits) => void;
  onDiscard: () => void;
}) {
  const [input, setInput] = useState({
    perPaymentLimit: String(current.perPaymentLimit),
    totalBudget: String(current.totalBudget),
    durationDays: String(current.durationDays),
  });
  const [errors, setErrors] = useState<Partial<Record<LimitField, string>>>({});
  const [unchanged, setUnchanged] = useState(false);
  const [checking, setChecking] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("accepts");
  const save = () => {
    const { values, errors: found } = validateApprovalLimits(current, input);
    setErrors(found);
    setServerError(false);
    setUnchanged(false);
    if (!values) return;
    if (
      values.perPaymentLimit === current.perPaymentLimit &&
      values.totalBudget === current.totalBudget &&
      values.durationDays === current.durationDays
    ) {
      setUnchanged(true);
      return;
    }
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      if (outcome === "fails") setServerError(true);
      else onSave(values);
    }, SERVER_CHECK_MS);
  };
  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-sm font-semibold">Edit spending limits</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          You can only lower these. The server checks them before you can approve.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ field, label, unit, inputMode }) => {
          const id = `limit-${field}`;
          return (
            <div key={field} className={field === "durationDays" ? "col-span-2" : undefined}>
              <label htmlFor={id} className="mb-1 block text-xs text-muted-foreground">
                {label} ({unit})
              </label>
              <Input
                id={id}
                inputMode={inputMode}
                value={input[field]}
                disabled={checking}
                aria-invalid={errors[field] ? true : undefined}
                aria-describedby={errors[field] ? `${id}-error` : undefined}
                onChange={(e) => {
                  setInput((v) => ({ ...v, [field]: e.target.value }));
                  setErrors((v) => ({ ...v, [field]: undefined }));
                  setUnchanged(false);
                  setServerError(false);
                }}
                className={cn(
                  errors[field] && "border-destructive focus-visible:ring-destructive/20",
                )}
              />
              {errors[field] && (
                <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] text-destructive">
                  {errors[field]}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {unchanged && (
        <p role="status" className="text-[11px] text-muted-foreground">
          No changes to save. Lower a limit, or choose Discard edits to go back.
        </p>
      )}
      {serverError && (
        <p role="alert" className="text-[11px] text-destructive">
          The server could not confirm these limits. Your edits are kept. Discard edits to reload
          the current request, then try again.
        </p>
      )}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2">
        <span className="text-[10px] leading-tight text-muted-foreground">
          Preview only
          <br />
          Server check
        </span>
        <div
          className="inline-flex rounded-full border border-border/60 bg-secondary/60 p-0.5"
          role="radiogroup"
          aria-label="Preview server check"
        >
          {(
            [
              ["accepts", "Accepts"],
              ["fails", "Fails"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={outcome === value}
              disabled={checking}
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
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" disabled={checking} onClick={onDiscard}>
          Discard edits
        </Button>
        <Button className="flex-1" disabled={checking} onClick={save}>
          {checking ? (
            <>
              <Loader2 className="animate-spin" />
              Checking…
            </>
          ) : (
            "Save limits"
          )}
        </Button>
      </div>
    </div>
  );
}
