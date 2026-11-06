// Deterministic fake catalogue: same 50 events and seat layouts on every reload.
import { CITIES } from '@/features/events/constants';
import type { EventDetail, Seat, SeatStatus } from '@/features/events/types';

/** Tiny seeded PRNG (mulberry32) so "random" data is stable. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, list: readonly T[]): T => list[Math.floor(r() * list.length)] as T;

const VENUES: Record<(typeof CITIES)[number], string[]> = {
  Mumbai: ['NSCI Dome', 'Jio World Garden', 'Wankhede Stadium', 'Prithvi Theatre'],
  Delhi: ['Jawaharlal Nehru Stadium', 'Siri Fort Auditorium', 'Kingdom of Dreams', 'Talkatora Indoor'],
  Bengaluru: ['Phoenix Marketcity Arena', 'Chinnaswamy Stadium', 'Ranga Shankara', 'Palace Grounds'],
  Hyderabad: ['Gachibowli Stadium', 'Shilpakala Vedika', 'HITEX Arena', 'Ravindra Bharathi'],
  Chennai: ['Music Academy', 'Chepauk Stadium', 'Phoenix Arena', 'Narada Gana Sabha'],
  Pune: ['Balewadi Stadium', 'Phoenix Marketcity Pune', 'Bal Gandharva Rangmandir', 'Amanora Arena'],
  Kolkata: ['Eden Gardens', 'Science City Auditorium', 'Netaji Indoor Stadium', 'Kala Mandir'],
};

const KINDS = [
  { prefix: 'Live in Concert:', names: ['The Midnight Ragas', 'Neon Monsoon', 'Arijit & Friends', 'Bass Bazaar', 'Indie Express'], base: 799 },
  { prefix: 'Stand-up:', names: ['Overthinking Tour', 'Chai Pe Charcha', 'Tech Bro Problems', 'Mummy Says No'], base: 499 },
  { prefix: 'Theatre:', names: ['The Last Monsoon', 'Hamlet Reimagined', 'Tughlaq', 'Bombay Dreams'], base: 399 },
  { prefix: 'IPL:', names: ['Mumbai vs Chennai', 'Bengaluru vs Kolkata', 'Delhi vs Hyderabad', 'Pune vs Rajasthan'], base: 999 },
  { prefix: 'Festival:', names: ['Sunburn Arena', 'NH7 Weekender', 'Lollapalooza Night', 'Jazz by the Bay'], base: 1499 },
] as const;

export interface MockEvent extends EventDetail {
  id: number;
  base_price: number;
}

function buildEvents(): MockEvent[] {
  const r = rng(42);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 50 }, (_, i) => {
    const city = CITIES[i % CITIES.length] ?? 'Mumbai';
    const kind = pick(r, KINDS);
    const name = pick(r, kind.names);
    const venue = pick(r, VENUES[city]);
    const start = new Date(today);
    start.setDate(start.getDate() + 1 + Math.floor(r() * 60));
    start.setHours(pick(r, [17, 18, 19, 20, 21]), pick(r, [0, 30]));
    return {
      id: i + 1,
      title: `${kind.prefix} ${name}`,
      description: `${name} comes to ${venue}, ${city}. Grab the best seats before they sell out — doors open 60 minutes before the show. Ages 12+. Food & beverages available at the venue.`,
      venue_name: venue,
      city,
      starts_at: start.toISOString(),
      base_price: kind.base,
    };
  });
}

export const EVENTS: MockEvent[] = buildEvents();

export const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const; // 10 rows
export const SEATS_PER_ROW = 20; // 10 x 20 = 200 seats

/** Front rows cost more. */
function priceFor(event: MockEvent, rowIndex: number): number {
  if (rowIndex < 3) return event.base_price * 3;
  if (rowIndex < 7) return event.base_price * 2;
  return event.base_price;
}

/** Initial seat map: ~18% sold and ~5% on hold by "other people". */
export function baseSeats(event: MockEvent): Seat[] {
  const r = rng(event.id * 7919);
  return ROWS.flatMap((row, ri) =>
    Array.from({ length: SEATS_PER_ROW }, (_, n) => {
      const x = r();
      const status: SeatStatus = x < 0.18 ? 'BOOKED' : x < 0.23 ? 'HELD' : 'AVAILABLE';
      return { seat_no: `${row}${n + 1}`, row, price: priceFor(event, ri), status };
    }),
  );
}
