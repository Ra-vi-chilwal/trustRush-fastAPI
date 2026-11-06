import { useCallback, useEffect, useState } from 'react';

/** Disable something for N seconds — used for 429 Retry-After. */
export function useCooldown() {
  const [until, setUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until === null) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= until) setUntil(null);
    }, 250);
    return () => clearInterval(t);
  }, [until]);

  const start = useCallback((seconds: number) => {
    const n = Date.now();
    setNow(n);
    setUntil(n + seconds * 1000);
  }, []);

  const secondsLeft = until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
  return { secondsLeft, isCoolingDown: secondsLeft > 0, start };
}
