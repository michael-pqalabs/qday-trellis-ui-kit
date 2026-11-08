/**
 * Recipient address checks for Send: shape while typing, plus the EIP-55 mixed-case checksum. The
 * checksum needs Keccak-256, so a small BigInt implementation lives here instead of a dependency.
 */

const MASK = (1n << 64n) - 1n;
const rotl = (value: bigint, bits: number) =>
  bits === 0 ? value : ((value << BigInt(bits)) | (value >> BigInt(64 - bits))) & MASK;

function keccakF(state: bigint[]) {
  let lfsr = 1;
  for (let round = 0; round < 24; round++) {
    // Theta
    const c: bigint[] = [];
    for (let x = 0; x < 5; x++)
      c[x] = state[x]! ^ state[x + 5]! ^ state[x + 10]! ^ state[x + 15]! ^ state[x + 20]!;
    for (let x = 0; x < 5; x++) {
      const d = c[(x + 4) % 5]! ^ rotl(c[(x + 1) % 5]!, 1);
      for (let y = 0; y < 5; y++) state[x + 5 * y] = state[x + 5 * y]! ^ d;
    }
    // Rho and Pi
    let x = 1;
    let y = 0;
    let current = state[x + 5 * y]!;
    for (let t = 0; t < 24; t++) {
      const nextX = y;
      const nextY = (2 * x + 3 * y) % 5;
      const moved = state[nextX + 5 * nextY]!;
      state[nextX + 5 * nextY] = rotl(current, (((t + 1) * (t + 2)) / 2) % 64);
      current = moved;
      x = nextX;
      y = nextY;
    }
    // Chi
    for (let row = 0; row < 5; row++) {
      const line = state.slice(5 * row, 5 * row + 5);
      for (let col = 0; col < 5; col++)
        state[col + 5 * row] = line[col]! ^ (~line[(col + 1) % 5]! & line[(col + 2) % 5]!);
    }
    // Iota
    for (let j = 0; j < 7; j++) {
      lfsr = ((lfsr << 1) ^ ((lfsr >> 7) * 0x71)) % 256;
      if (lfsr & 2) state[0] = state[0]! ^ (1n << BigInt((1 << j) - 1));
    }
  }
}

/** Keccak-256 (the original padding Ethereum uses, not NIST SHA-3) as lowercase hex. */
export function keccak256Hex(input: Uint8Array): string {
  const rate = 136;
  const padded = new Uint8Array(Math.ceil((input.length + 1) / rate) * rate);
  padded.set(input);
  padded[input.length] = 0x01;
  padded[padded.length - 1] = padded[padded.length - 1]! | 0x80;
  const state: bigint[] = Array.from({ length: 25 }, () => 0n);
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let lane = 0; lane < rate / 8; lane++) {
      let word = 0n;
      for (let byte = 7; byte >= 0; byte--)
        word = (word << 8n) | BigInt(padded[offset + lane * 8 + byte]!);
      state[lane] = state[lane]! ^ word;
    }
    keccakF(state);
  }
  let hex = "";
  for (let lane = 0; lane < 4; lane++)
    for (let byte = 0; byte < 8; byte++)
      hex += Number((state[lane]! >> BigInt(8 * byte)) & 0xffn)
        .toString(16)
        .padStart(2, "0");
  return hex;
}

/** EIP-55 mixed-case form of a 40-hex-character address (with or without the 0x prefix). */
export function toChecksumAddress(address: string): string {
  const body = address.replace(/^0x/i, "").toLowerCase();
  const hash = keccak256Hex(new TextEncoder().encode(body));
  let out = "0x";
  for (let i = 0; i < body.length; i++)
    out += parseInt(hash[i]!, 16) >= 8 ? body[i]!.toUpperCase() : body[i]!;
  return out;
}

/** All-lowercase and all-uppercase addresses carry no checksum; mixed case must match EIP-55. */
export function hasValidChecksum(address: string): boolean {
  const body = address.slice(2);
  if (body === body.toLowerCase() || body === body.toUpperCase()) return true;
  return toChecksumAddress(address) === address;
}

export type RecipientCheck =
  | { state: "empty" }
  | { state: "incomplete"; message: string }
  | { state: "invalid"; message: string }
  | { state: "valid" };

export const ADDRESS_LENGTH = 42;

/**
 * Checks a recipient as the user types. A short address is "incomplete", not an error, so the field
 * does not shout before the user has finished; anything that can no longer become valid is "invalid".
 */
export function checkRecipient(raw: string): RecipientCheck {
  const value = raw.trim();
  if (!value) return { state: "empty" };
  if (value[0] !== "0" || (value.length > 1 && value[1] !== "x"))
    return { state: "invalid", message: "An address starts with 0x." };
  const body = value.slice(2);
  if (/[^0-9a-fA-F]/.test(body))
    return { state: "invalid", message: "Use only the characters 0-9 and a-f after 0x." };
  if (value.length > ADDRESS_LENGTH)
    return {
      state: "invalid",
      message: `Too long: an address is ${ADDRESS_LENGTH} characters including 0x.`,
    };
  if (value.length < ADDRESS_LENGTH)
    return {
      state: "incomplete",
      message: `${value.length} of ${ADDRESS_LENGTH} characters`,
    };
  if (!hasValidChecksum(value))
    return {
      state: "invalid",
      message: "The checksum doesn't match. Check for a typo, or paste the address again.",
    };
  return { state: "valid" };
}
