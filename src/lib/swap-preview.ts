// Illustrative rate only, not a market quote. Never used to execute a transfer.
export const PREVIEW_QDAY_USD8_RATE = 0.25;
export function previewSwapQuote(amount: string, from: "qday" | "usd8", slippage: number) {
  const value = Number(amount);
  if (!amount.trim() || !Number.isFinite(value) || value <= 0 || !Number.isFinite(slippage) || slippage < 0 || slippage > 100) return null;
  const output = from === "qday" ? value * PREVIEW_QDAY_USD8_RATE : value / PREVIEW_QDAY_USD8_RATE;
  return { output, minimumReceived: output * (1 - slippage / 100) };
}