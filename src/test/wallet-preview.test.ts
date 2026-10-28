import { describe, expect, it } from "vitest";
import { getPreviewHolding, walletTokens } from "@/lib/wallet-preview";

describe("Wallet token selection", () => {
  it("offers exactly Qday, sQDAY, and USD8", () => {
    expect(walletTokens.map((token) => token.name)).toEqual(["Qday", "sQDAY", "USD8"]);
  });
  it.each([ ["qday", "Qday"], ["sqday", "sQDAY"], ["usd8", "USD8"] ])("returns only the selected %s holding", (id, name) => {
    expect(getPreviewHolding("main", "mainnet", id).token.name).toBe(name);
  });
  it("changes the address when selecting a different wallet", () => {
    expect(getPreviewHolding("savings", "mainnet", "qday").wallet.address).not.toBe(getPreviewHolding("main", "mainnet", "qday").wallet.address);
  });
  it("changes the network while preserving the selected token", () => {
    const holding = getPreviewHolding("main", "testnet", "usd8");
    expect(holding.network.id).toBe("testnet");
    expect(holding.token.name).toBe("USD8");
  });
});