import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { emptyQDayPreview, readQDayPreview, QDAY_PREVIEW_KEY, type QDayPreview } from '@/lib/qday-preview';

const QDayContext = createContext<{ state: QDayPreview; ready: boolean; update: (change: (state: QDayPreview) => QDayPreview) => void } | null>(null);
export function QDayPreviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QDayPreview>(emptyQDayPreview);
  const [ready, setReady] = useState(false);
  const update = useCallback((change: (state: QDayPreview) => QDayPreview) => setState(change), []);
  useEffect(() => { setState(readQDayPreview()); setReady(true); }, []);
  useEffect(() => { if (ready) { try { sessionStorage.setItem(QDAY_PREVIEW_KEY, JSON.stringify(state)); } catch { /* Continue in memory if storage is unavailable. */ } } }, [state, ready]);
  return <QDayContext.Provider value={{ state, ready, update }}>{children}</QDayContext.Provider>;
}
export function useQDayPreview() {
  const value = useContext(QDayContext);
  if (!value) throw new Error('QDayPreviewProvider is required');
  return value;
}