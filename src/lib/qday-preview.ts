// Presentation state only. Never an authentication credential or wallet connection.
export const QDAY_PREVIEW_KEY = 'trellis-qday-preview-v1';
export const PREVIEW_OTP = '12345678';
export const setupSteps = [
  { title: 'Email sign-in', detail: 'Confirm your QDay account', manual: false },
  { title: 'Unlock Main Wallet', detail: 'Prepare your existing Trellis wallet', manual: false },
  { title: 'Link wallet to email', detail: 'Connect your wallet and QDay account', manual: false },
  { title: 'Passkey setup', detail: 'Secure access with your device', manual: true },
  { title: 'Main Wallet activation', detail: 'Prepare your account on Qday', manual: true },
] as const;
export type QDayPreview = { walletReady: boolean; email: string | null; completed: number };
export const emptyQDayPreview: QDayPreview = { walletReady: false, email: null, completed: 0 };
export function validPreviewOTP(code: string) { return /^\d{8}$/.test(code) && code === PREVIEW_OTP; }
export function canEnterQPass(state: QDayPreview) { return state.walletReady && !!state.email && state.completed === 5; }
export function isWalletTabBlocked(path: string, email: string | null, ready: boolean) { return path.startsWith('/agentic') && (!ready || !email); }
export function completePreviewStep(state: QDayPreview, index: number): QDayPreview {
  if (!state.walletReady || !state.email || index !== state.completed || index >= setupSteps.length) return state;
  return { ...state, completed: state.completed + 1 };
}
// Illustrative, non-usable identifiers shown in setup details.
export const PREVIEW_OWNER_ADDRESS = '0x7A39fC621B84D09a36e570F8cE214D6b95aC8021';
export const PREVIEW_ACCOUNT_ADDRESS = '0x0000000000000000000000000000000000dE0001';
/** Revoking the Passkey returns setup to the Passkey step (and undoes activation that depends on it). */
export function revokePreviewPasskey(state: QDayPreview): QDayPreview {
  if (state.completed < 4) return state;
  return { ...state, completed: 3 };
}
export function readQDayPreview(): QDayPreview {
  try {
    const data = JSON.parse(sessionStorage.getItem(QDAY_PREVIEW_KEY) ?? 'null');
    if (data && typeof data.walletReady === 'boolean' && (data.email === null || typeof data.email === 'string') && Number.isInteger(data.completed) && data.completed >= 0 && data.completed <= 5) return data;
  } catch { /* Missing or invalid preview state starts signed out. */ }
  return { ...emptyQDayPreview };
}