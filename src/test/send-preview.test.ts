import { describe, expect, it } from "vitest";
import { transactionsFor, validateSend } from "@/lib/wallet-preview";

describe("Send validation", () => {
  it("rejects a malformed recipient", () => {
    expect(validateSend("0x123", "1").recipient).toBeDefined();
  });
  it("rejects zero amount", () => {
    expect(validateSend("0x" + "a".repeat(40), "0").amount).toBeDefined();
  });
  it("accepts a valid address and positive amount", () => {
    expect(validateSend("0x" + "a".repeat(40), "1.5")).toEqual({});
  });
  it("scopes sample history to the selected wallet", () => {
    expect(transactionsFor("main").every((tx) => tx.walletId === "main")).toBe(true);
    expect(transactionsFor("another-wallet")).toEqual([]);
  });
});
