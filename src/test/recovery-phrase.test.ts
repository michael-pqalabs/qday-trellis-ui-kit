import { describe, expect, it } from "vitest";

import { distractors, loadPhrase, makePhrase, ordinal, pickSpots, savePhrase } from "@/lib/phrase";

// The confirm step asks for three words only, so those three must never be ambiguous
// and the extra words on offer must never come from the user's own phrase.
describe("Recovery phrase helpers", () => {
  it("makes a 24 word phrase of distinct words", () => {
    const phrase = makePhrase();
    expect(phrase).toHaveLength(24);
    expect(new Set(phrase).size).toBe(24);
  });

  it("asks for three different positions holding three different words", () => {
    const phrase = makePhrase();
    const spots = pickSpots(phrase);

    expect(spots).toHaveLength(3);
    expect(new Set(spots).size).toBe(3);
    expect(Math.max(...spots)).toBeLessThan(24);
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
    const phrase = [
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
    ];
    savePhrase(phrase);

    expect(loadPhrase()).toEqual(phrase);
  });

  it("writes English ordinals for every position in a phrase", () => {
    expect([1, 2, 3, 4, 10, 11, 12, 13, 14, 20, 21, 22, 23, 24].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "10th",
      "11th",
      "12th",
      "13th",
      "14th",
      "20th",
      "21st",
      "22nd",
      "23rd",
      "24th",
    ]);
  });
});
