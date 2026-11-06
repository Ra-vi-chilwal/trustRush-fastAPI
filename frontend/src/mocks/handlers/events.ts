import { http, HttpResponse } from 'msw';
import type { EventDetail, EventListResponse, SeatMapResponse } from '@/features/events/types';
import { EVENTS } from '../data';
import { findEvent, markTakenByOther, seatsFor } from '../db';
import { api, httpError, latency, unauthorized, userFromRequest } from '../utils';

export const eventHandlers = [
  http.get(api('/events'), async ({ request }) => {
    await latency();
    if (!userFromRequest(request)) return unauthorized();

    const url = new URL(request.url);
    const city = url.searchParams.get('city')?.trim().toLowerCase() ?? '';
    const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('page_size') ?? 20);

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return HttpResponse.json(
        { detail: [{ loc: ['query', 'page'], msg: 'page must be >= 1 and page_size between 1 and 100', type: 'value_error' }] },
        { status: 422 },
      );
    }

    const filtered = EVENTS.filter(
      (e) =>
        (!city || e.city.toLowerCase() === city) &&
        (!q || `${e.title} ${e.venue_name} ${e.city}`.toLowerCase().includes(q)),
    ).sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));

    const items = filtered.slice((page - 1) * pageSize, page * pageSize).map((e) => ({
      id: e.id,
      title: e.title,
      venue_name: e.venue_name,
      city: e.city,
      starts_at: e.starts_at,
      min_price: e.base_price,
    }));

    return HttpResponse.json({ items, page, total: filtered.length } satisfies EventListResponse);
  }),

  http.get(api('/events/:id'), async ({ request, params }) => {
    await latency();
    if (!userFromRequest(request)) return unauthorized();
    const event = findEvent(String(params.id));
    if (!event) return httpError(404, 'Event not found');
    const { id, title, description, venue_name, city, starts_at } = event;
    return HttpResponse.json({ id, title, description, venue_name, city, starts_at } satisfies EventDetail);
  }),

  http.get(api('/events/:id/seats'), async ({ request, params }) => {
    await latency();
    if (!userFromRequest(request)) return unauthorized();
    const event = findEvent(String(params.id));
    if (!event) return httpError(404, 'Event not found');

    // Simulate other users buying: ~40% of refreshes, one random free seat gets sold.
    if (Math.random() < 0.4) {
      const free = seatsFor(event).filter((s) => s.status === 'AVAILABLE');
      const victim = free[Math.floor(Math.random() * free.length)];
      if (victim) markTakenByOther(event.id, victim.seat_no);
    }

    return HttpResponse.json({ event_id: event.id, seats: seatsFor(event) } satisfies SeatMapResponse);
  }),
];
