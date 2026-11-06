import type { EntityId } from '@/shared/types';

/** EXPIRED is optional: return it from /bookings/me for HELD bookings past hold_expires_at, if you like. */
export type BookingStatus = 'HELD' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface HoldRequest {
  event_id: EntityId;
  seat_no: string;
}

export interface HoldResponse {
  id: EntityId;
  event_id: EntityId;
  seat_no: string;
  status: 'HELD';
  hold_expires_at: string; // ISO 8601, timezone-aware
}

export interface BookingStatusResponse {
  id: EntityId;
  status: BookingStatus;
}

export interface MyBooking {
  id: EntityId;
  event_title: string;
  seat_no: string;
  status: BookingStatus;
  created_at: string;
}

/** Hold length used for the progress bar. The real deadline always comes from hold_expires_at. */
export const HOLD_SECONDS = 5 * 60;
