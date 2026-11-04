import { useEffect, useState } from 'react';

function readClock(): number {
  return Date.now();
}

/** Current time (ms), refreshed periodically so "passed / upcoming" labels stay correct. */
export function useNow(refreshMs = 60_000): number {
  const [now, setNow] = useState(readClock);
  useEffect(() => {
    const timer = setInterval(() => setNow(readClock()), refreshMs);
    return () => clearInterval(timer);
  }, [refreshMs]);
  return now;
}
