import type { ReactNode } from 'react';
import { toApiError } from '@/shared/api/errors';
import { Button } from './Button';

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  retrying?: boolean;
  children?: ReactNode;
}

export function ErrorState({ error, title = 'Something went wrong', onRetry, retrying, children }: ErrorStateProps) {
  const apiError = toApiError(error);
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50/60 px-6 py-12 text-center">
      <div className="text-4xl" aria-hidden>⚠️</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="max-w-md text-sm text-slate-600">
        {apiError.message}
        {apiError.status > 0 && <span className="ml-1 font-mono text-xs text-slate-400">(HTTP {apiError.status})</span>}
      </p>
      <div className="mt-1 flex gap-2">
        {onRetry && (
          <Button variant="secondary" onClick={onRetry} loading={retrying}>
            Try again
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}
