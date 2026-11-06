import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toApiError } from '@/shared/api/errors';
import { useCooldown } from '@/shared/hooks/useCooldown';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { useToast } from '@/shared/toast/useToast';
import { Button } from '@/shared/ui/Button';
import { formatPrice } from '@/shared/utils/format';
import type { EventDetail, Seat } from '@/features/events/types';
import { useCancelBooking, useConfirmBooking, useHoldSeat } from '../hooks';
import type { HoldResponse } from '../types';
import { HoldTimer } from './HoldTimer';

/**
 * The booking flow is a small state machine:
 *   idle --hold--> held --confirm--> confirmed
 *                   |  --cancel---> idle
 *                   |  --timer 0--> expired
 */
type Phase =
  | { kind: 'idle' }
  | { kind: 'held'; booking: HoldResponse; seat: Seat }
  | { kind: 'confirmed'; seat: Seat }
  | { kind: 'expired'; seat: Seat };

interface BookingPanelProps {
  event: EventDetail;
  seat: Seat | null;
  onClearSeat: () => void;
  /** Tells the page which seat is held by me (null = none), so the map can lock & highlight it. */
  onHeldSeatChange: (seatNo: string | null) => void;
}

export function BookingPanel({ event, seat, onClearSeat, onHeldSeatChange }: BookingPanelProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const toast = useToast();
  const cooldown = useCooldown();
  const { hold, isPending: holding, isRetry } = useHoldSeat();
  const confirm = useConfirmBooking();
  const cancel = useCancelBooking();

  const secondsLeft = useCountdown(phase.kind === 'held' ? phase.booking.hold_expires_at : null);

  useEffect(() => {
    onHeldSeatChange(phase.kind === 'held' ? phase.seat.seat_no : null);
  }, [phase, onHeldSeatChange]);

  // Client-side expiry. The server is still the source of truth (confirm after expiry => 409).
  useEffect(() => {
    if (phase.kind === 'held' && secondsLeft <= 0) {
      setPhase({ kind: 'expired', seat: phase.seat });
      toast.warning(`Your hold on ${phase.seat.seat_no} expired.`);
    }
  }, [phase, secondsLeft, toast]);

  const onHold = async () => {
    if (!seat) return;
    try {
      const booking = await hold({ event_id: event.id, seat_no: seat.seat_no });
      setPhase({ kind: 'held', booking, seat });
      onClearSeat(); // the panel now owns the seat; the map shows it via onHeldSeatChange
      toast.success(`Seat ${seat.seat_no} is yours for 5 minutes`);
    } catch (e) {
      const err = toApiError(e);
      if (err.status === 409) {
        toast.error('Seat just got taken');
        onClearSeat();
      } else if (err.status === 429) {
        const wait = err.retryAfterSeconds ?? 30;
        cooldown.start(wait);
        toast.warning(`Too many attempts. Try again in ${wait}s.`);
      } else {
        toast.error(err.message);
      }
    }
  };

  const onConfirm = async () => {
    if (phase.kind !== 'held') return;
    try {
      await confirm.mutateAsync(phase.booking.id);
      setPhase({ kind: 'confirmed', seat: phase.seat });
      toast.success('Booking confirmed! 🎉');
    } catch (e) {
      const err = toApiError(e);
      if (err.status === 409) {
        setPhase({ kind: 'expired', seat: phase.seat });
        toast.error(err.message || 'Your hold is no longer valid');
      } else {
        toast.error(err.message);
      }
    }
  };

  const onCancel = async () => {
    if (phase.kind !== 'held') return;
    try {
      await cancel.mutateAsync(phase.booking.id);
      setPhase({ kind: 'idle' });
      onClearSeat();
      toast.info('Hold released');
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  };

  const reset = () => {
    setPhase({ kind: 'idle' });
    onClearSeat();
  };

  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
      {phase.kind === 'held' ? (
        <div className="grid gap-5">
          <SeatSummary seat={phase.seat} eventTitle={event.title} />
          <HoldTimer secondsLeft={secondsLeft} />
          <div className="grid gap-2">
            <Button size="lg" fullWidth onClick={onConfirm} loading={confirm.isPending} disabled={cancel.isPending}>
              Confirm booking · {formatPrice(phase.seat.price)}
            </Button>
            <Button variant="ghost" fullWidth onClick={onCancel} loading={cancel.isPending} disabled={confirm.isPending}>
              Cancel hold
            </Button>
          </div>
        </div>
      ) : phase.kind === 'confirmed' ? (
        <div className="grid gap-4 text-center">
          <div className="text-5xl" aria-hidden>🎉</div>
          <div>
            <h3 className="text-xl font-extrabold">You're going!</h3>
            <p className="mt-1 text-sm text-slate-500">
              Seat <b className="text-slate-900">{phase.seat.seat_no}</b> for {event.title} is confirmed.
            </p>
          </div>
          <Link to="/my-bookings" className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-800">
            View my bookings
          </Link>
          <Button variant="ghost" onClick={reset}>Book another seat</Button>
        </div>
      ) : phase.kind === 'expired' ? (
        <div className="grid gap-4 text-center">
          <div className="text-5xl" aria-hidden>⌛</div>
          <div>
            <h3 className="text-xl font-extrabold">Hold expired</h3>
            <p className="mt-1 text-sm text-slate-500">Seat {phase.seat.seat_no} was released. Pick a seat to try again.</p>
          </div>
          <Button onClick={reset}>Pick a seat</Button>
        </div>
      ) : seat ? (
        <div className="grid gap-5">
          <SeatSummary seat={seat} eventTitle={event.title} />
          <p className="text-sm text-slate-500">
            Holding locks this seat for <b>5 minutes</b> so nobody else can take it while you confirm.
          </p>
          <div className="grid gap-2">
            <Button size="lg" fullWidth onClick={onHold} loading={holding} disabled={cooldown.isCoolingDown}>
              {cooldown.isCoolingDown ? `Try again in ${cooldown.secondsLeft}s` : isRetry ? 'Retry hold' : 'Hold this seat'}
            </Button>
            <Button variant="ghost" fullWidth onClick={onClearSeat} disabled={holding}>
              Choose a different seat
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 py-6 text-center">
          <div className="text-5xl" aria-hidden>💺</div>
          <h3 className="text-lg font-bold">Pick a seat</h3>
          <p className="text-sm text-slate-500">Tap any green seat on the map to see its price and hold it.</p>
        </div>
      )}
    </aside>
  );
}

function SeatSummary({ seat, eventTitle }: { seat: Seat; eventTitle: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-xl font-extrabold text-brand-700 ring-1 ring-brand-100">
        {seat.seat_no}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{eventTitle}</p>
        <p className="font-semibold">Row {seat.row} · Seat {seat.seat_no}</p>
        <p className="text-lg font-extrabold">{formatPrice(seat.price)}</p>
      </div>
    </div>
  );
}
