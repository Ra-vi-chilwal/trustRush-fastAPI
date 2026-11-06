import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';
import { formatDateTime } from '@/shared/utils/format';
import { posterFor } from '../poster';
import type { EventDetail } from '../types';

export function EventHeader({ event }: { event: EventDetail }) {
  const { gradient, emoji } = posterFor(event.id);
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={cn('relative flex min-h-44 items-end bg-gradient-to-br p-6 text-white sm:p-8', gradient)}>
        <span aria-hidden className="absolute right-6 top-4 text-8xl opacity-90 drop-shadow-xl sm:text-9xl">{emoji}</span>
        <div className="relative max-w-2xl">
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold backdrop-blur">{event.city}</span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight drop-shadow sm:text-4xl">{event.title}</h1>
        </div>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8">
        <dl className="grid shrink-0 gap-3 text-sm">
          <div>
            <dt className="text-slate-500">When</dt>
            <dd className="font-semibold">📅 {formatDateTime(event.starts_at)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Where</dt>
            <dd className="font-semibold">📍 {event.venue_name}, {event.city}</dd>
          </div>
        </dl>
        <p className="leading-relaxed text-slate-600">{event.description}</p>
      </div>
    </section>
  );
}

export function EventHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <Skeleton className="h-44 rounded-none" />
      <div className="grid gap-3 p-8">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
