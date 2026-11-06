import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api/errors';

// Retry only things that might succeed next time (network blips, 5xx).
// Never retry 4xx: a 404 or 409 won't fix itself, and retrying a 429 makes it worse.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // mutations retry only when the user asks (with the same Idempotency-Key)
    },
  },
});
