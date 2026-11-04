import { describe, expect, it } from "vitest";
import {
  getPreviewHolding,
  walletTokens,
  previewNetworks,
  previewChains,
  getChain,
  chainForNetwork,
  defaultNetworkId,
  describeNetwork,
  nextWalletName,
  validateWalletName,
  isPhraseLengthValid,
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
  it("starts with one wallet so the first added wallet is Wallet 2", () => {
    expect(previewWallets.map((wallet) => wallet.name)).toEqual(["Wallet 1 (Main)"]);
    expect(nextWalletName(previewWallets)).toBe("Wallet 2");
  });
  it("sample history only references supported assets", () => {
    expect(
      sampleTransactions.every((tx) => walletTokens.some((token) => token.id === tx.tokenId)),
    ).toBe(true);
  });
  it("changes the address when selecting a different wallet", () => {
    const wallets = [...previewWallets, { id: "w2", name: "Wallet 2", address: "0xabc" }];
    expect(getPreviewHolding("w2", "testnet", "qday", wallets).wallet.address).not.toBe(
      getPreviewHolding("main", "testnet", "qday", wallets).wallet.address,
    );
  });
  it("changes the network while preserving the selected token", () => {
    const holding = getPreviewHolding("main", "testnet", "usd8");
    expect(holding.network.id).toBe("testnet");
    expect(holding.token.name).toBe("USD8");
  });
  it("keeps QDay as the default blockchain and Base unavailable for now", () => {
    expect(previewChains[0]?.id).toBe("qday");
    expect(getChain("qday").available).toBe(true);
    expect(getChain("base").available).toBe(false);
    expect(getChain("base").switchNote).toMatch(/Main Wallet smart account/);
  });
  it("names a chain's testnet after the chain and lists mainnet as not yet available", () => {
    const qday = getChain("qday");
    expect(qday.networks.map((n) => n.name)).toEqual(["Aevum Testnet", "Mainnet"]);
    const mainnet = qday.networks.find((n) => n.name === "Mainnet");
    expect(mainnet?.available).toBe(true);
    expect(mainnet?.previewNote).toMatch(/not live/);
    expect(describeNetwork("qday-mainnet").label).toBe("QDay · Mainnet");
    expect(describeNetwork("testnet").label).toBe("QDay · Aevum Testnet");
    expect(getChain("base").networks.every((n) => n.name !== "Aevum Testnet")).toBe(true);
    expect(defaultNetworkId("qday")).toBe("testnet");
    expect(chainForNetwork("base-testnet").id).toBe("base");
    expect(chainForNetwork(undefined).id).toBe("qday");
  });
  it("numbers new wallets from the existing ones and never repeats a name", () => {
    expect(nextWalletName(previewWallets)).toBe("Wallet 2");
    expect(nextWalletName([...previewWallets, { name: "Wallet 2" }])).toBe("Wallet 3");
    expect(nextWalletName([{ name: "Wallet 2" }])).toBe("Wallet 3");
  });
  it("validates wallet names", () => {
    expect(validateWalletName("Savings", previewWallets)).toBeUndefined();
    expect(validateWalletName("   ", previewWallets)).toMatch(/Enter a wallet name/);
    expect(validateWalletName("wallet 1 (main)", previewWallets)).toMatch(/already have/);
    expect(validateWalletName("x".repeat(41), previewWallets)).toMatch(/40 characters/);
  });
  it("accepts only 12 or 24 word phrases for the import preview", () => {
    const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
    expect(isPhraseLengthValid(words(12))).toBe(true);
    expect(isPhraseLengthValid(`  ${words(24)}  `)).toBe(true);
    expect(isPhraseLengthValid(words(11))).toBe(false);
    expect(isPhraseLengthValid("")).toBe(false);
  });
});
