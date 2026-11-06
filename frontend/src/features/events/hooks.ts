import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { eventsApi } from './api';
import { SEAT_REFRESH_MS } from './constants';
import type { EventListParams } from './types';

// Query keys = cache keys. Invalidating ['events','seats'] refetches every seat map.
export const eventKeys = {
  all: ['events'] as const,
  list: (params: EventListParams) => ['events', 'list', params] as const,
  detail: (id: string) => ['events', 'detail', id] as const,
  allSeats: ['events', 'seats'] as const,
  seats: (id: string) => ['events', 'seats', id] as const,
};

export function useEvents(params: EventListParams) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: ({ signal }) => eventsApi.list(params, signal),
    placeholderData: keepPreviousData, // keep old page visible while the next one loads
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: ({ signal }) => eventsApi.get(id, signal),
  });
}

/** Polls every 10s while mounted; stops automatically when the page unmounts or the tab is hidden. */
export function useSeats(id: string) {
  return useQuery({
    queryKey: eventKeys.seats(id),
    queryFn: ({ signal }) => eventsApi.seats(id, signal),
    refetchInterval: SEAT_REFRESH_MS,
    staleTime: 0,
  });
}
