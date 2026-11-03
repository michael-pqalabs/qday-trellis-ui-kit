import { describe, expect, it } from "vitest";
import { previewSwapQuote } from "@/lib/swap-preview";
describe("Illustrative swap quote", () => {
  it("quotes both QDAY and USD8 directions", () => {
    expect(previewSwapQuote("4", "qday", 0)?.output).toBe(1);
    expect(previewSwapQuote("1", "usd8", 0)?.output).toBe(4);
  });
  it("applies the chosen slippage to minimum received", () => {
    expect(previewSwapQuote("4", "qday", 1)?.minimumReceived).toBe(0.99);
  });
  it("rejects empty, zero and invalid input", () => {
    expect(previewSwapQuote("", "qday", 1)).toBeNull();
    expect(previewSwapQuote("0", "qday", 1)).toBeNull();
    expect(previewSwapQuote("abc", "usd8", 1)).toBeNull();
  });
});
