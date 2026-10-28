import { beforeEach, describe, expect, it } from 'vitest';
import { activateQPass, createQPass, endCliSession, loadQPassState, renameQPass, resolveApproval, revokeAgent, validateQPassInput } from '@/lib/qpass';
const NOW = 1800000000000;
beforeEach(() => window.sessionStorage.clear());
describe('QPass accounts demo', () => {
  it('requires only a QPass name, without terminal limits', () => {
    expect(validateQPassInput({ name: ' ' })).toBe('QPass name is required.');
    const pass = createQPass({ name: '  Travel  ' }, NOW);
    expect(pass.name).toBe('Travel'); expect(pass.balance).toBe(0); expect(pass.status).toBe('inactive');
    expect(pass).not.toHaveProperty('perPaymentLimit'); expect(pass).not.toHaveProperty('totalBudget');
  });
  it('gives each QPass its own hex address and zero initial balance', () => {
    const a = createQPass({ name: 'A' }, NOW); const b = createQPass({ name: 'B' }, NOW);
    expect(a.address).not.toBe(b.address); expect(a.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(a.balance).toBe(0); expect(b.balance).toBe(0);
  });
  it('renames without changing the account', () => { const p = createQPass({ name: 'A' }, NOW); const next = renameQPass(p.id, 'B', NOW).passes.find(a => a.id === p.id); expect(next?.name).toBe('B'); expect(next?.address).toBe(p.address); });
  it('simulates activation without changing balances', () => { const p = createQPass({ name: 'A' }, NOW); const next = activateQPass(p.id, NOW).passes.find(a => a.id === p.id); expect(next?.status).toBe('active'); expect(next?.balance).toBe(0); });
  it('approves terminal limits unchanged and links only the selected agent', () => { loadQPassState(NOW); const next = resolveApproval('req-01', 'approved', NOW); expect(next.approvals[0]?.perPaymentLimit).toBe(10); expect(next.approvals[0]?.totalBudget).toBe(100); expect(next.approvals[0]?.status).toBe('approved'); expect(next.agents.find(a => a.id === 'agent-req-01')?.passId).toBe('qp-shopping'); });
  it('rejects without linking an agent', () => { loadQPassState(NOW); const next = resolveApproval('req-01', 'rejected', NOW); expect(next.approvals[0]?.status).toBe('rejected'); expect(next.agents).toHaveLength(4); });
  it('cannot approve an expired request', () => { loadQPassState(NOW); const next = resolveApproval('req-01', 'approved', NOW + 15 * 60000); expect(next.approvals[0]?.status).toBe('expired'); expect(next.agents).toHaveLength(4); });
  it('cannot approve twice', () => { loadQPassState(NOW); resolveApproval('req-01', 'approved', NOW); expect(resolveApproval('req-01', 'approved', NOW).agents).toHaveLength(5); });
  it('revokes an agent without revoking its QPass', () => { loadQPassState(NOW); const next = revokeAgent('agent-checkout-01', NOW); expect(next.agents[0]?.status).toBe('revoked'); expect(next.passes[0]?.status).toBe('active'); });
  it('logs out CLI independently from agents', () => { loadQPassState(NOW); const next = endCliSession('cli-1', NOW); expect(next.cliSessions[0]?.status).toBe('ended'); expect(next.agents[0]?.status).toBe('linked'); });
});

import { setSessionPaused, revokeSession } from '@/lib/qpass';
describe('agent spending sessions', () => {
  beforeEach(() => sessionStorage.clear());
  it('pauses and resumes without unlinking', () => { loadQPassState(NOW); let s = setSessionPaused('agent-checkout-01', true, NOW); expect(s.agents[0]?.session?.status).toBe('paused'); expect(s.agents[0]?.status).toBe('linked'); s = setSessionPaused('agent-checkout-01', false, NOW); expect(s.agents[0]?.session?.status).toBe('active'); });
  it('revoking session keeps agent linked', () => { loadQPassState(NOW); const s = revokeSession('agent-checkout-01', NOW); expect(s.agents[0]?.session?.status).toBe('revoked'); expect(s.agents[0]?.status).toBe('linked'); });
  it('revoking agent also revokes session', () => { loadQPassState(NOW); const s = revokeAgent('agent-checkout-01', NOW); expect(s.agents[0]?.session?.status).toBe('revoked'); });
});
