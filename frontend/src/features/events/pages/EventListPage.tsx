import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Pagination } from '@/shared/ui/Pagination';
import { cn } from '@/shared/utils/cn';
import { EventCard, EventCardSkeleton } from '../components/EventCard';
import { EventFilters } from '../components/EventFilters';
import { PAGE_SIZE } from '../constants';
import { useEvents } from '../hooks';

/**
 * Filters live in the URL (?city=Pune&q=rock&page=2), not in useState:
 * refresh, back button and shared links all keep the same view.
 * Same idea as reading req.query in Express.
 */
export function EventListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const city = params.get('city') ?? '';
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  // Local input state, debounced into the URL so we don't fire a request per keystroke.
  const [search, setSearch] = useState(q);
  const debounced = useDebounce(search.trim(), 400);

  const update = (patch: Record<string, string>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    });
  };

  useEffect(() => {
    if (debounced !== q) update({ q: debounced, page: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useEvents({
    city: city || undefined,
    q: q || undefined,
    page,
    page_size: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const hasFilters = Boolean(city || q);

  const clearFilters = () => {
    setSearch('');
    setParams(new URLSearchParams());
  };

  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-10">
          <p className="font-semibold text-brand-600">Hi {user?.full_name.split(' ')[0]} 👋</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">What do you want to watch?</h1>
          <div className="mt-6">
            <EventFilters
              search={search}
              city={city}
              onSearchChange={setSearch}
              onCityChange={(c) => update({ city: c, page: '' })}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {data && (
              <>
                <span className="font-semibold text-slate-900">{data.total}</span> event{data.total === 1 ? '' : 's'}
                {city && <> in <span className="font-semibold text-slate-900">{city}</span></>}
                {q && <> matching “<span className="font-semibold text-slate-900">{q}</span>”</>}
              </>
            )}
          </p>
          {isFetching && !isPending && <span className="text-xs text-slate-400">Updating…</span>}
        </div>

        {isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <ErrorState error={error} title="Couldn't load events" onRetry={() => void refetch()} retrying={isFetching} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="No events found"
            description={hasFilters ? 'Try another city or a different search.' : 'Nothing is on sale yet. Check back soon!'}
            action={hasFilters && <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
              {data.items.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                disabled={isPlaceholderData}
                onChange={(p) => {
                  update({ page: p > 1 ? String(p) : '' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
