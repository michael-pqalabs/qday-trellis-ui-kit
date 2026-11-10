import { beforeEach, describe, expect, it } from "vitest";
import {
  activateQPass,
  canRequestSession,
  createSpendingSession,
  MAX_SESSION_DAYS,
  pendingRequestFor,
  CLI_SIGN_MS,
  createQPass,
  endCliSession,
  isAwaitingCli,
  loadQPassState,
  renameQPass,
  resetQPassState,
  resolveApproval,
  REVOKE_CONFIRM_MS,
  simulateAgentRegistration,
  simulateSessionRequest,
  startRevokeAgent,
  updateApprovalLimits,
  validateNewSession,
  validateApprovalLimits,
  validateQPassInput,
} from "@/lib/qpass";
const NOW = 1800000000000;
beforeEach(() => window.sessionStorage.clear());
describe("SignetPass accounts demo", () => {
  it("requires only a SignetPass name, without terminal limits", () => {
    expect(validateQPassInput({ name: " " })).toBe("SignetPass name is required.");
    const pass = createQPass({ name: "  Travel  " }, NOW);
    expect(pass.name).toBe("Travel");
    expect(pass.balance).toBe(0);
    expect(pass.status).toBe("inactive");
    expect(pass).not.toHaveProperty("perPaymentLimit");
    expect(pass).not.toHaveProperty("totalBudget");
  });
  it("puts a new SignetPass on Base unless another blockchain is chosen", () => {
    expect(createQPass({ name: "A" }, NOW).chainId).toBe("base");
    expect(createQPass({ name: "B", chainId: "qday" }, NOW).chainId).toBe("qday");
  });
  it("gives each SignetPass its own hex address and zero initial balance", () => {
    const a = createQPass({ name: "A" }, NOW);
    const b = createQPass({ name: "B" }, NOW);
    expect(a.address).not.toBe(b.address);
    expect(a.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(a.balance).toBe(0);
    expect(b.balance).toBe(0);
  });
  it("renames without changing the account", () => {
    const p = createQPass({ name: "A" }, NOW);
    const next = renameQPass(p.id, "B", NOW).passes.find((a) => a.id === p.id);
    expect(next?.name).toBe("B");
    expect(next?.address).toBe(p.address);
  });
  it("simulates activation without changing balances", () => {
    const p = createQPass({ name: "A" }, NOW);
    const next = activateQPass(p.id, NOW).passes.find((a) => a.id === p.id);
    expect(next?.status).toBe("active");
    expect(next?.balance).toBe(0);
  });
  it("approves terminal limits unchanged and links only the selected agent", () => {
    loadQPassState(NOW);
    const next = resolveApproval("req-01", "approved", NOW);
    expect(next.approvals[0]?.perPaymentLimit).toBe(10);
    expect(next.approvals[0]?.totalBudget).toBe(100);
    expect(next.approvals[0]?.status).toBe("approved");
    expect(next.agents.find((a) => a.id === "agent-req-01")?.passId).toBe("qp-shopping");
  });
  it("rejects without linking an agent", () => {
    const before = loadQPassState(NOW).agents.length;
    const next = resolveApproval("req-01", "rejected", NOW);
    expect(next.approvals[0]?.status).toBe("rejected");
    expect(next.agents).toHaveLength(before);
  });
  it("cannot approve an expired request", () => {
    const before = loadQPassState(NOW).agents.length;
    const next = resolveApproval("req-01", "approved", NOW + 15 * 60000);
    expect(next.approvals[0]?.status).toBe("expired");
    expect(next.agents).toHaveLength(before);
  });
  it("cannot approve twice", () => {
    const before = loadQPassState(NOW).agents.length;
    resolveApproval("req-01", "approved", NOW);
    expect(resolveApproval("req-01", "approved", NOW).agents).toHaveLength(before + 1);
  });
  it("revokes an agent without revoking its SignetPass", () => {
    loadQPassState(NOW);
    startRevokeAgent("agent-checkout-01", "confirmed", NOW);
    const next = loadQPassState(NOW + REVOKE_CONFIRM_MS);
    expect(next.agents[0]?.status).toBe("revoked");
    expect(next.passes[0]?.status).toBe("active");
  });
  it("logs out CLI independently from agents", () => {
    loadQPassState(NOW);
    const next = endCliSession("cli-1", NOW);
    expect(next.cliSessions[0]?.status).toBe("ended");
    expect(next.agents[0]?.status).toBe("linked");
  });
});

import { revokeSession } from "@/lib/qpass";
describe("agent spending sessions", () => {
  beforeEach(() => sessionStorage.clear());
  it("revoking session keeps agent linked", () => {
    loadQPassState(NOW);
    const s = revokeSession("agent-checkout-01", NOW);
    expect(s.agents[0]?.session?.status).toBe("revoked");
    expect(s.agents[0]?.status).toBe("linked");
  });
  it("revoking agent also revokes session, once confirmed", () => {
    loadQPassState(NOW);
    startRevokeAgent("agent-checkout-01", "confirmed", NOW);
    const s = loadQPassState(NOW + REVOKE_CONFIRM_MS);
    expect(s.agents[0]?.session?.status).toBe("revoked");
  });
});

describe("Registered agents", () => {
  it("records when an agent is revoked, at confirmation time", () => {
    startRevokeAgent("agent-checkout-01", "confirmed", NOW);
    const next = loadQPassState(NOW + REVOKE_CONFIRM_MS + 500);
    expect(next.agents.find((a) => a.id === "agent-checkout-01")?.revokedAt).toBe(
      NOW + REVOKE_CONFIRM_MS,
    );
  });
  it("keeps the seeded revoked agent with its revocation date", () => {
    const state = loadQPassState(NOW);
    const scraper = state.agents.find((a) => a.id === "agent-scraper-04");
    expect(scraper?.status).toBe("revoked");
    expect(scraper?.revokedAt).toBeLessThan(NOW);
  });
  it("allows an agent that is registered without a spending session", () => {
    const state = loadQPassState(NOW);
    const agent = state.agents.find((a) => a.id === "agent-newsletter-05");
    expect(agent?.status).toBe("linked");
    expect(agent?.session).toBeUndefined();
  });
  it("replaces the session instead of adding a second one for the same agent", () => {
    const state = loadQPassState(NOW);
    state.approvals.push({
      ...state.approvals[0]!,
      id: "req-extra",
      totalBudget: 500,
      status: "pending",
      expiresAt: NOW + 3600000,
    });
    window.sessionStorage.setItem("trellis-qpass-v19", JSON.stringify(state));
    resolveApproval("req-01", "approved", NOW);
    const next = resolveApproval("req-extra", "approved", NOW);
    const matches = next.agents.filter((a) => a.name === "Research assistant");
    expect(matches).toHaveLength(1);
    expect(matches[0]?.session?.totalBudget).toBe(500);
  });
});

describe("Agent revocation awaits on-chain confirmation", () => {
  const find = (s: ReturnType<typeof loadQPassState>) =>
    s.agents.find((a) => a.id === "agent-checkout-01");
  it("shows revoking, not revoked, until confirmed, and access stays live", () => {
    loadQPassState(NOW);
    const submitted = startRevokeAgent("agent-checkout-01", "confirmed", NOW);
    expect(find(submitted)?.status).toBe("revoking");
    expect(find(submitted)?.revokedAt).toBeUndefined();
    expect(find(submitted)?.session?.status).toBe("active");
    const waiting = loadQPassState(NOW + REVOKE_CONFIRM_MS - 1);
    expect(find(waiting)?.status).toBe("revoking");
    expect(find(waiting)?.revokedAt).toBeUndefined();
    const done = loadQPassState(NOW + REVOKE_CONFIRM_MS);
    expect(find(done)?.status).toBe("revoked");
    expect(find(done)?.session?.status).toBe("revoked");
  });
  it("returns to linked and flags the failure when confirmation fails", () => {
    loadQPassState(NOW);
    startRevokeAgent("agent-checkout-01", "failed", NOW);
    const failed = loadQPassState(NOW + REVOKE_CONFIRM_MS);
    expect(find(failed)?.status).toBe("linked");
    expect(find(failed)?.revokedAt).toBeUndefined();
    expect(find(failed)?.revokeFailedAt).toBe(NOW + REVOKE_CONFIRM_MS);
    expect(find(failed)?.session?.status).toBe("active");
    expect(failed.activity[0]?.label).toContain("revocation not confirmed");
  });
  it("lets a failed revocation be retried and clears the failure", () => {
    loadQPassState(NOW);
    startRevokeAgent("agent-checkout-01", "failed", NOW);
    loadQPassState(NOW + REVOKE_CONFIRM_MS);
    const retry = startRevokeAgent("agent-checkout-01", "confirmed", NOW + 10000);
    expect(find(retry)?.status).toBe("revoking");
    expect(find(retry)?.revokeFailedAt).toBeUndefined();
  });
  it("ignores a second submission while revoking", () => {
    loadQPassState(NOW);
    startRevokeAgent("agent-checkout-01", "confirmed", NOW);
    const again = startRevokeAgent("agent-checkout-01", "failed", NOW + 1000);
    expect(find(again)?.revocation?.outcome).toBe("confirmed");
  });
});

describe("Spending sessions have no pause or resume", () => {
  it("seeds only active sessions for linked agents", () => {
    const sessions = loadQPassState(NOW)
      .agents.filter((a) => a.session && a.status === "linked")
      .map((a) => a.session?.status);
    expect(sessions.length).toBeGreaterThan(0);
    expect(new Set(sessions)).toEqual(new Set(["active"]));
  });
});

describe("Editing spending limits before approval", () => {
  const current = { perPaymentLimit: 10, totalBudget: 100, durationDays: 7 };
  const input = (per: string, total: string, days: string) => ({
    perPaymentLimit: per,
    totalBudget: total,
    durationDays: days,
  });
  it("accepts lowered limits", () => {
    const { values, errors } = validateApprovalLimits(current, input("5", "50.5", "3"));
    expect(errors).toEqual({});
    expect(values).toEqual({ perPaymentLimit: 5, totalBudget: 50.5, durationDays: 3 });
  });
  it("rejects raised, zero, malformed and inconsistent limits", () => {
    expect(
      validateApprovalLimits(current, input("11", "100", "7")).errors.perPaymentLimit,
    ).toBeTruthy();
    expect(
      validateApprovalLimits(current, input("10", "101", "7")).errors.totalBudget,
    ).toBeTruthy();
    expect(
      validateApprovalLimits(current, input("0", "100", "7")).errors.perPaymentLimit,
    ).toBeTruthy();
    expect(
      validateApprovalLimits(current, input("1e2", "100", "7")).errors.perPaymentLimit,
    ).toBeTruthy();
    expect(
      validateApprovalLimits(current, input("1.1234567", "100", "7")).errors.perPaymentLimit,
    ).toBeTruthy();
    expect(
      validateApprovalLimits(current, input("10", "100", "8")).errors.durationDays,
    ).toBeTruthy();
    expect(
      validateApprovalLimits(current, input("10", "100", "0")).errors.durationDays,
    ).toBeTruthy();
    expect(
      validateApprovalLimits(current, input("10", "100", "1.5")).errors.durationDays,
    ).toBeTruthy();
    expect(
      validateApprovalLimits(current, input("60", "50", "7")).errors.perPaymentLimit,
    ).toBeTruthy();
  });
  it("rejects a per-payment limit above the lowered total", () => {
    const { values, errors } = validateApprovalLimits(current, input("10", "5", "7"));
    expect(values).toBeNull();
    expect(errors.perPaymentLimit).toBeTruthy();
  });
  it("saves lowered limits, keeps the terminal values and waits for the terminal to sign", () => {
    loadQPassState(NOW);
    const next = updateApprovalLimits(
      "req-01",
      { perPaymentLimit: 5, totalBudget: 40, durationDays: 3 },
      NOW,
    );
    const r = next.approvals.find((a) => a.id === "req-01")!;
    expect(r.perPaymentLimit).toBe(5);
    expect(r.terminal).toEqual({ perPaymentLimit: 10, totalBudget: 100, durationDays: 7 });
    expect(isAwaitingCli(r, NOW + CLI_SIGN_MS - 1)).toBe(true);
    expect(isAwaitingCli(r, NOW + CLI_SIGN_MS)).toBe(false);
  });
  it("cannot be approved until the terminal has signed, then grants the edited limits", () => {
    loadQPassState(NOW);
    updateApprovalLimits("req-01", { perPaymentLimit: 5, totalBudget: 40, durationDays: 3 }, NOW);
    const blocked = resolveApproval("req-01", "approved", NOW + 1000);
    expect(blocked.approvals.find((a) => a.id === "req-01")?.status).toBe("pending");
    const done = resolveApproval("req-01", "approved", NOW + CLI_SIGN_MS);
    expect(done.approvals.find((a) => a.id === "req-01")?.status).toBe("approved");
    expect(done.agents.find((a) => a.id === "agent-req-01")?.session?.totalBudget).toBe(40);
  });
  it("ignores an edit that changes nothing", () => {
    loadQPassState(NOW);
    const next = updateApprovalLimits("req-01", current, NOW);
    expect(next.approvals.find((a) => a.id === "req-01")?.terminal).toBeUndefined();
  });
});

describe("Agent flow follows the CLI", () => {
  const find = (s: ReturnType<typeof loadQPassState>, id: string) =>
    s.agents.find((a) => a.id === id);
  const newest = (s: ReturnType<typeof loadQPassState>) => s.agents[s.agents.length - 1]!;

  it("gives every sample request a session-key address", () => {
    const pending = loadQPassState(NOW).approvals.filter((r) => r.status === "pending");
    expect(pending.length).toBeGreaterThan(0);
    for (const r of pending) expect(r.sessionKey).toMatch(/^0x[0-9a-f]{40}$/);
  });
  it("has no registration approval: a registered agent just appears as Linked, with no session", () => {
    const before = loadQPassState(NOW).agents.length;
    const next = simulateAgentRegistration("qp-shopping", NOW);
    expect(next).not.toHaveProperty("registrations");
    expect(next.agents).toHaveLength(before + 1);
    const agent = newest(next);
    expect(agent.status).toBe("linked");
    expect(agent.passId).toBe("qp-shopping");
    expect(agent.session).toBeUndefined();
    expect(agent.vendor).toBeTruthy();
  });
  it("registers into a SignetPass that was just created, even before it is activated", () => {
    const pass = createQPass({ name: "Fresh" }, NOW);
    const next = simulateAgentRegistration(pass.id, NOW);
    expect(newest(next).passId).toBe(pass.id);
  });
  it("ignores an unknown SignetPass", () => {
    const before = loadQPassState(NOW).agents.length;
    expect(simulateAgentRegistration("nope", NOW).agents).toHaveLength(before);
  });
  it("the agent, not Trellis, asks for a session, with a task summary", () => {
    loadQPassState(NOW);
    const agent = find(loadQPassState(NOW), "agent-newsletter-05")!;
    const next = simulateSessionRequest(agent.id, NOW);
    expect(find(next, agent.id)?.session).toBeUndefined();
    const request = pendingRequestFor(next, agent, NOW);
    expect(request?.agentId).toBe(agent.id);
    expect(request?.taskSummary).toBeTruthy();
    expect(request?.sessionKey).toMatch(/^0x[0-9a-f]{40}$/);
    expect(request?.durationDays).toBeLessThanOrEqual(MAX_SESSION_DAYS);
  });
  it("asks only once while a request is waiting", () => {
    loadQPassState(NOW);
    simulateSessionRequest("agent-newsletter-05", NOW);
    const count = loadQPassState(NOW).approvals.length;
    expect(simulateSessionRequest("agent-newsletter-05", NOW).approvals).toHaveLength(count);
  });
  it("cannot ask while the agent still has a usable session, or once revoked", () => {
    const state = loadQPassState(NOW);
    const active = find(state, "agent-checkout-01")!;
    expect(canRequestSession(active, NOW)).toBe(false);
    expect(canRequestSession(active, active.session!.expiresAt)).toBe(true);
    expect(
      canRequestSession({ ...active, session: { ...active.session!, status: "revoked" } }, NOW),
    ).toBe(true);
    expect(canRequestSession({ ...active, status: "revoked" }, active.session!.expiresAt)).toBe(
      false,
    );
    const count = state.approvals.length;
    expect(simulateSessionRequest("agent-checkout-01", NOW).approvals).toHaveLength(count);
    expect(simulateSessionRequest("agent-scraper-04", NOW).approvals).toHaveLength(count);
  });
  it("approving the request gives that agent its session, copying the task summary", () => {
    loadQPassState(NOW);
    const asked = simulateSessionRequest("agent-newsletter-05", NOW);
    const request = asked.approvals[0]!;
    const next = resolveApproval(request.id, "approved", NOW);
    const agent = find(next, "agent-newsletter-05")!;
    expect(agent.session?.status).toBe("active");
    expect(agent.session?.totalBudget).toBe(request.totalBudget);
    expect(agent.session?.taskSummary).toBe(request.taskSummary);
    expect(next.agents.filter((a) => a.name === "Newsletter writer")).toHaveLength(1);
    expect(canRequestSession(agent, NOW)).toBe(false);
  });
  it("lets the owner lower the limits of a requested session before approving", () => {
    loadQPassState(NOW);
    const request = simulateSessionRequest("agent-newsletter-05", NOW).approvals[0]!;
    updateApprovalLimits(request.id, { perPaymentLimit: 2, totalBudget: 20, durationDays: 3 }, NOW);
    const next = resolveApproval(request.id, "approved", NOW + CLI_SIGN_MS);
    expect(find(next, "agent-newsletter-05")?.session?.totalBudget).toBe(20);
  });
  it("a rejected request leaves the agent linked without a session", () => {
    loadQPassState(NOW);
    const request = simulateSessionRequest("agent-newsletter-05", NOW).approvals[0]!;
    const next = resolveApproval(request.id, "rejected", NOW);
    expect(find(next, "agent-newsletter-05")?.status).toBe("linked");
    expect(find(next, "agent-newsletter-05")?.session).toBeUndefined();
  });
  it("works end to end on a brand-new SignetPass: register, ask, approve", () => {
    const pass = createQPass({ name: "Fresh" }, NOW);
    activateQPass(pass.id, NOW);
    const agent = newest(simulateAgentRegistration(pass.id, NOW));
    const request = simulateSessionRequest(agent.id, NOW).approvals[0]!;
    const next = resolveApproval(request.id, "approved", NOW);
    expect(find(next, agent.id)?.session?.status).toBe("active");
  });
});

describe("Create spending session in Trellis", () => {
  const limits = { perPaymentLimit: 5, totalBudget: 50, durationDays: 7 };
  const find = (s: ReturnType<typeof loadQPassState>, id: string) =>
    s.agents.find((a) => a.id === id);
  it("validates limits, with a 30-day ceiling", () => {
    expect(
      validateNewSession({ perPaymentLimit: "5", totalBudget: "50", durationDays: "7" }).values,
    ).toEqual(limits);
    expect(
      validateNewSession({ perPaymentLimit: "5", totalBudget: "50", durationDays: "30" }).values,
    ).not.toBeNull();
    const long = validateNewSession({
      perPaymentLimit: "5",
      totalBudget: "50",
      durationDays: "31",
    });
    expect(long.values).toBeNull();
    expect(long.errors.durationDays).toMatch(/1 to 30/);
    const bad = validateNewSession({ perPaymentLimit: "60", totalBudget: "50", durationDays: "0" });
    expect(bad.values).toBeNull();
    expect(bad.errors.perPaymentLimit).toMatch(/exceed/);
    expect(
      validateNewSession({ perPaymentLimit: "x", totalBudget: "", durationDays: "1.5" }).values,
    ).toBeNull();
  });
  it("gives a linked agent without a session its session, with no terminal request", () => {
    loadQPassState(NOW);
    const before = loadQPassState(NOW).approvals.length;
    const next = createSpendingSession("agent-newsletter-05", limits, NOW);
    const session = find(next, "agent-newsletter-05")?.session;
    expect(session?.status).toBe("active");
    expect(session?.totalBudget).toBe(50);
    expect(session?.spent).toBe(0);
    expect(session?.expiresAt).toBe(NOW + 7 * 86400000);
    // It needed no terminal request, but it is recorded as an approved entry so History lists it.
    expect(next.approvals).toHaveLength(before + 1);
    expect(next.approvals[0]).toMatchObject({
      agentId: "agent-newsletter-05",
      status: "approved",
      source: "trellis",
      totalBudget: 50,
    });
    expect(session?.id).toBe(`sess-${next.approvals[0]!.id}`);
    expect(pendingRequestFor(next, find(next, "agent-newsletter-05")!, NOW)).toBeUndefined();
  });
  it("keeps an optional task summary, trimmed, and refuses an over-long one", () => {
    loadQPassState(NOW);
    const next = createSpendingSession("agent-newsletter-05", limits, NOW, "  Buy a cable  ");
    expect(find(next, "agent-newsletter-05")?.session?.taskSummary).toBe("Buy a cable");
    expect(next.approvals[0]?.taskSummary).toBe("Buy a cable");
    window.sessionStorage.clear();
    loadQPassState(NOW);
    const count = loadQPassState(NOW).approvals.length;
    const long = createSpendingSession("agent-newsletter-05", limits, NOW, "x".repeat(141));
    expect(find(long, "agent-newsletter-05")?.session).toBeUndefined();
    expect(long.approvals).toHaveLength(count);
    window.sessionStorage.clear();
    loadQPassState(NOW);
    expect(
      find(createSpendingSession("agent-newsletter-05", limits, NOW), "agent-newsletter-05")
        ?.session,
    ).not.toHaveProperty("taskSummary");
  });
  it("does not replace a session that is still active, or touch a revoked agent", () => {
    const state = loadQPassState(NOW);
    const active = find(state, "agent-checkout-01")?.session;
    expect(
      find(createSpendingSession("agent-checkout-01", limits, NOW), "agent-checkout-01")?.session,
    ).toEqual(active);
    const scraper = find(
      createSpendingSession("agent-scraper-04", limits, NOW),
      "agent-scraper-04",
    );
    expect(scraper?.session?.totalBudget).toBe(20);
  });
  it("allows a new session once the old one expired", () => {
    const state = loadQPassState(NOW);
    const expiry = find(state, "agent-checkout-01")!.session!.expiresAt;
    const next = createSpendingSession("agent-checkout-01", limits, expiry);
    expect(find(next, "agent-checkout-01")?.session?.totalBudget).toBe(50);
  });
  it("refuses invalid limits and an inactive SignetPass", () => {
    loadQPassState(NOW);
    const bad = createSpendingSession(
      "agent-newsletter-05",
      { ...limits, perPaymentLimit: 99 },
      NOW,
    );
    expect(find(bad, "agent-newsletter-05")?.session).toBeUndefined();
    const pass = createQPass({ name: "Fresh" }, NOW);
    const agent = simulateAgentRegistration(pass.id, NOW).agents.at(-1)!;
    expect(find(createSpendingSession(agent.id, limits, NOW), agent.id)?.session).toBeUndefined();
    activateQPass(pass.id, NOW);
    expect(find(createSpendingSession(agent.id, limits, NOW), agent.id)?.session?.status).toBe(
      "active",
    );
  });
  it("leaves it to the owner to approve a request the agent already made", () => {
    loadQPassState(NOW);
    simulateSessionRequest("agent-newsletter-05", NOW);
    const next = createSpendingSession("agent-newsletter-05", limits, NOW);
    expect(find(next, "agent-newsletter-05")?.session).toBeUndefined();
  });
});

describe("Reset sample data", () => {
  it("drops every change and restores the sample SignetPasses, agents and requests", () => {
    const seeded = loadQPassState(NOW);
    createQPass({ name: "Extra" }, NOW);
    createSpendingSession(
      "agent-newsletter-05",
      { perPaymentLimit: 5, totalBudget: 50, durationDays: 7 },
      NOW,
    );
    simulateAgentRegistration("qp-shopping", NOW);
    startRevokeAgent("agent-checkout-01", "confirmed", NOW);
    const reset = resetQPassState(NOW);
    expect(reset.passes.map((p) => p.id)).toEqual(seeded.passes.map((p) => p.id));
    expect(reset.agents).toHaveLength(seeded.agents.length);
    expect(reset.approvals).toHaveLength(seeded.approvals.length);
    expect(reset.agents.find((a) => a.id === "agent-newsletter-05")?.session).toBeUndefined();
    expect(reset.agents.find((a) => a.id === "agent-checkout-01")?.status).toBe("linked");
    // Persisted too, so a reload keeps the restored data.
    expect(loadQPassState(NOW).passes).toHaveLength(seeded.passes.length);
  });
});

describe("Summary in Edit spending limits", () => {
  const lowered = { perPaymentLimit: 10, totalBudget: 100, durationDays: 7 };
  const req = (s: ReturnType<typeof loadQPassState>) => s.approvals.find((r) => r.id === "req-01")!;
  it("lets the owner edit the summary alone, which the terminal must then re-sign", () => {
    loadQPassState(NOW);
    const next = updateApprovalLimits("req-01", lowered, NOW, "  Compare prices for a trip  ");
    expect(req(next).taskSummary).toBe("Compare prices for a trip");
    expect(req(next).signAt).toBe(NOW + CLI_SIGN_MS);
    expect(req(next).totalBudget).toBe(100);
  });
  it("does nothing when neither the limits nor the summary changed", () => {
    const state = loadQPassState(NOW);
    const same = req(state).taskSummary;
    const next = updateApprovalLimits("req-01", lowered, NOW, same);
    expect(req(next).signAt).toBeUndefined();
    expect(req(next).terminal).toBeUndefined();
  });
  it("lets the owner clear the summary, and refuses an over-long one", () => {
    loadQPassState(NOW);
    expect(req(updateApprovalLimits("req-01", lowered, NOW, "   ")).taskSummary).toBeUndefined();
    window.sessionStorage.clear();
    loadQPassState(NOW);
    const long = updateApprovalLimits("req-01", lowered, NOW, "x".repeat(141));
    expect(req(long).taskSummary).toBeTruthy();
    expect(req(long).signAt).toBeUndefined();
  });
  it("keeps the summary when only limits are lowered, and carries it onto the session", () => {
    loadQPassState(NOW);
    const before = req(loadQPassState(NOW)).taskSummary;
    updateApprovalLimits("req-01", { ...lowered, totalBudget: 60 }, NOW);
    const next = resolveApproval("req-01", "approved", NOW + CLI_SIGN_MS);
    expect(req(next).taskSummary).toBe(before);
    expect(next.agents.find((a) => a.id === "agent-req-01")?.session?.taskSummary).toBe(before);
  });
});
