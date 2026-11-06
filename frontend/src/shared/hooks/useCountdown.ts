import { useEffect, useState } from 'react';

function secondsUntil(iso: string | null): number {
  if (!iso) return 0;
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - Date.now()) / 1000));
}

/**
 * Seconds left until an ISO timestamp (e.g. hold_expires_at). Ticks 4x/second so it
 * never visibly skips. Note: uses the browser clock, so the server should send
 * timezone-aware timestamps ("...Z" or "+00:00").
 */
export function useCountdown(targetIso: string | null): number {
  const [left, setLeft] = useState(() => secondsUntil(targetIso));

  useEffect(() => {
    setLeft(secondsUntil(targetIso));
    if (!targetIso) return;
    const t = setInterval(() => {
      const next = secondsUntil(targetIso);
      setLeft(next);
      if (next <= 0) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [targetIso]);

  return left;
}
