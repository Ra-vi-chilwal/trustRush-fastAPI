// In-browser "database" for the mock backend, persisted to localStorage so
// signups and bookings survive a page reload. Clear it with: localStorage.removeItem('ticketrush.mockdb.v1')
import { config } from '@/shared/config';
import type { Seat } from '@/features/events/types';
import { baseSeats, EVENTS, type MockEvent } from './data';

export interface MockUser {
  id: number;
  email: string;
  full_name: string;
  password: string;
  city: string | null;
}

export interface MockBooking {
  id: string;
  user_id: number;
  event_id: number;
  seat_no: string;
  status: 'HELD' | 'CONFIRMED' | 'CANCELLED';
  hold_expires_at: string;
  created_at: string;
}

interface MockState {
  users: MockUser[];
  bookings: MockBooking[];
  /** `${userId}:${idempotencyKey}` -> booking id */
  idempotency: Record<string, string>;
  /** Seats taken by "other users" after the initial layout: eventId -> seatNo -> status */
  takenByOthers: Record<string, Record<string, 'BOOKED'>>;
  nextUserId: number;
}

const KEY = 'ticketrush.mockdb.v1';
export const HOLD_MS = 5 * 60_000;

function fresh(): MockState {
  return { users: [], bookings: [], idempotency: {}, takenByOthers: {}, nextUserId: 2, };
}

function load(): MockState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fresh(), ...(JSON.parse(raw) as Partial<MockState>) } : fresh();
  } catch {
    return fresh();
  }
}

export const db: MockState = load();

// The demo user always exists and always uses the credentials from .env.
(function ensureDemoUser() {
  const demo: MockUser = { id: 1, email: config.demo.email, full_name: 'Demo User', password: config.demo.password, city: 'Mumbai' };
  const i = db.users.findIndex((u) => u.id === 1);
  if (i === -1) db.users.unshift(demo);
  else db.users[i] = { ...db.users[i], ...demo, full_name: db.users[i]?.full_name ?? demo.full_name };
})();

export function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // storage full / blocked: keep working in memory
  }
}

export const findEvent = (id: string | number): MockEvent | undefined => EVENTS.find((e) => String(e.id) === String(id));

export const isExpired = (b: MockBooking): boolean => b.status === 'HELD' && Date.parse(b.hold_expires_at) <= Date.now();

/** Current seat map = base layout + seats taken by others + live bookings. */
export function seatsFor(event: MockEvent): Seat[] {
  const others = db.takenByOthers[String(event.id)] ?? {};
  const active = new Map<string, Seat['status']>();
  for (const b of db.bookings) {
    if (b.event_id !== event.id) continue;
    if (b.status === 'CONFIRMED') active.set(b.seat_no, 'BOOKED');
    else if (b.status === 'HELD' && !isExpired(b)) active.set(b.seat_no, 'HELD');
  }
  return baseSeats(event).map((s) => ({ ...s, status: active.get(s.seat_no) ?? others[s.seat_no] ?? s.status }));
}

export function markTakenByOther(eventId: number, seatNo: string): void {
  const key = String(eventId);
  db.takenByOthers[key] = { ...(db.takenByOthers[key] ?? {}), [seatNo]: 'BOOKED' };
  save();
}

// ---- rate limit: 5 holds per minute per user (memory only, like a Redis counter) ----
const holdLog = new Map<number, number[]>();
export const HOLD_LIMIT = 5;
const WINDOW_MS = 60_000;

/** Returns seconds to wait, or 0 if allowed (and records the attempt). Sliding window. */
export function takeHoldToken(userId: number): number {
  const now = Date.now();
  const recent = (holdLog.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= HOLD_LIMIT) {
    const oldest = recent[0] ?? now;
    holdLog.set(userId, recent);
    return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
  }
  recent.push(now);
  holdLog.set(userId, recent);
  return 0;
}
