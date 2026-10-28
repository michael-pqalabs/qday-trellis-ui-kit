// Demo word sample only — a real wallet must use the full BIP-39 list with secure entropy.
const WORDS: string[] = [
  "orbit", "maple", "velvet", "harbor", "canyon", "silent", "ember", "quartz",
  "lunar", "meadow", "falcon", "prism", "river", "copper", "tundra", "willow",
  "beacon", "glacier", "raven", "saddle", "timber", "violet", "anchor", "cobalt",
  "dune", "fable", "garnet", "hollow", "island", "jungle", "kettle", "lemon",
];

const KEY = "trellis.recovery.phrase";

export function shuffle<T>(list: readonly T[]): T[] {
  const out: T[] = [...list];
  const buf = new Uint32Array(out.length);
  crypto.getRandomValues(buf);
  for (let i = out.length - 1; i > 0; i--) {
    const j = (buf[i] ?? 0) % (i + 1);
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export function makePhrase(): string[] {
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => WORDS[n % WORDS.length] ?? "orbit");
}

export function savePhrase(phrase: string[]) {
  try {
    sessionStorage.setItem(KEY, phrase.join(" "));
  } catch {
    /* storage unavailable — the phrase lives in memory for this session */
  }
}

export function loadPhrase(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parts = raw.split(" ");
      if (parts.length === 12 && parts.every((p) => WORDS.includes(p))) return parts;
    }
  } catch {
    /* fall through to a fresh phrase */
  }
  const fresh = makePhrase();
  savePhrase(fresh);
  return fresh;
}

export function clearPhrase() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

// Distractor words for the confirmation check: never from the user's own phrase.
export function distractors(count: number, phrase: string[]): string[] {
  const pool = WORDS.filter((w) => !phrase.includes(w));
  return shuffle(pool).slice(0, count);
}

// Three positions inside a 12-word phrase whose words all differ, so each slot has one clear answer.
export function pickSpots(phrase: string[]): number[] {
  for (let attempt = 0; attempt < 12; attempt++) {
    const buf = new Uint32Array(6);
    crypto.getRandomValues(buf);
    const spots: number[] = [];
    for (const n of buf) {
      const i = n % phrase.length;
      if (!spots.includes(i)) spots.push(i);
      if (spots.length === 3) break;
    }
    while (spots.length < 3) spots.push(((spots[spots.length - 1] ?? 0) + 4) % phrase.length);
    if (new Set(spots.map((i) => phrase[i])).size === 3) return spots.sort((a, b) => a - b);
  }
  return [0, 4, 8];
}
