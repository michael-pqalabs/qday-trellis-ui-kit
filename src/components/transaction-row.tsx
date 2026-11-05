import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  agoLabel,
  shortAddress,
  txStatusLabel,
  txStatusTone,
  walletTokens,
  type PreviewTx,
} from "@/lib/wallet-preview";

/** One sample history row. Opens the activity detail. Shared by the wallet and Activity screens. */
export function TransactionRow({ tx, visible = true }: { tx: PreviewTx; visible?: boolean }) {
  const token = walletTokens.find((x) => x.id === tx.tokenId);
  if (!token) return null;
  const sent = tx.kind === "send";
  const sign = tx.status !== "confirmed" ? "" : sent ? "−" : "+";
  return (
    <li>
      <Link
        to="/activity/$txId"
        params={{ txId: tx.id }}
        aria-label={`${sent ? "Sent" : "Received"} ${tx.amount} ${token.symbol}, ${txStatusLabel(tx.status)}`}
        className="flex items-center gap-3 rounded-xl py-3 transition-colors hover:bg-secondary/40"
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
            tx.status === "failed"
              ? "bg-destructive/10 text-destructive"
              : sent
                ? "bg-primary/10 text-primary"
                : "bg-success/10 text-success"
          }`}
        >
          {sent ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            {sent ? "Sent" : "Received"} {token.symbol}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {sent ? "To" : "From"} {shortAddress(tx.counterparty)} · {agoLabel(tx.minutesAgo)}
          </span>
        </span>
        <span className="text-right">
          <span
            className={`block font-display text-sm tabular-nums ${!sent && tx.status === "confirmed" ? "text-success" : ""}`}
          >
            {visible ? `${sign}${tx.amount}` : "••••"}
          </span>
          <span className={`mt-0.5 block text-[10px] ${txStatusTone(tx.status)}`}>
            {txStatusLabel(tx.status)}
          </span>
        </span>
      </Link>
    </li>
  );
}
