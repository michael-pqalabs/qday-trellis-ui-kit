import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ThemeProvider, ThemeToggle } from "@/components/theme-provider";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

it("starts in dark mode (brand kit v5 default), switches and remembers the selected version", () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  expect(localStorage.getItem("trellis-theme-v5")).toBe("light");
  fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem("trellis-theme-v5")).toBe("dark");
});

it("restores a stored light preference over the dark default", () => {
  localStorage.setItem("trellis-theme-v5", "light");
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});

it("restores the dark theme preference on opening another screen", () => {
  localStorage.setItem("trellis-theme-v5", "dark");
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

it("ignores a light choice saved before brand kit v5 and starts on dark", () => {
  localStorage.setItem("trellis-theme", "light");
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});
