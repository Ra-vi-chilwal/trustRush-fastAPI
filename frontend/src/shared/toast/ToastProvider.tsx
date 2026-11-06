import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { uuid } from '@/shared/utils/uuid';
import { ToastContext, type ToastApi, type ToastKind } from './ToastContext';

interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
}

const styles: Record<ToastKind, { box: string; icon: string }> = {
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: '✅' },
  error: { box: 'border-red-200 bg-red-50 text-red-900', icon: '⛔' },
  info: { box: 'border-slate-200 bg-white text-slate-900', icon: 'ℹ️' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: '⏳' },
};

const DURATION_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = uuid();
      setToasts((t) => [...t.slice(-3), { id, kind, message }]); // keep max 4 on screen
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show('success', m),
      error: (m) => show('error', m),
      info: (m) => show('info', m),
      warning: (m) => show('warning', m),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
              'animate-[toast-in_.2s_ease-out]',
              styles[t.kind].box,
            )}
          >
            <span aria-hidden>{styles[t.kind].icon}</span>
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100" aria-label="Dismiss">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
