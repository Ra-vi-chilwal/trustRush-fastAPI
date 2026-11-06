import { cn } from '@/shared/utils/cn';
import { formatCountdown } from '@/shared/utils/format';
import { HOLD_SECONDS } from '../types';

export function HoldTimer({ secondsLeft }: { secondsLeft: number }) {
  const pct = Math.min(100, Math.max(0, (secondsLeft / HOLD_SECONDS) * 100));
  const urgent = secondsLeft <= 60;
  return (
    <div className="grid gap-2" role="timer" aria-live="off">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-slate-500">Seat held for</span>
        <span className={cn('font-mono text-3xl font-extrabold tabular-nums', urgent ? 'text-red-600' : 'text-slate-900')}>
          {formatCountdown(secondsLeft)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', urgent ? 'bg-red-500' : 'bg-brand-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {urgent && <p className="text-xs font-medium text-red-600">Hurry! Your hold is about to expire.</p>}
    </div>
  );
}
