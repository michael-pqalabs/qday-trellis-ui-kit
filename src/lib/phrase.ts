// Demo word sample only — a real wallet must use the full BIP-39 list with secure entropy.
const WORDS: string[] = [
  "orbit",
  "maple",
  "velvet",
  "harbor",
  "canyon",
  "silent",
  "ember",
  "quartz",
  "lunar",
  "meadow",
  "falcon",
  "prism",
  "river",
  "copper",
  "tundra",
  "willow",
  "beacon",
  "glacier",
  "raven",
  "saddle",
  "timber",
  "violet",
  "anchor",
  "cobalt",
  "dune",
  "fable",
  "garnet",
  "hollow",
  "island",
  "jungle",
  "kettle",
  "lemon",
];

const KEY = "trellis.recovery.phrase";

export const PHRASE_LENGTH = 24;

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

// Distinct words keep every confirm slot unambiguous and leave enough sample words for distractors.
export function makePhrase(): string[] {
  return shuffle(WORDS).slice(0, PHRASE_LENGTH);
}

export function savePhrase(phrase: string[]) {
  try {
    sessionStorage.setItem(KEY, phrase.join(" "));
  } catch {
    /* storage unavailable — the phrase lives in memory for this session */
  }
}

/** True once a phrase exists in this session (setup was started). Unlike loadPhrase, never creates one. */
export function hasSavedPhrase(): boolean {
  try {
    return !!sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function loadPhrase(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parts = raw.split(" ");
      if (parts.length === PHRASE_LENGTH && parts.every((p) => WORDS.includes(p))) return parts;
    }
  } catch {
    /* fall through to a fresh phrase */
  }
  const fresh = makePhrase();
  savePhrase(fresh);
  return fresh;
}

// English ordinal for a 1-based position: 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st, 22nd, 23rd…
export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
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

// Three positions inside the 24-word phrase whose words all differ, so each slot has one clear answer.
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
    while (spots.length < 3) spots.push(((spots[spots.length - 1] ?? 0) + 8) % phrase.length);
    if (new Set(spots.map((i) => phrase[i])).size === 3) return spots.sort((a, b) => a - b);
  }
  return [0, 8, 16];
}
