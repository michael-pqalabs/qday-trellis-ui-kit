import { beforeEach, describe, expect, it } from "vitest";
import {
  activateQPass,
  CLI_SIGN_MS,
  createQPass,
  endCliSession,
  isAwaitingCli,
  loadQPassState,
  renameQPass,
  resolveApproval,
  REVOKE_CONFIRM_MS,
  startRevokeAgent,
  updateApprovalLimits,
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
    window.sessionStorage.setItem("trellis-qpass-v17", JSON.stringify(state));
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
