import { cn } from '@/shared/utils/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    />
  );
}

export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Spinner className="h-8 w-8 text-brand-600" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}
