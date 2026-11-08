import { describe, expect, it } from "vitest";
import { checkRecipient, keccak256Hex, toChecksumAddress } from "@/lib/eth-address";

// EIP-55 reference addresses.
const CHECKSUMMED = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";

describe("keccak256Hex", () => {
  it("matches the known empty-input and 'abc' digests", () => {
    expect(keccak256Hex(new Uint8Array())).toBe(
      "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
    expect(keccak256Hex(new TextEncoder().encode("abc"))).toBe(
      "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
    );
  });
});

describe("checkRecipient", () => {
  it("rebuilds the EIP-55 checksum", () => {
    expect(toChecksumAddress(CHECKSUMMED.toLowerCase())).toBe(CHECKSUMMED);
  });
  it("treats empty as empty and a short address as incomplete, not an error", () => {
    expect(checkRecipient("").state).toBe("empty");
    expect(checkRecipient("0x5aAe")).toMatchObject({ state: "incomplete" });
    expect(checkRecipient("0")).toMatchObject({ state: "incomplete" });
  });
  it("flags a wrong prefix, non-hex characters and extra length as soon as they appear", () => {
    expect(checkRecipient("1x5aAe").state).toBe("invalid");
    expect(checkRecipient("0x5aAg").state).toBe("invalid");
    expect(checkRecipient(CHECKSUMMED + "0").state).toBe("invalid");
  });
  it("accepts all-lowercase and correctly checksummed addresses", () => {
    expect(checkRecipient(CHECKSUMMED.toLowerCase()).state).toBe("valid");
    expect(checkRecipient(CHECKSUMMED).state).toBe("valid");
  });
  it("rejects a mixed-case address whose checksum is wrong", () => {
    const typo = CHECKSUMMED.replace("5aAeb", "5AAeb");
    expect(checkRecipient(typo)).toMatchObject({ state: "invalid" });
  });
});
