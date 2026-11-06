import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { BottomNav } from "@/components/bottom-nav";

beforeEach(() => window.sessionStorage.clear());

describe("Bottom navigation", () => {
  it("keeps the Wallet tab a working link before Signet sign-in", async () => {
    const root = createRootRoute({ component: BottomNav });
    const router = createRouter({
      routeTree: root.addChildren([
        createRoute({ getParentRoute: () => root, path: "/wallet" }),
        createRoute({ getParentRoute: () => root, path: "/agentic" }),
      ]),
      history: createMemoryHistory({ initialEntries: ["/agentic"] }),
    });
    await router.load();
    render(<RouterProvider router={router} />);

    const wallet = await screen.findByRole("link", { name: /Trellis Wallet/ });
    expect(wallet.getAttribute("href")).toBe("/wallet");
    expect(screen.queryByTitle("Sign in to Signet first")).toBeNull();
  });
});
