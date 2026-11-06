import { apiClient } from '@/shared/api/client';
import type { EntityId } from '@/shared/types';
import type { BookingStatusResponse, HoldRequest, HoldResponse, MyBooking } from './types';

const id = (v: EntityId) => encodeURIComponent(String(v));

export const bookingApi = {
  /** Same Idempotency-Key => server must return the same booking instead of creating a second one. */
  hold: (body: HoldRequest, idempotencyKey: string) =>
    apiClient
      .post<HoldResponse>('/bookings', body, { headers: { 'Idempotency-Key': idempotencyKey } })
      .then((r) => r.data),

  confirm: (bookingId: EntityId) =>
    apiClient.post<BookingStatusResponse>(`/bookings/${id(bookingId)}/confirm`).then((r) => r.data),

  cancel: (bookingId: EntityId) =>
    apiClient.post<BookingStatusResponse>(`/bookings/${id(bookingId)}/cancel`).then((r) => r.data),

  mine: (signal?: AbortSignal) => apiClient.get<MyBooking[]>('/bookings/me', { signal }).then((r) => r.data),
};
