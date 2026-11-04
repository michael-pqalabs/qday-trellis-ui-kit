import { fireEvent, render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { AgentCard, RevokedAgentCard } from "@/components/agent-list";
import type { RegisteredAgent } from "@/lib/qpass";

const NOW = Date.UTC(2026, 10, 4);
const base: RegisteredAgent = {
  id: "agent-checkout-01",
  passId: "pass-1",
  name: "Checkout assistant",
  client: "signet-cli · ubuntu-dev",
  status: "linked",
};
const session = {
  id: "s1",
  perPaymentLimit: 10,
  totalBudget: 150,
  spent: 45,
  startedAt: NOW - 1000,
  expiresAt: NOW + 86_400_000,
  status: "active" as const,
};

async function show(ui: () => React.ReactNode) {
  const root = createRootRoute({ component: () => <>{ui()}</> });
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: "/agentic/agent/$agentId" }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
}

describe("Agents tab cards", () => {
  it("offers View Spending Session only when the agent has a session", async () => {
    await show(() => (
      <>
        <AgentCard agent={{ ...base, session }} now={NOW} onRevoke={() => {}} />
        <AgentCard
          agent={{ ...base, id: "agent-news-05", name: "Newsletter writer" }}
          now={NOW}
          onRevoke={() => {}}
        />
      </>
    ));
    const links = await screen.findAllByRole("link", { name: /View Spending Session/ });
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute("href")).toBe("/agentic/agent/agent-checkout-01");
    expect(screen.getAllByRole("button", { name: /^Revoke/ })).toHaveLength(2);
    expect(screen.getByText("Spent 45 / 150 USD8")).toBeTruthy();
  });

  it("calls onRevoke with the agent id", async () => {
    const onRevoke = vi.fn();
    await show(() => <AgentCard agent={base} now={NOW} onRevoke={onRevoke} />);
    fireEvent.click(await screen.findByRole("button", { name: "Revoke Checkout assistant" }));
    expect(onRevoke).toHaveBeenCalledWith("agent-checkout-01");
  });

  it("shows the revocation date in History", async () => {
    const revokedAt = Date.UTC(2026, 9, 12, 12);
    await show(() => (
      <RevokedAgentCard
        agent={{ ...base, name: "Data scraper", status: "revoked", revokedAt, session }}
      />
    ));
    expect(await screen.findByText("Revoked")).toBeTruthy();
    expect(screen.getByText(/Revoked on .*2026/)).toBeTruthy();
    expect(screen.queryByRole("link", { name: /View Spending Session/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Revoke/ })).toBeNull();
  });
});
