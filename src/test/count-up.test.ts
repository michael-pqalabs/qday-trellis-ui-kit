import { describe, expect, it } from "vitest";

import { countUpValue, easeOutCubic } from "@/components/count-up";

describe("Count-up helpers", () => {
  it("starts at the old value and lands exactly on the new one", () => {
    expect(countUpValue(0, 50, 0)).toBe(0);
    expect(countUpValue(0, 50, 1)).toBe(50);
    expect(countUpValue(50, 20, 1)).toBe(20);
  });

  it("eases out and never overshoots", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(3)).toBe(1);
  });
});
