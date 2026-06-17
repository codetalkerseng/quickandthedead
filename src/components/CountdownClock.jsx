import { useEffect, useRef, useState } from 'react';
import { playGong, playHeartbeat, playWarning, playTick } from '../lib/audio';

// scheduledTime  — Firebase Timestamp for T=0
// serverOffset   — ms drift from useServerTimeOffset
// onPhaseChange  — callback(phase string)
// large          — tablet/display mode: fills most of the screen width
export default function CountdownClock({ scheduledTime, serverOffset = 0, onPhaseChange, large = false }) {
  const [remaining, setRemaining] = useState(null);
  const [flash, setFlash]         = useState(false);
  const rafRef      = useRef(null);
  const prevSecRef  = useRef(null);
  const firedRef    = useRef({ gong: false, w2: false, w1: false, w30: false });

  const scheduledMs = scheduledTime?.toMillis?.() ?? 0;

  useEffect(() => {
    firedRef.current = { gong: false, w2: false, w1: false, w30: false };
    prevSecRef.current = null;

    function tick() {
      const now = Date.now() + serverOffset;
      const ms  = scheduledMs - now;
      setRemaining(ms);

      // Use the same floor the display uses so chimes fire exactly when the digit changes.
      const displaySec = Math.max(0, Math.floor(ms / 1000));
      const fired = firedRef.current;

      // ── Warning chimes — fire as display first shows the threshold second ─
      if (ms < 121_000 && ms > 120_000 && !fired.w2)  { fired.w2  = true; playWarning(1); }
      if (ms < 61_000  && ms > 60_000  && !fired.w1)  { fired.w1  = true; playWarning(2); }
      if (ms < 31_000  && ms > 30_000  && !fired.w30) { fired.w30 = true; playWarning(3); }

      // ── Heartbeat / tick during final countdown ─────────────────────────
      if (ms < 61_000 && ms >= 1_000 && prevSecRef.current !== displaySec) {
        if (ms > 10_000) playHeartbeat();
        else             playTick();
      }

      // ── Gong fires the moment display would first show 00:00 ───────────
      if (ms < 1_000 && ms >= 0 && !fired.gong) {
        fired.gong = true;
        playGong();
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }

      // ── Phase reporting ─────────────────────────────────────────────────
      if (onPhaseChange && prevSecRef.current !== displaySec) {
        if      (ms > 5 * 60_000)  onPhaseChange('announced');
        else if (ms > 60_000)      onPhaseChange('warning');
        else if (ms >= 1_000)      onPhaseChange('countdown');
        else if (ms > -30_000)     onPhaseChange('fire');
        else                       onPhaseChange('afterfire');
      }

      prevSecRef.current = displaySec;
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

  const colorClass =
    remaining > 5 * 60_000 ? 'text-parchment-200' :
    remaining > 60_000     ? 'text-gold-400' :
    remaining > 10_000     ? 'text-blood-400' :
                             'text-blood-300';

  const glowClass = remaining > 0 && remaining <= 60_000
    ? 'drop-shadow-[0_0_32px_rgba(197,48,48,0.9)]'
    : '';

  // Tablet-display sizing: fills ~80vw on landscape, stays readable on mobile
  const sizeClass = large
    ? 'text-[18vw] leading-none tracking-tight'
    : 'text-6xl tracking-widest';

  if (remaining <= -30_000) {
    return (
      <div className="text-center">
        <p className={`font-display text-dust-500 ${large ? 'text-4xl' : 'text-2xl'} tracking-widest`}>
          Duel Complete
        </p>
      </div>
    );
  }

  // Show DRAW! as soon as display would read 00:00 (remaining < 1 second)
  if (remaining < 1_000) {
    return (
      <div className={`text-center scanlines relative transition-colors duration-100 ${flash ? 'bg-parchment-200' : ''}`}>
        <p className={`font-display text-blood-400 animate-pulse-red drop-shadow-[0_0_32px_rgba(197,48,48,1)] ${large ? 'text-[22vw] leading-none' : 'text-5xl'}`}>
          DRAW!
        </p>
        <p className={`font-sans text-blood-500 uppercase tracking-[0.4em] mt-2 ${large ? 'text-xl' : 'text-xs'}`}>
          Active Fire
        </p>
      </div>
    );
  }

  return (
    <div className={`text-center ${flash ? 'invert' : ''} transition-all duration-100`}>
      <div className={`font-display tabular-nums ${sizeClass} ${colorClass} ${glowClass} transition-colors duration-500`}>
        {display}
      </div>

      {remaining <= 30_000 && remaining > 0 && (
        <p className={`font-sans text-blood-400 uppercase tracking-[0.4em] mt-3 animate-pulse ${large ? 'text-lg' : 'text-xs'}`}>
          Draw is imminent
        </p>
      )}
      {remaining > 30_000 && remaining <= 60_000 && (
        <p className={`font-sans text-blood-500 uppercase tracking-[0.3em] mt-3 ${large ? 'text-base' : 'text-xs'}`}>
          30 seconds
        </p>
      )}
      {remaining > 60_000 && remaining <= 2 * 60_000 && (
        <p className={`font-sans text-gold-500 uppercase tracking-[0.3em] mt-3 ${large ? 'text-lg' : 'text-xs'}`}>
          1 minute
        </p>
      )}
      {remaining > 2 * 60_000 && remaining <= 5 * 60_000 && (
        <p className={`font-sans text-gold-500 uppercase tracking-[0.3em] mt-3 ${large ? 'text-base' : 'text-xs'}`}>
          Approach the staging area
        </p>
      )}
    </div>
  );
}
