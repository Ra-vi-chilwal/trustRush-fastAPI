import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toApiError } from '@/shared/api/errors';
import { useToast } from '@/shared/toast/useToast';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { EntityId } from '@/shared/types';
import { formatDateTime } from '@/shared/utils/format';
import { BookingStatusBadge } from '../components/BookingStatusBadge';
import { useCancelBooking, useConfirmBooking, useMyBookings } from '../hooks';
import type { MyBooking } from '../types';

export function MyBookingsPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useMyBookings();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My bookings</h1>
          <p className="mt-1 text-slate-500">Your holds and confirmed tickets.</p>
        </div>
        {data && data.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => void refetch()} loading={isFetching}>
            Refresh
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <ErrorState error={error} title="Couldn't load your bookings" onRetry={() => void refetch()} retrying={isFetching} />
      ) : data.length === 0 ? (
        <EmptyState
          icon="🎟️"
          title="No bookings yet"
          description="When you hold or book a seat, it shows up here."
          action={<Link to="/" className="font-semibold text-brand-600 hover:underline">Browse events →</Link>}
        />
      ) : (
        <ul className="grid gap-3">
          {[...data]
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
            .map((b) => <BookingRow key={b.id} booking={b} />)}
        </ul>
      )}
    </div>
  );
}

function BookingRow({ booking }: { booking: MyBooking }) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const cancel = useCancelBooking();
  const confirm = useConfirmBooking();
  const toast = useToast();
  const active = booking.status === 'HELD' || booking.status === 'CONFIRMED';

  const run = async (action: (id: EntityId) => Promise<unknown>, success: string) => {
    try {
      await action(booking.id);
      toast.success(success);
    } catch (e) {
      toast.error(toApiError(e).message);
    } finally {
      setConfirmingCancel(false);
    }
  };

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-900 text-lg font-extrabold text-white">
        {booking.seat_no}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-bold">{booking.event_title}</h3>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Seat {booking.seat_no} · Booked {formatDateTime(booking.created_at)} · <span className="font-mono text-xs">#{String(booking.id)}</span>
        </p>
      </div>

      {active && (
        <div className="flex shrink-0 items-center gap-2">
          {confirmingCancel ? (
            <>
              <span className="text-sm text-slate-600">Cancel this booking?</span>
              <Button size="sm" variant="danger" loading={cancel.isPending} onClick={() => run(cancel.mutateAsync, 'Booking cancelled')}>
                Yes, cancel
              </Button>
              <Button size="sm" variant="ghost" disabled={cancel.isPending} onClick={() => setConfirmingCancel(false)}>
                Keep
              </Button>
            </>
          ) : (
            <>
              {booking.status === 'HELD' && (
                <Button size="sm" loading={confirm.isPending} onClick={() => run(confirm.mutateAsync, 'Booking confirmed')}>
                  Confirm
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={() => setConfirmingCancel(true)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
