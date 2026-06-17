import { useEffect, useRef, useState } from 'react';
import { playGong, playHeartbeat, playTick } from '../lib/audio';

// Accepts a Firebase Timestamp `scheduledTime` and a server clock offset in ms.
// All ticking happens locally via requestAnimationFrame — zero Firestore reads.
export default function CountdownClock({ scheduledTime, serverOffset = 0, onPhaseChange }) {
  const [remaining, setRemaining] = useState(null); // ms
  const [flash, setFlash] = useState(false);
  const rafRef = useRef(null);
  const prevSecRef = useRef(null);
  const gongFiredRef = useRef(false);

  const scheduledMs = scheduledTime?.toMillis?.() ?? 0;

  useEffect(() => {
    gongFiredRef.current = false;
    prevSecRef.current = null;

    function tick() {
      const now = Date.now() + serverOffset;
      const ms = scheduledMs - now;
      setRemaining(ms);

      const sec = Math.ceil(ms / 1000);

      // Fire gong exactly at zero
      if (ms <= 0 && ms > -500 && !gongFiredRef.current) {
        gongFiredRef.current = true;
        playGong();
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }

      // Heartbeat every beat during final 60s
      if (ms > 0 && ms <= 60_000 && prevSecRef.current !== sec) {
        if (ms > 10_000) {
          playHeartbeat();
        } else {
          playTick(); // tighter tick in final 10s
        }
      }

      // Notify parent of phase changes
      if (onPhaseChange && prevSecRef.current !== sec) {
        if (ms > 5 * 60_000) onPhaseChange('announced');
        else if (ms > 60_000) onPhaseChange('warning');
        else if (ms > 0) onPhaseChange('countdown');
        else if (ms > -30_000) onPhaseChange('fire');
        else onPhaseChange('afterfire');
      }

      prevSecRef.current = sec;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scheduledMs, serverOffset]);

  if (remaining === null) return null;

  const totalSec = Math.max(0, Math.floor(remaining / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Color transitions
  const colorClass =
    remaining > 5 * 60_000
      ? 'text-parchment-200'
      : remaining > 60_000
      ? 'text-gold-400'
      : remaining > 10_000
      ? 'text-blood-400'
      : 'text-blood-300';

  const glowClass =
    remaining > 0 && remaining <= 60_000 ? 'drop-shadow-[0_0_16px_rgba(197,48,48,0.8)]' : '';

  if (remaining <= -30_000) {
    return (
      <div className="text-center">
        <p className="font-display text-dust-500 text-2xl tracking-widest">Duel Complete</p>
      </div>
    );
  }

  if (remaining <= 0) {
    return (
      <div className={`text-center scanlines relative ${flash ? 'bg-parchment-200' : ''} transition-colors duration-100`}>
        <p className="font-display text-blood-400 text-5xl tracking-widest animate-pulse-red drop-shadow-[0_0_24px_rgba(197,48,48,1)]">
          DRAW!
        </p>
        <p className="font-sans text-blood-500 text-xs uppercase tracking-[0.4em] mt-2">
          Active Fire
        </p>
      </div>
    );
  }

  return (
    <div className={`text-center ${flash ? 'invert' : ''} transition-all duration-100`}>
      <div className={`font-display text-6xl tabular-nums tracking-widest ${colorClass} ${glowClass} transition-colors duration-500`}>
        {display}
      </div>
      {remaining <= 60_000 && (
        <p className="font-sans text-blood-500 text-xs uppercase tracking-[0.4em] mt-2 animate-pulse">
          Draw is imminent
        </p>
      )}
      {remaining > 60_000 && remaining <= 5 * 60_000 && (
        <p className="font-sans text-gold-500 text-xs uppercase tracking-[0.4em] mt-2">
          Approach the staging area
        </p>
      )}
    </div>
  );
}
