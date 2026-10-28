import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync("src/styles.css", "utf8");

it("uses #1E252F for dividers on dark surfaces", () => {
  const dark = css.slice(css.indexOf(".dark {"));
  expect(dark).toContain("--divider: #1E252F;");
});

it("keeps a light-mode divider tone and exposes it as a theme token", () => {
  const light = css.slice(css.indexOf(":root {"), css.indexOf(".dark {"));
  expect(light).toMatch(/--divider: #[0-9A-F]{6};/);
  expect(css).toContain("--color-divider: var(--divider);");
});
