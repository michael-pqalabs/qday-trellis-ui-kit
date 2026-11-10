import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync("src/styles.css", "utf8");

it("uses the brand kit v5 deep-teal divider (#234d53) on dark surfaces", () => {
  const dark = css.slice(css.indexOf(".dark {"));
  expect(dark).toContain("--divider: #234d53;");
});

it("keeps a light-mode divider tone and exposes it as a theme token", () => {
  const light = css.slice(css.indexOf(":root {"), css.indexOf(".dark {"));
  expect(light).toMatch(/--divider: #[0-9a-f]{6};/i);
  expect(css).toContain("--color-divider: var(--divider);");
});
