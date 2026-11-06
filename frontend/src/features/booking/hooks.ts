import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toApiError, type ApiError } from '@/shared/api/errors';
import type { EntityId } from '@/shared/types';
import { uuid } from '@/shared/utils/uuid';
import { eventKeys } from '@/features/events/hooks';
import { bookingApi } from './api';
import type { HoldRequest, HoldResponse } from './types';

export const bookingKeys = {
  mine: ['bookings', 'me'] as const,
};

/**
 * A failure is "final" when retrying the same request can't succeed (409 taken, 404, 422...).
 * Network errors, 5xx, 408 and 429 are NOT final: the user may retry the SAME attempt.
 */
const isFinalFailure = (e: ApiError): boolean =>
  e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429;

/**
 * POST /bookings with idempotency.
 * One "attempt" = one (event, seat) the user is trying to hold. Every retry of that attempt
 * reuses the same key, so if the first request actually succeeded but the response got lost,
 * the server returns that same booking instead of holding twice.
 */
export function useHoldSeat() {
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const [isRetry, setIsRetry] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ body, key }: { body: HoldRequest; key: string }) => bookingApi.hold(body, key),
  });
  const { mutateAsync } = mutation;

  const hold = useCallback(
    async (body: HoldRequest): Promise<HoldResponse> => {
      const fingerprint = `${String(body.event_id)}:${body.seat_no}`;
      if (attempt.current?.fingerprint !== fingerprint) {
        attempt.current = { fingerprint, key: uuid() }; // new attempt -> new key
      }
      try {
        const res = await mutateAsync({ body, key: attempt.current.key });
        attempt.current = null;
        setIsRetry(false);
        return res;
      } catch (e) {
        const err = toApiError(e);
        const final = isFinalFailure(err);
        if (final) attempt.current = null;
        setIsRetry(!final);
        throw err;
      } finally {
        void queryClient.invalidateQueries({ queryKey: eventKeys.allSeats });
      }
    },
    [mutateAsync, queryClient],
  );

  return { hold, isPending: mutation.isPending, isRetry };
}

function useInvalidateBookings() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: bookingKeys.mine }),
      queryClient.invalidateQueries({ queryKey: eventKeys.allSeats }),
    ]);
}

export function useConfirmBooking() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (bookingId: EntityId) => bookingApi.confirm(bookingId),
    onSettled: invalidate,
  });
}

export function useCancelBooking() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (bookingId: EntityId) => bookingApi.cancel(bookingId),
    onSettled: invalidate,
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.mine,
    queryFn: ({ signal }) => bookingApi.mine(signal),
    staleTime: 0,
  });
}
