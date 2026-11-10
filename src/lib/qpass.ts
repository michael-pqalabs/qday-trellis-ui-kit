// Client-only preview. SignetPass accounts, agents and terminal requests are distinct.
export interface QPass {
  id: string;
  name: string;
  address: string;
  balance: number;
  status: "inactive" | "active";
  createdAt: number;
  /** Blockchain the SignetPass lives on; it decides the stablecoin its balance and limits use. */
  chainId: string;
}
export interface SpendingSession {
  id: string;
  perPaymentLimit: number;
  totalBudget: number;
  spent: number;
  startedAt: number;
  expiresAt: number;
  status: "active" | "revoked";
  /** What the agent said the session was for, copied from the approved request. */
  taskSummary?: string;
}
/** How a previewed revocation ends: confirmed on-chain, or not confirmed. */
export type RevokeOutcome = "confirmed" | "failed";
/** How long the illustrative on-chain confirmation takes. */
export const REVOKE_CONFIRM_MS = 4000;
export interface RegisteredAgent {
  id: string;
  passId: string;
  name: string;
  client: string;
  /** Who the agent says it is (vendor and model). Self-declared and display-only, as in the CLI. */
  vendor?: string;
  /** `revoking` = revocation submitted, awaiting on-chain confirmation; access is still live. */
  status: "linked" | "revoking" | "revoked";
  linkedAt?: number;
  /** Set while `revoking`: when it settles and how (illustrative, nothing is sent). */
  revocation?: { submittedAt: number; settleAt: number; outcome: RevokeOutcome };
  /** Set when the last revocation was not confirmed; the agent stays linked and can still spend. */
  revokeFailedAt?: number;
  /** When the agent was unregistered. Revoked agents are listed under History. */
  revokedAt?: number;
  /** An agent has at most one spending session. It can be registered before it has one. */
  session?: SpendingSession;
}
export interface ApprovalRequest {
  id: string;
  passId: string;
  /** The registered agent asking, when known. Older sample requests match by name and client. */
  agentId?: string;
  agentName: string;
  client: string;
  /** What the agent says the session is for (`--task-summary`); the owner reads it before approving. */
  taskSummary?: string;
  /** Address of the session key the agent generated and keeps; only the address is ever sent. */
  sessionKey?: string;
  /**
   * `trellis` = the owner created this session in the app, so it is recorded here already approved
   * (the history lists both ways in one place). Absent = the agent asked from its terminal.
   */
  source?: "trellis";
  perPaymentLimit: number;
  totalBudget: number;
  durationDays: number;
  expiresAt: number;
  status: "pending" | "approved" | "rejected" | "expired";
  /** Limits as first requested in the terminal. Set once the user lowers any of them. */
  terminal?: ApprovalLimits;
  /** After the user saves edited limits the terminal must sign the updated request; approving waits until then. */
  signAt?: number;
}
export interface ApprovalLimits {
  perPaymentLimit: number;
  totalBudget: number;
  durationDays: number;
}
export type LimitField = keyof ApprovalLimits;
/** How long the illustrative terminal re-signature takes after limits are saved. */
export const CLI_SIGN_MS = 3000;
export interface CliSession {
  id: string;
  label: string;
  host: string;
  client: string;
  startedAt: number;
  status: "active" | "ended";
}
export type ActivityKind = "fund" | "approve" | "activate" | "create" | "rename" | "revoke";
export interface AgenticActivity {
  id: string;
  passId: string;
  label: string;
  kind: ActivityKind;
  at: number;
}
export interface QPassState {
  passes: QPass[];
  agents: RegisteredAgent[];
  approvals: ApprovalRequest[];
  cliSessions: CliSession[];
  activity: AgenticActivity[];
}
/** Stored labels name the stablecoin with this placeholder, filled in at display for the active blockchain. */
export const STABLE_PLACEHOLDER = "{stable}";
export const fillStable = (text: string, stable: string) =>
  text.replaceAll(STABLE_PLACEHOLDER, stable);

const KEY = "trellis-qpass-v19";
const SAMPLE_AGENTS = [
  "Price watcher",
  "Invoice payer",
  "Subscription manager",
  "NFT sniper",
  "Ad budget bot",
  "Cloud billing agent",
  "Coffee runner",
  "Ticket hunter",
  "Portfolio rebalancer",
  "API credits topper",
  "Food delivery bot",
  "Translation agent",
  "Gift card buyer",
  "Domain renewer",
  "Expense tracker",
];
const SAMPLE_HOSTS = [
  "macbook-pro.local",
  "ubuntu-dev",
  "vps-sg-1",
  "thinkpad-x1",
  "raspberry-pi",
  "aws-ec2-tokyo",
  "imac-studio",
];
const SAMPLE_STATUSES: ApprovalRequest["status"][] = [
  "pending",
  "pending",
  "approved",
  "rejected",
  "pending",
  "expired",
];
/** A stable illustrative session-key address for sample data; not a real key. */
const sampleKey = (n: number) =>
  `0x${(n * 7919 + 4099).toString(16).padStart(4, "0").repeat(10).slice(0, 40)}`;
/** Sample terminal requests for layout testing; not real agent traffic. */
function extraSampleRequests(now: number): ApprovalRequest[] {
  return SAMPLE_AGENTS.map((agentName, i) => {
    const status = SAMPLE_STATUSES[i % SAMPLE_STATUSES.length]!;
    const expiresAt = status === "pending" ? now + (3 + i * 7) * 60000 : now - (i + 1) * 3600000;
    return {
      id: `req-s${i + 1}`,
      passId: i % 4 === 3 ? "qp-research" : "qp-shopping",
      agentName,
      taskSummary: `${agentName}: sample task for layout review`,
      sessionKey: sampleKey(i + 10),
      client: `signet-cli · ${SAMPLE_HOSTS[i % SAMPLE_HOSTS.length]!}`,
      perPaymentLimit: [1, 3, 5, 8, 12, 20, 25, 50][i % 8]!,
      totalBudget: [10, 25, 40, 75, 120, 200, 300, 500][i % 8]!,
      durationDays: [1, 3, 7, 14, 30][i % 5]!,
      expiresAt,
      status,
    };
  });
}
export function randomAddress(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}
export function seedQPassState(now: number): QPassState {
  return {
    passes: [
      {
        id: "qp-shopping",
        name: "Shopping SignetPass",
        address: "0x8f3a2c1d9b4e7a6c5f0b3d2e8a1c4b7d9e6f3a5b",
        balance: 50,
        status: "active",
        createdAt: now - 86400000,
        chainId: "base",
      },
      {
        id: "qp-research",
        name: "Research SignetPass",
        address: "0x2b7d4e9f1a3c5b8d6f0a2c4e7b9d1f3a5c8e0b2d",
        balance: 0,
        status: "inactive",
        createdAt: now,
        chainId: "qday",
      },
    ],
    agents: [
      {
        id: "agent-checkout-01",
        passId: "qp-shopping",
        name: "Checkout assistant",
        vendor: "Claude Code · claude-sonnet-5-5",
        client: "signet-cli",
        status: "linked",
        linkedAt: now - 5 * 3600000,
        session: {
          id: "sess-0x7a91c2",
          perPaymentLimit: 15,
          totalBudget: 150,
          spent: 45,
          startedAt: now - 5 * 3600000,
          expiresAt: now + 6 * 86400000 + 19 * 3600000,
          status: "active",
        },
      },
      {
        id: "agent-travel-02",
        passId: "qp-shopping",
        name: "Travel booker",
        vendor: "Codex · gpt-5.1",
        client: "signet-cli · ubuntu-dev",
        status: "linked",
        linkedAt: now - 3 * 86400000,
        session: {
          id: "sess-0x3fd04b",
          perPaymentLimit: 40,
          totalBudget: 250,
          spent: 212,
          startedAt: now - 3 * 86400000,
          expiresAt: now + 11 * 86400000,
          status: "active",
        },
      },
      {
        id: "agent-grocery-03",
        passId: "qp-shopping",
        name: "Grocery bot",
        vendor: "Claude Code · claude-sonnet-5-5",
        client: "signet-cli · macbook-pro.local",
        status: "linked",
        linkedAt: now - 6 * 86400000,
        session: {
          id: "sess-0x91be7e",
          perPaymentLimit: 5,
          totalBudget: 60,
          spent: 60,
          startedAt: now - 6 * 86400000,
          expiresAt: now + 5 * 3600000,
          status: "active",
        },
      },
      {
        // Registered in this SignetPass but has no spending session yet.
        id: "agent-newsletter-05",
        passId: "qp-shopping",
        name: "Newsletter writer",
        vendor: "Claude Code · claude-opus-5-5",
        client: "signet-cli · imac-studio",
        status: "linked",
        linkedAt: now - 3 * 3600000,
      },
      {
        id: "agent-scraper-04",
        passId: "qp-shopping",
        name: "Data scraper",
        vendor: "Codex · gpt-5.1",
        client: "signet-cli · vps-sg-1",
        status: "revoked",
        linkedAt: now - 9 * 86400000,
        revokedAt: now - 2 * 86400000,
        session: {
          id: "sess-0x0c55a8",
          perPaymentLimit: 2,
          totalBudget: 20,
          spent: 6,
          startedAt: now - 9 * 86400000,
          expiresAt: now - 2 * 86400000,
          status: "revoked",
        },
      },
    ],
    approvals: [
      {
        id: "req-01",
        passId: "qp-shopping",
        sessionKey: sampleKey(1),
        taskSummary: "Research flight and hotel prices for a December trip",
        agentName: "Research assistant",
        client: "signet-cli · macbook-pro.local",
        perPaymentLimit: 10,
        totalBudget: 100,
        durationDays: 7,
        expiresAt: now + 15 * 60000,
        status: "pending",
      },
      {
        id: "req-02",
        passId: "qp-shopping",
        sessionKey: sampleKey(2),
        taskSummary: "Book flights and a hotel for the Tokyo trip",
        agentName: "Travel booker",
        client: "signet-cli · ubuntu-dev",
        perPaymentLimit: 40,
        totalBudget: 250,
        durationDays: 14,
        expiresAt: now + 42 * 60000,
        status: "pending",
      },
      {
        id: "req-03",
        passId: "qp-shopping",
        sessionKey: sampleKey(3),
        taskSummary: "Order this week's groceries from the usual shop",
        agentName: "Grocery bot",
        client: "signet-cli · macbook-pro.local",
        perPaymentLimit: 5,
        totalBudget: 60,
        durationDays: 30,
        expiresAt: now + 8 * 60000,
        status: "pending",
      },
      {
        id: "req-04",
        passId: "qp-shopping",
        taskSummary: "Scrape public product pages for price comparison",
        agentName: "Data scraper",
        client: "signet-cli · vps-sg-1",
        perPaymentLimit: 2,
        totalBudget: 20,
        durationDays: 3,
        expiresAt: now - 3600000,
        status: "rejected",
      },
      {
        id: "req-05",
        passId: "qp-shopping",
        taskSummary: "Check out the cart in the QDay shop",
        agentName: "Checkout assistant",
        client: "signet-cli",
        perPaymentLimit: 15,
        totalBudget: 150,
        durationDays: 7,
        expiresAt: now - 5 * 3600000,
        status: "approved",
      },
      ...extraSampleRequests(now),
    ],
    cliSessions: [
      {
        id: "cli-1",
        label: "MacBook Pro",
        host: "macbook-pro.local",
        client: "signet-cli",
        startedAt: now - 10800000,
        status: "active",
      },
    ],
    activity: [
      {
        id: "act-1",
        passId: "qp-shopping",
        label: "Received 50.00 {stable} from Main wallet",
        kind: "fund",
        at: now - 10 * 60000,
      },
      {
        id: "act-2",
        passId: "qp-shopping",
        label: "Granted 100 {stable} budget to Research assistant",
        kind: "approve",
        at: now - 2 * 3600000,
      },
      {
        id: "act-3",
        passId: "qp-shopping",
        label: "Checkout assistant linked",
        kind: "approve",
        at: now - 5 * 3600000,
      },
      {
        id: "act-4",
        passId: "qp-shopping",
        label: "SignetPass activated",
        kind: "activate",
        at: now - 20 * 3600000,
      },
      {
        id: "act-5",
        passId: "qp-shopping",
        label: "SignetPass created",
        kind: "create",
        at: now - 86400000,
      },
    ],
  };
}
/** Settles revocations whose confirmation time has passed. Returns whether anything changed. */
function settleRevocations(state: QPassState, now: number): boolean {
  let changed = false;
  for (const agent of state.agents) {
    const pending = agent.revocation;
    if (agent.status !== "revoking" || !pending || pending.settleAt > now) continue;
    delete agent.revocation;
    changed = true;
    if (pending.outcome === "confirmed") {
      agent.status = "revoked";
      agent.revokedAt = pending.settleAt;
      if (agent.session) agent.session.status = "revoked";
      log(state, agent.passId, `${agent.name} · access revoked`, "revoke", pending.settleAt);
    } else {
      agent.status = "linked";
      agent.revokeFailedAt = pending.settleAt;
      log(
        state,
        agent.passId,
        `${agent.name} · revocation not confirmed`,
        "revoke",
        pending.settleAt,
      );
    }
  }
  return changed;
}
export function loadQPassState(now = Date.now()): QPassState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) {
      const state = JSON.parse(raw) as QPassState;
      if (
        [state.passes, state.agents, state.approvals, state.cliSessions, state.activity].every(
          Array.isArray,
        )
      ) {
        if (settleRevocations(state, now)) saveQPassState(state);
        return state;
      }
    }
  } catch {
    /* SSR or blocked storage */
  }
  const state = seedQPassState(now);
  saveQPassState(state);
  return state;
}
/** Preview helper: drops every change made in this session and goes back to the sample data. */
export function resetQPassState(now = Date.now()): QPassState {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* Preview storage unavailable */
  }
  const state = seedQPassState(now);
  saveQPassState(state);
  return state;
}
export function saveQPassState(state: QPassState) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Preview storage unavailable */
  }
}
export interface CreateQPassInput {
  name: string;
  /** Blockchain for the new SignetPass. Base unless another is chosen. */
  chainId?: string;
}
export function validateQPassInput(input: CreateQPassInput): string | null {
  return input.name.trim() ? null : "SignetPass name is required.";
}
function update(change: (state: QPassState) => void, now = Date.now()): QPassState {
  const state = loadQPassState(now);
  change(state);
  saveQPassState(state);
  return state;
}
function log(state: QPassState, passId: string, label: string, kind: ActivityKind, now: number) {
  state.activity.unshift({ id: crypto.randomUUID(), passId, label, kind, at: now });
}
export function createQPass(input: CreateQPassInput, now = Date.now()): QPass {
  const error = validateQPassInput(input);
  if (error) throw new Error(error);
  const id = crypto.randomUUID();
  const pass: QPass = {
    id,
    name: input.name.trim(),
    address: randomAddress(),
    balance: 0,
    status: "inactive",
    createdAt: now,
    chainId: input.chainId ?? "base",
  };
  update((state) => {
    state.passes.unshift(pass);
    log(state, id, "SignetPass created", "create", now);
  }, now);
  return pass;
}
export function renameQPass(id: string, name: string, now = Date.now()): QPassState {
  const error = validateQPassInput({ name });
  if (error) throw new Error(error);
  return update((state) => {
    const pass = state.passes.find((p) => p.id === id);
    if (pass) {
      pass.name = name.trim();
      log(state, id, "SignetPass renamed", "rename", now);
    }
  }, now);
}
export function activateQPass(id: string, now = Date.now()): QPassState {
  return update((state) => {
    const pass = state.passes.find((p) => p.id === id);
    if (pass?.status === "inactive") {
      pass.status = "active";
      log(state, id, "SignetPass activated", "activate", now);
    }
  }, now);
}
/** True while an edited request still waits for the terminal to sign it again. */
export function isAwaitingCli(request: ApprovalRequest, now: number): boolean {
  return request.signAt !== undefined && request.signAt > now;
}
const AMOUNT = /^\d{1,9}(?:\.\d{1,6})?$/;
const WHOLE = /^\d{1,5}$/;
/**
 * Mirrors the server-side rules the wallet follows before limits are saved: limits must be
 * positive, can only be lowered (never raised), the per-payment limit cannot exceed the total, and
 * the duration is a whole number of days. The real check runs on the server; this is a preview.
 */
export function validateApprovalLimits(
  request: ApprovalLimits,
  input: { perPaymentLimit: string; totalBudget: string; durationDays: string },
  stable = "USD8",
): { values: ApprovalLimits | null; errors: Partial<Record<LimitField, string>> } {
  const errors: Partial<Record<LimitField, string>> = {};
  const amount = (raw: string, max: number, field: "perPaymentLimit" | "totalBudget") => {
    const text = raw.trim();
    if (!AMOUNT.test(text) || Number(text) <= 0) {
      errors[field] = "Enter an amount above 0, with up to 6 decimals.";
      return max;
    }
    if (Number(text) > max) errors[field] = `Can't be higher than the current ${max} ${stable}.`;
    return Number(text);
  };
  const per = amount(input.perPaymentLimit, request.perPaymentLimit, "perPaymentLimit");
  const total = amount(input.totalBudget, request.totalBudget, "totalBudget");
  if (!errors.perPaymentLimit && !errors.totalBudget && per > total)
    errors.perPaymentLimit = "Per-payment limit can't exceed the total budget.";
  const daysText = input.durationDays.trim();
  const days = Number(daysText);
  if (!WHOLE.test(daysText) || days < 1)
    errors.durationDays = "Enter a whole number of days, 1 or more.";
  else if (days > request.durationDays)
    errors.durationDays = `Can't be longer than the current ${request.durationDays} days.`;
  if (Object.keys(errors).length) return { values: null, errors };
  return { values: { perPaymentLimit: per, totalBudget: total, durationDays: days }, errors };
}
/** Saves edited limits after the (previewed) server check passed; the terminal then re-signs. */
export function updateApprovalLimits(
  id: string,
  values: ApprovalLimits,
  now = Date.now(),
  taskSummary?: string,
): QPassState {
  return update((state) => {
    const request = state.approvals.find((r) => r.id === id);
    if (!request || request.status !== "pending" || request.expiresAt <= now) return;
    const summary = taskSummary?.trim();
    if (summary !== undefined && summary.length > MAX_TASK_SUMMARY) return;
    const summaryChanged = summary !== undefined && summary !== (request.taskSummary ?? "");
    const changed =
      values.perPaymentLimit !== request.perPaymentLimit ||
      values.totalBudget !== request.totalBudget ||
      values.durationDays !== request.durationDays ||
      summaryChanged;
    if (!changed) return;
    request.terminal ??= {
      perPaymentLimit: request.perPaymentLimit,
      totalBudget: request.totalBudget,
      durationDays: request.durationDays,
    };
    request.perPaymentLimit = values.perPaymentLimit;
    request.totalBudget = values.totalBudget;
    request.durationDays = values.durationDays;
    if (summaryChanged) {
      if (summary) request.taskSummary = summary;
      else delete request.taskSummary;
    }
    request.signAt = now + CLI_SIGN_MS;
  }, now);
}
/** Longest task summary kept, so one line cannot swamp the approval screen. */
export const MAX_TASK_SUMMARY = 140;
/** The wallet service refuses a session that lasts longer than this (`MAX_EXPIRES_IN_SECONDS` in the CLI). */
export const MAX_SESSION_DAYS = 30;
/** True when the agent has a session that is still active and not expired. */
export function hasUsableSession(agent: RegisteredAgent, now: number): boolean {
  const session = agent.session;
  return !!session && session.status === "active" && session.expiresAt > now;
}
/**
 * A linked agent can open a new session only when it has none that is still usable: an agent has at
 * most one active session, and ending or revoking one frees it to open another.
 */
export function canRequestSession(agent: RegisteredAgent, now: number): boolean {
  return agent.status === "linked" && !hasUsableSession(agent, now);
}
const AMOUNT_RE = /^\d{1,9}(?:\.\d{1,6})?$/;
const WHOLE_RE = /^\d{1,5}$/;
/**
 * Checks the limits typed into "Create spending session". Unlike a terminal request there is nothing
 * to lower from: amounts must be positive with up to 6 decimals, the per-payment limit cannot exceed
 * the total budget, and the duration is a whole number of days, at most `MAX_SESSION_DAYS` (the
 * wallet service's ceiling). The real check runs on the server; this is a preview.
 */
export function validateNewSession(input: {
  perPaymentLimit: string;
  totalBudget: string;
  durationDays: string;
}): { values: ApprovalLimits | null; errors: Partial<Record<LimitField, string>> } {
  const errors: Partial<Record<LimitField, string>> = {};
  const amount = (raw: string, field: "perPaymentLimit" | "totalBudget") => {
    const text = raw.trim();
    if (!AMOUNT_RE.test(text) || Number(text) <= 0) {
      errors[field] = "Enter an amount above 0, with up to 6 decimals.";
      return 0;
    }
    return Number(text);
  };
  const per = amount(input.perPaymentLimit, "perPaymentLimit");
  const total = amount(input.totalBudget, "totalBudget");
  if (!errors.perPaymentLimit && !errors.totalBudget && per > total)
    errors.perPaymentLimit = "Per-payment limit can't exceed the total budget.";
  const daysText = input.durationDays.trim();
  const days = Number(daysText);
  if (!WHOLE_RE.test(daysText) || days < 1 || days > MAX_SESSION_DAYS)
    errors.durationDays = `Enter a whole number of days, from 1 to ${MAX_SESSION_DAYS}.`;
  if (Object.keys(errors).length) return { values: null, errors };
  return { values: { perPaymentLimit: per, totalBudget: total, durationDays: days }, errors };
}
/** A request from the terminal for this agent that the user can still approve. */
export function pendingRequestFor(
  state: QPassState,
  agent: RegisteredAgent,
  now: number,
): ApprovalRequest | undefined {
  return state.approvals.find(
    (r) =>
      r.status === "pending" &&
      r.expiresAt > now &&
      r.passId === agent.passId &&
      (r.agentId
        ? r.agentId === agent.id
        : r.agentName === agent.name && r.client === agent.client),
  );
}
/**
 * Creates a spending session for a registered agent from Trellis, as an alternative to approving one
 * the agent asked for. The SignetPass must be active, the agent linked without a usable session
 * (an agent has one at a time) and with no request of its own waiting: approve that one instead.
 * Nothing is sent or charged.
 */
export function createSpendingSession(
  agentId: string,
  limits: ApprovalLimits,
  now = Date.now(),
  taskSummary?: string,
): QPassState {
  return update((state) => {
    const agent = state.agents.find((a) => a.id === agentId);
    if ((taskSummary?.trim().length ?? 0) > MAX_TASK_SUMMARY) return;
    if (!agent || !canRequestSession(agent, now) || pendingRequestFor(state, agent, now)) return;
    if (state.passes.find((p) => p.id === agent.passId)?.status !== "active") return;
    const valid = validateNewSession({
      perPaymentLimit: String(limits.perPaymentLimit),
      totalBudget: String(limits.totalBudget),
      durationDays: String(limits.durationDays),
    });
    if (!valid.values) return;
    const requestId = `req-${crypto.randomUUID().slice(0, 8)}`;
    const summary = taskSummary?.trim();
    // Recorded as an already approved entry, so Spending Sessions History lists it with the rest.
    state.approvals.unshift({
      id: requestId,
      passId: agent.passId,
      agentId: agent.id,
      agentName: agent.name,
      client: agent.client,
      perPaymentLimit: limits.perPaymentLimit,
      totalBudget: limits.totalBudget,
      durationDays: limits.durationDays,
      expiresAt: now,
      status: "approved",
      source: "trellis",
      ...(summary ? { taskSummary: summary } : {}),
    });
    agent.session = {
      id: `sess-${requestId}`,
      perPaymentLimit: limits.perPaymentLimit,
      totalBudget: limits.totalBudget,
      spent: 0,
      startedAt: now,
      expiresAt: now + limits.durationDays * 86400000,
      status: "active",
      ...(taskSummary?.trim() ? { taskSummary: taskSummary.trim() } : {}),
    };
    log(
      state,
      agent.passId,
      `Created ${limits.totalBudget} ${STABLE_PLACEHOLDER} spending session for ${agent.name}`,
      "approve",
      now,
    );
  }, now);
}
/** Sample agents the terminal can register in the preview (`signet register agent`). */
const SIMULATED_AGENTS = [
  { name: "Meal planner", vendor: "Claude Code · claude-sonnet-5-5", host: "macbook-pro.local" },
  { name: "Receipt scanner", vendor: "Codex · gpt-5.1", host: "thinkpad-x1" },
  { name: "Support bot", vendor: "Claude Code · claude-opus-5-5", host: "ubuntu-dev" },
  { name: "Price tracker", vendor: "Codex · gpt-5.1", host: "raspberry-pi" },
];
const SIMULATED_TASKS = [
  "Buy a USB-C cable from a QDay shop",
  "Pay for API calls while researching flights",
  "Order groceries from the usual shop",
  "Renew the project's domain name",
];
/**
 * Preview stand-in for `signet register agent --signetpass <id>` run in a terminal. In the real
 * flow the link is a plain record with nothing to approve: the agent simply shows up as Linked,
 * with no spending session yet. Nothing is sent.
 */
export function simulateAgentRegistration(passId: string, now = Date.now()): QPassState {
  return update((state) => {
    if (!state.passes.some((p) => p.id === passId)) return;
    const taken = state.agents.filter((a) => a.passId === passId).length;
    const sample = SIMULATED_AGENTS[taken % SIMULATED_AGENTS.length]!;
    const id = `agent-${crypto.randomUUID().slice(0, 8)}`;
    state.agents.push({
      id,
      passId,
      name: sample.name,
      client: `signet-cli · ${sample.host}`,
      vendor: sample.vendor,
      status: "linked",
      linkedAt: now,
    });
    log(state, passId, `${sample.name} linked`, "approve", now);
  }, now);
}
/**
 * Preview stand-in for `signet session --signetpass <id> --per-tx --total --expires-in --task-summary`.
 * The agent (never Trellis) asks for a session, and the owner approves it, and may lower its caps,
 * from the Spending Sessions tab. Only a linked agent without a usable session, and with no request
 * waiting, can ask. Nothing is sent.
 */
export function simulateSessionRequest(agentId: string, now = Date.now()): QPassState {
  return update((state) => {
    const agent = state.agents.find((a) => a.id === agentId);
    if (!agent || !canRequestSession(agent, now) || pendingRequestFor(state, agent, now)) return;
    const n = state.approvals.length;
    state.approvals.unshift({
      id: `req-${crypto.randomUUID().slice(0, 8)}`,
      passId: agent.passId,
      agentId: agent.id,
      agentName: agent.name,
      client: agent.client,
      perPaymentLimit: 5,
      totalBudget: 50,
      durationDays: 7,
      taskSummary: SIMULATED_TASKS[n % SIMULATED_TASKS.length]!,
      sessionKey: randomAddress(),
      expiresAt: now + 15 * 60000,
      status: "pending",
    });
  }, now);
}
export function resolveApproval(
  id: string,
  decision: "approved" | "rejected",
  now = Date.now(),
): QPassState {
  return update((state) => {
    const request = state.approvals.find((r) => r.id === id);
    if (!request || request.status !== "pending") return;
    if (request.expiresAt <= now) {
      request.status = "expired";
      return;
    }
    const pass = state.passes.find((p) => p.id === request.passId);
    if (decision === "approved" && pass?.status !== "active") return;
    if (decision === "approved" && isAwaitingCli(request, now)) return;
    request.status = decision;
    if (decision === "approved") {
      const session: SpendingSession = {
        id: `sess-${request.id}`,
        perPaymentLimit: request.perPaymentLimit,
        totalBudget: request.totalBudget,
        spent: 0,
        startedAt: now,
        expiresAt: now + request.durationDays * 86400000,
        status: "active",
        ...(request.taskSummary ? { taskSummary: request.taskSummary } : {}),
      };
      // An agent has only one spending session: approving a new one replaces its current session.
      const existing = state.agents.find(
        (a) =>
          a.status !== "revoked" &&
          a.passId === request.passId &&
          (request.agentId
            ? a.id === request.agentId
            : a.name === request.agentName && a.client === request.client),
      );
      if (existing) existing.session = session;
      else
        // Older sample requests name an agent that was never registered: approving still links it.
        state.agents.push({
          id: `agent-${request.id}`,
          passId: request.passId,
          name: request.agentName,
          client: request.client,
          status: "linked",
          linkedAt: now,
          session,
        });
    }
    log(
      state,
      request.passId,
      decision === "approved"
        ? `Granted ${request.totalBudget} ${STABLE_PLACEHOLDER} budget to ${request.agentName}`
        : `Rejected request from ${request.agentName}`,
      "approve",
      now,
    );
  }, now);
}
/**
 * Submits an agent revocation. Revoking is an on-chain transaction, so the agent only becomes
 * `revoked` once it is confirmed (see `settleRevocations`); until then its access stays live. The
 * outcome is illustrative: nothing is sent.
 */
export function startRevokeAgent(
  id: string,
  outcome: RevokeOutcome = "confirmed",
  now = Date.now(),
): QPassState {
  return update((state) => {
    const agent = state.agents.find((a) => a.id === id);
    if (agent?.status !== "linked") return;
    agent.status = "revoking";
    agent.revocation = { submittedAt: now, settleAt: now + REVOKE_CONFIRM_MS, outcome };
    delete agent.revokeFailedAt;
    log(state, agent.passId, `${agent.name} · revocation submitted`, "revoke", now);
  }, now);
}
export function endCliSession(id: string, now = Date.now()): QPassState {
  return update((state) => {
    const session = state.cliSessions.find((s) => s.id === id);
    if (session) session.status = "ended";
  }, now);
}

/** Revoke only the spending session; the agent link stays. */
export function revokeSession(agentId: string, now = Date.now()): QPassState {
  return update((state) => {
    const agent = state.agents.find((a) => a.id === agentId);
    const session = agent?.session;
    if (!agent || !session || session.status === "revoked") return;
    session.status = "revoked";
    log(state, agent.passId, `${agent.name} · spending session revoked`, "revoke", now);
  }, now);
}
