import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import type { BookingStatusResponse, HoldResponse, MyBooking } from '@/features/booking/types';
import { uuid } from '@/shared/utils/uuid';
import { EVENTS } from '../data';
import { db, findEvent, HOLD_MS, isExpired, markTakenByOther, save, seatsFor, takeHoldToken, type MockBooking } from '../db';
import { api, httpError, latency, readJson, unauthorized, userFromRequest, validationError } from '../utils';

const holdBody = z.object({
  event_id: z.union([z.number(), z.string()]),
  seat_no: z.string().min(1, 'Field required'),
});

const toHoldResponse = (b: MockBooking): HoldResponse => ({
  id: b.id,
  event_id: b.event_id,
  seat_no: b.seat_no,
  status: 'HELD',
  hold_expires_at: b.hold_expires_at,
});

export const bookingHandlers = [
  // ---- POST /bookings : hold a seat ----
  http.post(api('/bookings'), async ({ request }) => {
    await latency();
    const user = userFromRequest(request);
    if (!user) return unauthorized();

    // 1) Rate limit first (a gateway like Nginx does this before your app even runs).
    const wait = takeHoldToken(user.id);
    if (wait > 0) {
      return httpError(429, `Rate limit exceeded: max 5 holds per minute. Retry in ${wait}s.`, { 'Retry-After': String(wait) });
    }

    // 2) Idempotency: same key from the same user => same booking, no second hold.
    const key = request.headers.get('Idempotency-Key');
    if (!key) return httpError(400, 'Idempotency-Key header is required');
    const existingId = db.idempotency[`${user.id}:${key}`];
    const existing = existingId ? db.bookings.find((b) => b.id === existingId) : undefined;
    if (existing) return HttpResponse.json(toHoldResponse(existing), { status: 201 });

    // 3) Validate body.
    const parsed = holdBody.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error.issues);

    const event = findEvent(parsed.data.event_id);
    if (!event) return httpError(404, 'Event not found');
    const seat = seatsFor(event).find((s) => s.seat_no === parsed.data.seat_no);
    if (!seat) return httpError(404, 'Seat not found');

    // 4) Seat must be free.
    if (seat.status !== 'AVAILABLE') return httpError(409, 'Seat is no longer available');

    // 5) Race simulation: ~10% of the time someone else wins the seat at the same moment.
    if (Math.random() < 0.1) {
      markTakenByOther(event.id, seat.seat_no);
      return httpError(409, 'Seat was just taken by another user');
    }

    const now = Date.now();
    const booking: MockBooking = {
      id: uuid(),
      user_id: user.id,
      event_id: event.id,
      seat_no: seat.seat_no,
      status: 'HELD',
      hold_expires_at: new Date(now + HOLD_MS).toISOString(),
      created_at: new Date(now).toISOString(),
    };
    db.bookings.push(booking);
    db.idempotency[`${user.id}:${key}`] = booking.id;
    save();
    return HttpResponse.json(toHoldResponse(booking), { status: 201 });
  }),

  // ---- POST /bookings/:id/confirm ----
  http.post(api('/bookings/:id/confirm'), async ({ request, params }) => {
    await latency();
    const user = userFromRequest(request);
    if (!user) return unauthorized();
    const booking = db.bookings.find((b) => b.id === params.id && b.user_id === user.id);
    if (!booking) return httpError(404, 'Booking not found');

    if (booking.status === 'CONFIRMED') {
      return HttpResponse.json({ id: booking.id, status: 'CONFIRMED' } satisfies BookingStatusResponse); // idempotent
    }
    if (booking.status === 'CANCELLED') return httpError(409, 'Booking was cancelled');
    if (isExpired(booking)) return httpError(409, 'Hold expired, the seat was released');

    booking.status = 'CONFIRMED';
    save();
    return HttpResponse.json({ id: booking.id, status: 'CONFIRMED' } satisfies BookingStatusResponse);
  }),

  // ---- POST /bookings/:id/cancel ----
  http.post(api('/bookings/:id/cancel'), async ({ request, params }) => {
    await latency();
    const user = userFromRequest(request);
    if (!user) return unauthorized();
    const booking = db.bookings.find((b) => b.id === params.id && b.user_id === user.id);
    if (!booking) return httpError(404, 'Booking not found');

    booking.status = 'CANCELLED'; // cancelling twice is fine (idempotent)
    save();
    return HttpResponse.json({ id: booking.id, status: 'CANCELLED' } satisfies BookingStatusResponse);
  }),

  // ---- GET /bookings/me ----
  http.get(api('/bookings/me'), async ({ request }) => {
    await latency();
    const user = userFromRequest(request);
    if (!user) return unauthorized();

    const mine: MyBooking[] = db.bookings
      .filter((b) => b.user_id === user.id)
      .map((b) => ({
        id: b.id,
        event_title: EVENTS.find((e) => e.id === b.event_id)?.title ?? 'Unknown event',
        seat_no: b.seat_no,
        status: isExpired(b) ? 'EXPIRED' : b.status,
        created_at: b.created_at,
      }));
    return HttpResponse.json(mine);
  }),
];
