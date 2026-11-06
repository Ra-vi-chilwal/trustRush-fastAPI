import { cn } from '@/shared/utils/cn';

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <span aria-hidden>🎟️</span>
      <span className={inverted ? 'text-white' : 'text-slate-900'}>
        Ticket<span className={inverted ? 'text-white/80' : 'text-brand-600'}>Rush</span>
      </span>
    </span>
  );
}
