import { cn } from '@/shared/utils/cn';
import type { BookingStatus } from '../types';

const STYLES: Record<BookingStatus, { label: string; cls: string }> = {
  HELD: { label: 'On hold', cls: 'bg-amber-100 text-amber-800 ring-amber-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  EXPIRED: { label: 'Expired', cls: 'bg-red-50 text-red-700 ring-red-200' },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const s = STYLES[status] ?? { label: status, cls: 'bg-slate-100 text-slate-700 ring-slate-200' };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', s.cls)}>
      {s.label}
    </span>
  );
}
