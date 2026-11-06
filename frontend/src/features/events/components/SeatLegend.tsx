import { useMemo } from 'react';
import { formatPrice } from '@/shared/utils/format';
import type { Seat } from '../types';

const ITEMS = [
  { label: 'Available', cls: 'border border-emerald-500 bg-white' },
  { label: 'Selected / yours', cls: 'bg-brand-600' },
  { label: 'On hold', cls: 'bg-amber-200' },
  { label: 'Sold', cls: 'bg-slate-200' },
];

export function SeatLegend({ seats }: { seats: Seat[] }) {
  const stats = useMemo(() => {
    const prices = [...new Set(seats.map((s) => s.price))].sort((a, b) => b - a);
    const available = seats.filter((s) => s.status === 'AVAILABLE').length;
    return { prices, available };
  }, [seats]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-slate-600">
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {ITEMS.map((i) => (
          <li key={i.label} className="flex items-center gap-1.5">
            <span className={`h-3.5 w-3.5 rounded ${i.cls}`} aria-hidden />
            {i.label}
          </li>
        ))}
      </ul>
      <p>
        <span className="font-semibold text-emerald-700">{stats.available}</span> of {seats.length} left
        {stats.prices.length > 0 && <> · {stats.prices.map(formatPrice).join(' / ')}</>}
      </p>
    </div>
  );
}
