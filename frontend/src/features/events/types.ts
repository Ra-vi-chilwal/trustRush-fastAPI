import type { EntityId } from '@/shared/types';

export interface EventSummary {
  id: EntityId;
  title: string;
  venue_name: string;
  city: string;
  starts_at: string; // ISO 8601
  min_price: number;
}

export interface EventListParams {
  city?: string;
  q?: string;
  page: number;
  page_size: number;
}

export interface EventListResponse {
  items: EventSummary[];
  page: number;
  total: number;
}

export interface EventDetail {
  id: EntityId;
  title: string;
  description: string;
  venue_name: string;
  city: string;
  starts_at: string;
}

export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';

export interface Seat {
  seat_no: string; // e.g. "A12"
  row: string; // e.g. "A"
  price: number;
  status: SeatStatus;
}

export interface SeatMapResponse {
  event_id: EntityId;
  seats: Seat[];
}
