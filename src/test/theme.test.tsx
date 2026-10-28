import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ThemeProvider, ThemeToggle } from "@/components/theme-provider";

afterEach(() => { cleanup(); localStorage.clear(); document.documentElement.classList.remove("dark"); });

it("switches between light and dark and remembers the selected version", () => {
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem("trellis-theme")).toBe("dark");
  fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  expect(localStorage.getItem("trellis-theme")).toBe("light");
});

it("restores the dark theme preference on opening another screen", () => {
  localStorage.setItem("trellis-theme", "dark");
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});