import { memo, useMemo } from 'react';
import { cn } from '@/shared/utils/cn';
import { formatPrice } from '@/shared/utils/format';
import type { Seat, SeatStatus } from '../types';

interface SeatMapProps {
  seats: Seat[];
  selectedSeatNo: string | null;
  /** Seat currently held by this user — shown as "yours", not as someone else's hold. */
  mySeatNo: string | null;
  locked: boolean;
  onSelect: (seat: Seat) => void;
}

const seatNumber = (seatNo: string): number => Number(seatNo.replace(/\D/g, '')) || 0;

function groupByRow(seats: Seat[]): Array<[string, Seat[]]> {
  const rows = new Map<string, Seat[]>();
  for (const s of seats) {
    const list = rows.get(s.row) ?? [];
    list.push(s);
    rows.set(s.row, list);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([row, list]) => [row, list.sort((a, b) => seatNumber(a.seat_no) - seatNumber(b.seat_no))]);
}

const STATUS_LABEL: Record<SeatStatus, string> = { AVAILABLE: 'Available', HELD: 'On hold', BOOKED: 'Sold' };

export const SeatMap = memo(function SeatMap({ seats, selectedSeatNo, mySeatNo, locked, onSelect }: SeatMapProps) {
  const rows = useMemo(() => groupByRow(seats), [seats]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto w-max min-w-full">
        {/* Stage */}
        <div className="mx-auto mb-8 max-w-md">
          <div className="h-2 rounded-full bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-70" />
          <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Stage this way</p>
        </div>

        <div className="grid gap-1.5">
          {rows.map(([row, rowSeats]) => {
            const aisleAfter = Math.ceil(rowSeats.length / 2);
            return (
              <div key={row} className="flex items-center justify-center gap-1.5">
                <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-400">{row}</span>
                {rowSeats.map((seat, i) => (
                  <SeatButton
                    key={seat.seat_no}
                    seat={seat}
                    aisle={i === aisleAfter}
                    selected={seat.seat_no === selectedSeatNo}
                    mine={seat.seat_no === mySeatNo}
                    locked={locked}
                    onSelect={onSelect}
                  />
                ))}
                <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-400">{row}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

interface SeatButtonProps {
  seat: Seat;
  aisle: boolean;
  selected: boolean;
  mine: boolean;
  locked: boolean;
  onSelect: (seat: Seat) => void;
}

function SeatButton({ seat, aisle, selected, mine, locked, onSelect }: SeatButtonProps) {
  const available = seat.status === 'AVAILABLE';
  const highlighted = selected || mine;
  const clickable = available && !locked;

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => onSelect(seat)}
      aria-pressed={selected}
      aria-label={`Seat ${seat.seat_no}, ${formatPrice(seat.price)}, ${mine ? 'held by you' : STATUS_LABEL[seat.status]}`}
      title={`${seat.seat_no} · ${formatPrice(seat.price)} · ${mine ? 'Yours' : STATUS_LABEL[seat.status]}`}
      className={cn(
        'h-7 w-7 shrink-0 rounded-t-lg rounded-b-md text-[10px] font-semibold transition',
        aisle && 'ml-5',
        highlighted
          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/40 ring-2 ring-brand-300'
          : available
            ? 'border border-emerald-500 bg-white text-emerald-700 hover:bg-emerald-500 hover:text-white'
            : seat.status === 'HELD'
              ? 'cursor-not-allowed bg-amber-200 text-amber-700'
              : 'cursor-not-allowed bg-slate-200 text-slate-400',
        locked && available && !highlighted && 'opacity-50',
      )}
    >
      {seatNumber(seat.seat_no)}
    </button>
  );
}
