import { apiClient } from '@/shared/api/client';
import type { EntityId } from '@/shared/types';
import type { EventDetail, EventListParams, EventListResponse, SeatMapResponse } from './types';

export const eventsApi = {
  list: (params: EventListParams, signal?: AbortSignal) =>
    apiClient
      .get<EventListResponse>('/events', {
        signal,
        // axios drops `undefined` params, so empty filters don't become `?city=`
        params: { ...params, city: params.city || undefined, q: params.q || undefined },
      })
      .then((r) => r.data),

  get: (id: EntityId, signal?: AbortSignal) =>
    apiClient.get<EventDetail>(`/events/${encodeURIComponent(String(id))}`, { signal }).then((r) => r.data),

  seats: (id: EntityId, signal?: AbortSignal) =>
    apiClient.get<SeatMapResponse>(`/events/${encodeURIComponent(String(id))}/seats`, { signal }).then((r) => r.data),
};
