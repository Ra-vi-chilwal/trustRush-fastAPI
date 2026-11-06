import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export function FormAlert({ kind, children }: { kind: 'error' | 'info'; children: ReactNode }) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-1 rounded-xl border px-4 py-3 text-sm',
        kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-sky-200 bg-sky-50 text-sky-800',
      )}
    >
      {children}
    </div>
  );
}
