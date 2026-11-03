import { describe, expect, it } from "vitest";
import {
  getPreviewHolding,
  walletTokens,
  previewNetworks,
  previewWallets,
  sampleTransactions,
} from "@/lib/wallet-preview";

describe("Wallet token selection", () => {
  it("offers exactly QDAY and USD8", () => {
    expect(walletTokens.map((token) => token.name)).toEqual(["QDAY", "USD8"]);
  });
  it.each([
    ["qday", "QDAY"],
    ["usd8", "USD8"],
  ])("returns only the selected %s holding", (id, name) => {
    expect(getPreviewHolding("main", "testnet", id).token.name).toBe(name);
  });
  it("uses the approved network names", () => {
    expect(previewNetworks.slice(0, 2).map((network) => network.name)).toEqual([
      "Aevum Testnet",
      "Base Testnet",
    ]);
  });
  it("defaults to Aevum Testnet, including for an unknown network id", () => {
    expect(previewNetworks[0].id).toBe("testnet");
    expect(getPreviewHolding("main", "unknown", "qday").network.name).toBe("Aevum Testnet");
  });
  it("names the initial wallets without suggesting a TrellisPass savings account", () => {
    expect(previewWallets.map((wallet) => wallet.name)).toEqual(["Wallet 1 (Main)", "Wallet 2"]);
  });
  it("sample history only references supported assets", () => {
    expect(
      sampleTransactions.every((tx) => walletTokens.some((token) => token.id === tx.tokenId)),
    ).toBe(true);
  });
  it("changes the address when selecting a different wallet", () => {
    expect(getPreviewHolding("savings", "testnet", "qday").wallet.address).not.toBe(
      getPreviewHolding("main", "testnet", "qday").wallet.address,
    );
  });
  it("changes the network while preserving the selected token", () => {
    const holding = getPreviewHolding("main", "testnet", "usd8");
    expect(holding.network.id).toBe("testnet");
    expect(holding.token.name).toBe("USD8");
  });
});
