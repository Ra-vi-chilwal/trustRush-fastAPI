import { Skeleton } from '@/shared/ui/Skeleton';
import { ErrorState } from '@/shared/ui/ErrorState';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useSeats } from '../hooks';
import { SEAT_REFRESH_MS } from '../constants';
import { SeatMap } from './SeatMap';
import { SeatLegend } from './SeatLegend';
import type { Seat } from '../types';

interface SeatMapSectionProps {
  eventId: string;
  selectedSeatNo: string | null;
  mySeatNo: string | null;
  locked: boolean;
  onSelect: (seat: Seat) => void;
}

export function SeatMapSection({ eventId, selectedSeatNo, mySeatNo, locked, onSelect }: SeatMapSectionProps) {
  const { data, isPending, isError, error, refetch, isFetching, dataUpdatedAt } = useSeats(eventId);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Choose your seat</h2>
        {data && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400" title={`Auto-refresh every ${SEAT_REFRESH_MS / 1000}s`}>
            <span className={isFetching ? 'h-2 w-2 animate-ping rounded-full bg-emerald-500' : 'h-2 w-2 rounded-full bg-emerald-500'} />
            Live · updated {new Date(dataUpdatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {isPending ? (
        <div className="grid gap-1.5">
          {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="mx-auto h-7 w-full max-w-2xl" />)}
        </div>
      ) : isError ? (
        <ErrorState error={error} title="Couldn't load seats" onRetry={() => void refetch()} retrying={isFetching} />
      ) : data.seats.length === 0 ? (
        <EmptyState icon="🪑" title="No seats for this event" description="Seating hasn't been released yet." />
      ) : (
        <div className="grid gap-6">
          <SeatMap seats={data.seats} selectedSeatNo={selectedSeatNo} mySeatNo={mySeatNo} locked={locked} onSelect={onSelect} />
          <SeatLegend seats={data.seats} />
        </div>
      )}
    </section>
  );
}
