'use client';

import { useEffect, useState } from 'react';

/** Current time in ms, refreshed every `intervalMs`. Used for "8s ago" style labels. */
export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return now;
}
