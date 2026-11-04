import { useState } from "react";
import { ArrowLeft, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { defaultNetworkId, getChain, previewChains } from "@/lib/wallet-preview";

type Option = {
  id: string;
  label: string;
  available: boolean;
  /** "Default", "Available soon", … */
  tag?: string | undefined;
  note?: string | undefined;
  /** Optional text button under the note. */
  action?: { label: string; onClick: () => void } | undefined;
};

function OptionGroup({
  legend,
  name,
  value,
  options,
  onChange,
}: {
  legend: string;
  name: string;
  value: string;
  options: Option[];
  onChange: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium uppercase text-muted-foreground">{legend}</legend>
      <RadioGroup
        value={value}
        onValueChange={onChange}
        aria-label={legend}
        className="grid gap-2"
        name={name}
      >
        {options.map((option) => {
          const selected = option.id === value;
          const inputId = `${name}-${option.id}`;
          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                option.available ? "cursor-pointer hover:bg-secondary/60" : "cursor-not-allowed",
                selected ? "border-primary/50 bg-primary/5" : "border-border",
                !option.available && "bg-muted/40",
              )}
            >
              <RadioGroupItem
                id={inputId}
                value={option.id}
                disabled={!option.available}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      !option.available && "text-muted-foreground",
                    )}
                  >
                    {option.label}
                  </span>
                  {option.tag && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        option.available
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {option.tag}
                    </span>
                  )}
                </span>
                {option.note && (
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {option.note}
                  </span>
                )}
                {option.action && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      option.action?.onClick();
                    }}
                    className="mt-1.5 text-xs font-medium text-primary underline underline-offset-2"
                  >
                    {option.action.label}
                  </button>
                )}
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}

function BaseSetupPreview({ onBack }: { onBack: () => void }) {
  const steps = [
    {
      title: "Create a Main Wallet smart account",
      detail: "Your first smart account on Base. We sponsor it, so there is no fee to pay.",
      tag: "Sponsored",
    },
    {
      title: "Create new SignetPasses",
      detail: "Each SignetPass is created on its own, and its fee is not sponsored.",
      tag: "Not sponsored",
    },
  ];
  return (
    <>
      <DialogHeader>
        <DialogTitle>Set up Base</DialogTitle>
        <DialogDescription>
          Base is available soon. This preview shows what choosing it will involve.
        </DialogDescription>
      </DialogHeader>
      <ol className="space-y-2" aria-label="Base setup steps">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-lg border px-3 py-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{step.title}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {step.tag}
                </span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        QDay and Base are not available at the same time. You choose which blockchain manages your
        wallets.
      </p>
      <DialogFooter className="flex-col gap-2 sm:flex-col">
        <Button type="button" className="w-full" disabled>
          Switch to Base · available soon
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Compact blockchain and network line above the header, plus the modal it opens. The network sits apart
 * from the wallet name so it stays easy to reach without competing with it. The blockchain decides
 * which networks exist (QDay: Aevum Testnet; another chain can list several testnets).
 */
export function NetworkPicker({
  chainId,
  networkId,
  onChange,
}: {
  chainId: string;
  networkId: string;
  onChange: (chainId: string, networkId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"choose" | "base">("choose");
  const chain = getChain(chainId);
  const network = chain.networks.find((item) => item.id === networkId) ?? chain.networks[0];

  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setView("choose");
            setOpen(true);
          }}
          aria-haspopup="dialog"
          aria-label={`Blockchain ${chain.name}, network ${network?.name}. Change network`}
          className="h-9 min-w-0 max-w-full gap-2 rounded-full px-2 text-xs font-normal text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <span className="truncate">
            Blockchain: <span className="font-semibold text-foreground">{chain.name}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="min-w-0 truncate">
            Network:{" "}
            <span className="font-medium text-primary underline underline-offset-2">
              {network?.name}
            </span>
          </span>
          <ChevronDown className="!h-3.5 !w-3.5 shrink-0" aria-hidden="true" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm gap-5">
          {view === "base" ? (
            <BaseSetupPreview onBack={() => setView("choose")} />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Blockchain and network</DialogTitle>
                <DialogDescription>
                  One blockchain is active at a time. Your wallets follow the choice you make here.
                </DialogDescription>
              </DialogHeader>

              <OptionGroup
                legend="Blockchain"
                name="chain"
                value={chain.id}
                onChange={(id) => onChange(id, defaultNetworkId(id))}
                options={previewChains.map((item) => ({
                  id: item.id,
                  label: item.name,
                  available: item.available,
                  tag: item.available
                    ? item.id === "qday"
                      ? "Default"
                      : undefined
                    : "Available soon",
                  note: item.available ? undefined : item.switchNote,
                  action: item.available
                    ? undefined
                    : { label: "See what Base needs", onClick: () => setView("base") },
                }))}
              />

              <OptionGroup
                legend="Network"
                name="network"
                value={network?.id ?? ""}
                onChange={(id) => onChange(chain.id, id)}
                options={chain.networks.map((item) => ({
                  id: item.id,
                  label: item.name,
                  available: item.available,
                  tag: item.available ? (item.previewNote ? "Preview" : undefined) : "Coming soon",
                  note: item.previewNote,
                }))}
              />

              <DialogFooter>
                <Button type="button" className="w-full" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
