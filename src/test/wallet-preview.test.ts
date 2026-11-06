import { describe, expect, it } from "vitest";
import {
  getPreviewHolding,
  walletTokens,
  previewNetworks,
  previewChains,
  getChain,
  chainForNetwork,
  isMainnet,
  totalUsdValue,
  formatUsd,
  defaultNetworkId,
  describeNetwork,
  nextWalletName,
  validateWalletName,
  isPhraseLengthValid,
  previewWallets,
  sampleTransactions,
  validateTokenImport,
  searchTokens,
  zeroBalance,
  signetPassFee,
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

describe("Token import", () => {
  const existing = [{ symbol: "QDAY" }, { symbol: "USD8" }];
  const address = "0x7A39fC621B84D09a36e570F8cE214D6b95aC8021";
  it("accepts a 0x address with a new symbol", () => {
    expect(validateTokenImport(address, "usdt", "6", existing)).toEqual({});
  });
  it("rejects empty, malformed and duplicate input", () => {
    expect(validateTokenImport("", "", "", existing)).toEqual({
      address: "Enter the token contract address.",
      symbol: "Enter the token symbol.",
      decimals: "Enter the token decimals.",
    });
    expect(validateTokenImport("0x123", "ABC", "18", existing).address).toMatch(/40 hex/);
    expect(validateTokenImport(address, "usd8", "18", existing).symbol).toMatch(/already/);
    expect(
      validateTokenImport(address, "ABC", "18", [{ symbol: "XYZ", address: address.toLowerCase() }])
        .address,
    ).toMatch(/already/);
  });
  it("only accepts whole-number decimals from 0 to 36", () => {
    for (const ok of ["0", "6", "18", "36"])
      expect(validateTokenImport(address, "ABC", ok, existing).decimals).toBeUndefined();
    for (const bad of ["-1", "1.5", "37", "abc"])
      expect(validateTokenImport(address, "ABC", bad, existing).decimals).toMatch(/0 to 36/);
  });
  it("shows a zero balance matching the decimals", () => {
    expect([0, 1, 6].map(zeroBalance)).toEqual(["0", "0.0", "0.00"]);
  });
  it("searches the sample list of the active blockchain only", () => {
    expect(searchTokens("testnet", "wrapped", []).map((t) => t.symbol)).toEqual(["WQDAY"]);
    expect(searchTokens("base-testnet", "wrapped", []).map((t) => t.symbol)).toEqual([
      "WETH",
      "cbBTC",
    ]);
    expect(searchTokens("testnet", "", [])).toHaveLength(3);
    expect(searchTokens("testnet", "zzz", [])).toEqual([]);
  });
  it("hides sample tokens that are already in the list", () => {
    expect(searchTokens("testnet", "", ["wqday"]).map((t) => t.symbol)).toEqual(["SEUR", "SGLD"]);
  });
  it("lists the default tokens per blockchain", () => {
    expect(getChain("qday").defaultTokens).toEqual(["QDAY", "USD8"]);
    expect(getChain("base").defaultTokens).toEqual(["ETH", "USDC"]);
  });
});

describe("SignetPass deployment fee", () => {
  it("is 3 USD8 on QDay and 3 USDC on Base", () => {
    expect(signetPassFee("qday")).toEqual({ amount: 3, token: "USD8" });
    expect(signetPassFee("base")).toEqual({ amount: 3, token: "USDC" });
  });
});

describe("isMainnet", () => {
  it("shows USD values on mainnets only", () => {
    expect(isMainnet("qday-mainnet")).toBe(true);
    expect(isMainnet("base-mainnet")).toBe(true);
    expect(isMainnet("testnet")).toBe(false);
    expect(isMainnet("base-testnet")).toBe(false);
    expect(isMainnet(undefined)).toBe(false);
  });
});

describe("wallet total in USD", () => {
  it("adds each token times its price, with USD8 at one dollar", () => {
    expect(totalUsdValue({ QDAY: 100, USD8: 5 })).toBeCloseTo(17);
    expect(totalUsdValue({})).toBe(0);
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });
});
