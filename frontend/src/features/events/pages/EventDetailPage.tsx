import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookingPanel } from '@/features/booking/components/BookingPanel';
import { isApiError } from '@/shared/api/errors';
import { useToast } from '@/shared/toast/useToast';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Skeleton } from '@/shared/ui/Skeleton';
import { EventHeader, EventHeaderSkeleton } from '../components/EventHeader';
import { SeatMapSection } from '../components/SeatMapSection';
import { useEvent, useSeats } from '../hooks';
import type { Seat } from '../types';

export function EventDetailPage() {
  const { id = '' } = useParams();
  const event = useEvent(id);
  const seats = useSeats(id); // same cache entry as <SeatMapSection>, no extra request
  const toast = useToast();

  const [selectedSeatNo, setSelectedSeatNo] = useState<string | null>(null);
  const [heldSeatNo, setHeldSeatNo] = useState<string | null>(null);

  // Always read the selected seat from the LATEST seat map (prices/status may change).
  const selectedSeat: Seat | null = seats.data?.seats.find((s) => s.seat_no === selectedSeatNo) ?? null;

  // Someone else grabbed my selected seat during a 10s refresh → tell the user and unselect.
  useEffect(() => {
    if (selectedSeat && selectedSeat.status !== 'AVAILABLE' && selectedSeat.seat_no !== heldSeatNo) {
      toast.info(`Seat ${selectedSeat.seat_no} was just taken by someone else.`);
      setSelectedSeatNo(null);
    }
  }, [selectedSeat, heldSeatNo, toast]);

  const onSelect = useCallback((seat: Seat) => {
    setSelectedSeatNo((cur) => (cur === seat.seat_no ? null : seat.seat_no));
  }, []);
  const clearSeat = useCallback(() => setSelectedSeatNo(null), []);

  if (event.isError) {
    const notFound = isApiError(event.error) && event.error.status === 404;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {notFound ? (
          <EmptyState
            icon="🔎"
            title="Event not found"
            description="It may have been removed or the link is wrong."
            action={<Link to="/" className="font-semibold text-brand-600 hover:underline">← Back to events</Link>}
          />
        ) : (
          <ErrorState error={event.error} title="Couldn't load this event" onRetry={() => void event.refetch()} retrying={event.isFetching} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <Link to="/" className="mb-4 inline-block text-sm font-semibold text-slate-500 hover:text-slate-900">← All events</Link>

      {event.isPending ? <EventHeaderSkeleton /> : <EventHeader event={event.data} />}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <SeatMapSection
          eventId={id}
          selectedSeatNo={heldSeatNo ? null : selectedSeatNo}
          mySeatNo={heldSeatNo}
          locked={heldSeatNo !== null}
          onSelect={onSelect}
        />
        {event.isPending ? (
          <Skeleton className="h-72 rounded-3xl" />
        ) : (
          <BookingPanel
            event={event.data}
            seat={selectedSeat && selectedSeat.status === 'AVAILABLE' ? selectedSeat : null}
            onClearSeat={clearSeat}
            onHeldSeatChange={setHeldSeatNo}
          />
        )}
      </div>
    </div>
  );
}
