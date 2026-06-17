import { useEffect, useState } from 'react';

// Calculates the offset between local clock and server clock using the HTTP Date header.
// Cost: 1 lightweight HEAD request per app load — zero Firestore reads.
export function useServerTimeOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    async function sync() {
      try {
        const t1 = Date.now();
        const res = await fetch('/', { method: 'HEAD', cache: 'no-store' });
        const t2 = Date.now();
        const serverDate = res.headers.get('Date');
        if (!serverDate) return;
        const serverMs = new Date(serverDate).getTime();
        const latency = (t2 - t1) / 2;
        setOffset(serverMs - (t1 + latency));
      } catch {
        // Fail gracefully — offset stays 0, countdown is still accurate within normal NTP tolerance
      }
    }
    sync();
  }, []);

  return offset;
}
