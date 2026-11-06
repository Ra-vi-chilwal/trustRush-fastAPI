import { Link } from 'react-router-dom';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';
import { dateParts, formatPrice } from '@/shared/utils/format';
import { posterFor } from '../poster';
import type { EventSummary } from '../types';

export function EventCard({ event }: { event: EventSummary }) {
  const { gradient, emoji } = posterFor(event.id);
  const d = dateParts(event.starts_at);

  return (
    <Link
      to={`/events/${encodeURIComponent(String(event.id))}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className={cn('relative grid h-40 place-items-center bg-gradient-to-br', gradient)}>
        <span aria-hidden className="text-6xl drop-shadow-lg transition duration-300 group-hover:scale-110 group-hover:-rotate-6">
          {emoji}
        </span>
        <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-2.5 py-1.5 text-center leading-none shadow">
          <div className="text-[10px] font-bold text-brand-600">{d.month}</div>
          <div className="text-xl font-extrabold">{d.day}</div>
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          {event.city}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-bold leading-snug text-slate-900">{event.title}</h3>
        <p className="truncate text-sm text-slate-500">{event.venue_name}</p>
        <p className="text-sm text-slate-500">{d.weekday} · {d.time}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm text-slate-500">
            from <span className="font-bold text-slate-900">{formatPrice(event.min_price)}</span>
          </span>
          <span className="text-sm font-semibold text-brand-600 group-hover:underline">Book →</span>
        </div>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Skeleton className="h-40 rounded-none" />
      <div className="grid gap-2 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="mt-3 h-5 w-1/3" />
      </div>
    </div>
  );
}
