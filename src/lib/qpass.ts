// Client-only preview. QPass accounts, agents and terminal requests are distinct.
export interface QPass { id: string; name: string; address: string; balance: number; status: 'inactive' | 'active'; createdAt: number }
export interface SpendingSession { id: string; perPaymentLimit: number; totalBudget: number; spent: number; startedAt: number; expiresAt: number; status: 'active' | 'paused' | 'revoked' }
export interface RegisteredAgent { id: string; passId: string; name: string; client: string; status: 'linked' | 'revoked'; linkedAt?: number; session?: SpendingSession }
export interface ApprovalRequest { id: string; passId: string; agentName: string; client: string; perPaymentLimit: number; totalBudget: number; durationDays: number; expiresAt: number; status: 'pending' | 'approved' | 'rejected' | 'expired' }
export interface CliSession { id: string; label: string; host: string; client: string; startedAt: number; status: 'active' | 'ended' }
export type ActivityKind = 'fund' | 'approve' | 'activate' | 'create' | 'rename' | 'revoke';
export interface AgenticActivity { id: string; passId: string; label: string; kind: ActivityKind; at: number }
export interface QPassState { passes: QPass[]; agents: RegisteredAgent[]; approvals: ApprovalRequest[]; cliSessions: CliSession[]; activity: AgenticActivity[] }
const KEY = 'trellis-qpass-v6';
const SAMPLE_AGENTS = ['Price watcher', 'Invoice payer', 'Subscription manager', 'NFT sniper', 'Ad budget bot', 'Cloud billing agent', 'Coffee runner', 'Ticket hunter', 'Portfolio rebalancer', 'API credits topper', 'Food delivery bot', 'Translation agent', 'Gift card buyer', 'Domain renewer', 'Expense tracker'];
const SAMPLE_HOSTS = ['macbook-pro.local', 'ubuntu-dev', 'vps-sg-1', 'thinkpad-x1', 'raspberry-pi', 'aws-ec2-tokyo', 'imac-studio'];
const SAMPLE_STATUSES: ApprovalRequest['status'][] = ['pending', 'pending', 'approved', 'rejected', 'pending', 'expired'];
/** Sample terminal requests for layout testing; not real agent traffic. */
function extraSampleRequests(now: number): ApprovalRequest[] {
  return SAMPLE_AGENTS.map((agentName, i) => {
    const status = SAMPLE_STATUSES[i % SAMPLE_STATUSES.length]!;
    const expiresAt = status === 'pending' ? now + (3 + i * 7) * 60000 : now - (i + 1) * 3600000;
    return { id: `req-s${i + 1}`, passId: i % 4 === 3 ? 'qp-research' : 'qp-shopping', agentName, client: `qday-cli · ${SAMPLE_HOSTS[i % SAMPLE_HOSTS.length]!}`, perPaymentLimit: [1, 3, 5, 8, 12, 20, 25, 50][i % 8]!, totalBudget: [10, 25, 40, 75, 120, 200, 300, 500][i % 8]!, durationDays: [1, 3, 7, 14, 30][i % 5]!, expiresAt, status };
  });
}
export function randomAddress(): string {
  const bytes = new Uint8Array(20); crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
}
export function seedQPassState(now: number): QPassState {
  return {
    passes: [
      { id: 'qp-shopping', name: 'Shopping QPass', address: '0x8f3a2c1d9b4e7a6c5f0b3d2e8a1c4b7d9e6f3a5b', balance: 50, status: 'active', createdAt: now - 86400000 },
      { id: 'qp-research', name: 'Research QPass', address: '0x2b7d4e9f1a3c5b8d6f0a2c4e7b9d1f3a5c8e0b2d', balance: 0, status: 'inactive', createdAt: now },
    ],
    agents: [
      { id: 'agent-checkout-01', passId: 'qp-shopping', name: 'Checkout assistant', client: 'qday-cli', status: 'linked', linkedAt: now - 5 * 3600000, session: { id: 'sess-0x7a91c2', perPaymentLimit: 15, totalBudget: 150, spent: 45, startedAt: now - 5 * 3600000, expiresAt: now + 6 * 86400000 + 19 * 3600000, status: 'active' } },
      { id: 'agent-travel-02', passId: 'qp-shopping', name: 'Travel booker', client: 'qday-cli · ubuntu-dev', status: 'linked', linkedAt: now - 3 * 86400000, session: { id: 'sess-0x3fd04b', perPaymentLimit: 40, totalBudget: 250, spent: 212, startedAt: now - 3 * 86400000, expiresAt: now + 11 * 86400000, status: 'paused' } },
      { id: 'agent-grocery-03', passId: 'qp-shopping', name: 'Grocery bot', client: 'qday-cli · macbook-pro.local', status: 'linked', linkedAt: now - 6 * 86400000, session: { id: 'sess-0x91be7e', perPaymentLimit: 5, totalBudget: 60, spent: 60, startedAt: now - 6 * 86400000, expiresAt: now + 5 * 3600000, status: 'active' } },
      { id: 'agent-scraper-04', passId: 'qp-shopping', name: 'Data scraper', client: 'qday-cli · vps-sg-1', status: 'revoked', linkedAt: now - 9 * 86400000, session: { id: 'sess-0x0c55a8', perPaymentLimit: 2, totalBudget: 20, spent: 6, startedAt: now - 9 * 86400000, expiresAt: now - 2 * 86400000, status: 'revoked' } },
    ],
    approvals: [{ id: 'req-01', passId: 'qp-shopping', agentName: 'Research assistant', client: 'qday-cli · macbook-pro.local', perPaymentLimit: 10, totalBudget: 100, durationDays: 7, expiresAt: now + 15 * 60000, status: 'pending' },
      { id: 'req-02', passId: 'qp-shopping', agentName: 'Travel booker', client: 'qday-cli · ubuntu-dev', perPaymentLimit: 40, totalBudget: 250, durationDays: 14, expiresAt: now + 42 * 60000, status: 'pending' },
      { id: 'req-03', passId: 'qp-shopping', agentName: 'Grocery bot', client: 'qday-cli · macbook-pro.local', perPaymentLimit: 5, totalBudget: 60, durationDays: 30, expiresAt: now + 8 * 60000, status: 'pending' },
      { id: 'req-04', passId: 'qp-shopping', agentName: 'Data scraper', client: 'qday-cli · vps-sg-1', perPaymentLimit: 2, totalBudget: 20, durationDays: 3, expiresAt: now - 3600000, status: 'rejected' },
      { id: 'req-05', passId: 'qp-shopping', agentName: 'Checkout assistant', client: 'qday-cli', perPaymentLimit: 15, totalBudget: 150, durationDays: 7, expiresAt: now - 5 * 3600000, status: 'approved' },
      ...extraSampleRequests(now),
    ],
    cliSessions: [{ id: 'cli-1', label: 'MacBook Pro', host: 'macbook-pro.local', client: 'qday-cli', startedAt: now - 10800000, status: 'active' }],
    activity: [
      { id: 'act-1', passId: 'qp-shopping', label: 'Received 50.00 USD8 from Main wallet', kind: 'fund', at: now - 10 * 60000 },
      { id: 'act-2', passId: 'qp-shopping', label: 'Granted 100 USD8 budget to Research assistant', kind: 'approve', at: now - 2 * 3600000 },
      { id: 'act-3', passId: 'qp-shopping', label: 'Checkout assistant linked', kind: 'approve', at: now - 5 * 3600000 },
      { id: 'act-4', passId: 'qp-shopping', label: 'QPass activated', kind: 'activate', at: now - 20 * 3600000 },
      { id: 'act-5', passId: 'qp-shopping', label: 'QPass created', kind: 'create', at: now - 86400000 },
    ],
  };
}
export function loadQPassState(now = Date.now()): QPassState {
  try { const raw = window.sessionStorage.getItem(KEY); if (raw) { const state = JSON.parse(raw) as QPassState; if ([state.passes, state.agents, state.approvals, state.cliSessions, state.activity].every(Array.isArray)) return state; } } catch { /* SSR or blocked storage */ }
  const state = seedQPassState(now); saveQPassState(state); return state;
}
export function saveQPassState(state: QPassState) { try { window.sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Preview storage unavailable */ } }
export interface CreateQPassInput { name: string }
export function validateQPassInput(input: CreateQPassInput): string | null { return input.name.trim() ? null : 'QPass name is required.'; }
function update(change: (state: QPassState) => void, now = Date.now()): QPassState { const state = loadQPassState(now); change(state); saveQPassState(state); return state; }
function log(state: QPassState, passId: string, label: string, kind: ActivityKind, now: number) { state.activity.unshift({ id: crypto.randomUUID(), passId, label, kind, at: now }); }
export function createQPass(input: CreateQPassInput, now = Date.now()): QPass {
  const error = validateQPassInput(input); if (error) throw new Error(error);
  const id = crypto.randomUUID(); const pass: QPass = { id, name: input.name.trim(), address: randomAddress(), balance: 0, status: 'inactive', createdAt: now };
  update(state => { state.passes.unshift(pass); log(state, id, 'QPass created', 'create', now); }, now); return pass;
}
export function renameQPass(id: string, name: string, now = Date.now()): QPassState {
  const error = validateQPassInput({ name }); if (error) throw new Error(error);
  return update(state => { const pass = state.passes.find(p => p.id === id); if (pass) { pass.name = name.trim(); log(state, id, 'QPass renamed', 'rename', now); } }, now);
}
export function activateQPass(id: string, now = Date.now()): QPassState { return update(state => { const pass = state.passes.find(p => p.id === id); if (pass?.status === 'inactive') { pass.status = 'active'; log(state, id, 'QPass activated', 'activate', now); } }, now); }
export function resolveApproval(id: string, decision: 'approved' | 'rejected', now = Date.now()): QPassState {
  return update(state => {
    const request = state.approvals.find(r => r.id === id); if (!request || request.status !== 'pending') return;
    if (request.expiresAt <= now) { request.status = 'expired'; return; }
    const pass = state.passes.find(p => p.id === request.passId); if (decision === 'approved' && pass?.status !== 'active') return;
    request.status = decision;
    if (decision === 'approved') state.agents.push({ id: `agent-${request.id}`, passId: request.passId, name: request.agentName, client: request.client, status: 'linked', linkedAt: now, session: { id: `sess-${request.id}`, perPaymentLimit: request.perPaymentLimit, totalBudget: request.totalBudget, spent: 0, startedAt: now, expiresAt: now + request.durationDays * 86400000, status: 'active' } });
    log(state, request.passId, decision === 'approved' ? `Granted ${request.totalBudget} USD8 budget to ${request.agentName}` : `Rejected request from ${request.agentName}`, 'approve', now);
  }, now);
}
export function revokeAgent(id: string, now = Date.now()): QPassState { return update(state => { const agent = state.agents.find(a => a.id === id); if (agent?.status === 'linked') { agent.status = 'revoked'; if (agent.session) agent.session.status = 'revoked'; log(state, agent.passId, `${agent.name} · access revoked`, 'revoke', now); } }, now); }
export function endCliSession(id: string, now = Date.now()): QPassState { return update(state => { const session = state.cliSessions.find(s => s.id === id); if (session) session.status = 'ended'; }, now); }

/** Pause or resume an agent's spending session without unlinking the agent. */
export function setSessionPaused(agentId: string, paused: boolean, now = Date.now()): QPassState {
  return update(state => { const agent = state.agents.find(a => a.id === agentId); const session = agent?.session; if (!agent || !session || session.status === 'revoked' || agent.status !== 'linked') return; session.status = paused ? 'paused' : 'active'; log(state, agent.passId, `${agent.name} · session ${paused ? 'paused' : 'resumed'}`, 'revoke', now); }, now);
}
/** Revoke only the spending session; the agent link stays. */
export function revokeSession(agentId: string, now = Date.now()): QPassState {
  return update(state => { const agent = state.agents.find(a => a.id === agentId); const session = agent?.session; if (!agent || !session || session.status === 'revoked') return; session.status = 'revoked'; log(state, agent.passId, `${agent.name} · spending session revoked`, 'revoke', now); }, now);
}
