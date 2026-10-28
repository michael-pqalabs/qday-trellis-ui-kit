import { describe, expect, it } from "vitest";

import { distractors, loadPhrase, makePhrase, pickSpots, savePhrase } from "@/lib/phrase";

// The confirm step asks for three words only, so those three must never be ambiguous
// and the extra words on offer must never come from the user's own phrase.
describe("Recovery phrase helpers", () => {
  it("makes a twelve word phrase", () => {
    expect(makePhrase()).toHaveLength(12);
  });

  it("asks for three different positions holding three different words", () => {
    const phrase = makePhrase();
    const spots = pickSpots(phrase);

    expect(spots).toHaveLength(3);
    expect(new Set(spots).size).toBe(3);
    expect(Math.max(...spots)).toBeLessThan(12);
    expect(Math.min(...spots)).toBeGreaterThanOrEqual(0);
    expect(new Set(spots.map((i) => phrase[i])).size).toBe(3);
  });

  it("never offers a phrase word as a wrong answer", () => {
    const phrase = makePhrase();
    const extra = distractors(6, phrase);

    expect(extra).toHaveLength(6);
    for (const word of extra) {
      expect(phrase).not.toContain(word);
    }
  });

  it("reads back the phrase that was saved", () => {
    const phrase = ["orbit", "maple", "velvet", "harbor", "canyon", "silent", "ember", "quartz", "lunar", "meadow", "falcon", "prism"];
    savePhrase(phrase);

    expect(loadPhrase()).toEqual(phrase);
  });
});
