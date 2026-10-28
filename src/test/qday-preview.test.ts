import { describe, expect, it } from 'vitest';
import { canEnterQPass, completePreviewStep, emptyQDayPreview, isWalletTabBlocked, setupSteps, validPreviewOTP } from '@/lib/qday-preview';

describe('QDay setup preview rules', () => {
  it('blocks the other bottom tab on Agentic until login succeeds', () => {
    expect(isWalletTabBlocked('/agentic', null, true)).toBe(true);
    expect(isWalletTabBlocked('/agentic/new', null, true)).toBe(true);
    expect(isWalletTabBlocked('/agentic', 'preview@example.com', true)).toBe(false);
    expect(isWalletTabBlocked('/wallet', null, true)).toBe(false);
  });
  it('requires exactly 8 numeric OTP digits', () => {
    expect(validPreviewOTP('12345678')).toBe(true);
    expect(validPreviewOTP('123456')).toBe(false);
    expect(validPreviewOTP('123456789')).toBe(false);
    expect(validPreviewOTP('1234567a')).toBe(false);
    expect(validPreviewOTP('87654321')).toBe(false);
  });
  it('requires an existing wallet before setup can advance', () => {
    const state = { ...emptyQDayPreview, email: 'preview@example.com' };
    expect(completePreviewStep(state, 0).completed).toBe(0);
    expect(canEnterQPass({ ...state, completed: 5 })).toBe(false);
  });
  it('requires sign-in before entering QPass', () => {
    expect(canEnterQPass({ walletReady: true, email: null, completed: 5 })).toBe(false);
  });
  it('has 5 ordered steps with only Passkey and activation manual', () => {
    expect(setupSteps).toHaveLength(5);
    expect(setupSteps.map(s => s.manual)).toEqual([false, false, false, true, true]);
  });
  it('cannot skip steps or enter QPass before all 5 complete', () => {
    let state = { walletReady: true, email: 'preview@example.com', completed: 0 };
    expect(completePreviewStep(state, 3).completed).toBe(0);
    for (let i = 0; i < 5; i++) {
      expect(canEnterQPass(state)).toBe(false);
      state = completePreviewStep(state, i) as typeof state;
    }
    expect(state.completed).toBe(5);
    expect(canEnterQPass(state)).toBe(true);
    expect(completePreviewStep(state, 5).completed).toBe(5);
  });
});
import { revokePreviewPasskey as revokePK } from '@/lib/qday-preview';
import { test as t2, expect as e2 } from 'vitest';
t2('revoking the Passkey returns setup to the Passkey step', () => {
  e2(revokePK({ walletReady: true, email: 'a@b.c', completed: 4 }).completed).toBe(3);
  e2(revokePK({ walletReady: true, email: 'a@b.c', completed: 2 }).completed).toBe(2);
});
