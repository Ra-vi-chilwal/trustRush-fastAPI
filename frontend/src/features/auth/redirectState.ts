/** What we pass in router `state` when sending someone to /login. */
export interface AuthRedirectState {
  from?: string;
  reason?: 'expired';
}

export function readRedirectState(state: unknown): AuthRedirectState {
  if (typeof state !== 'object' || state === null) return {};
  const s = state as Record<string, unknown>;
  return {
    from: typeof s.from === 'string' ? s.from : undefined,
    reason: s.reason === 'expired' ? 'expired' : undefined,
  };
}
