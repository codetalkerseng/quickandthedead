import { useEffect, useRef, useState } from 'react';
import { playGong, playHeartbeat, playWarning, playTick } from '../lib/audio';

const ROMAN = [
  ['XII', 0], ['I', 30], ['II', 60], ['III', 90],
  ['IV', 120], ['V', 150], ['VI', 180], ['VII', 210],
  ['VIII', 240], ['IX', 270], ['X', 300], ['XI', 330],
];

// Convert clock-face degrees (0 = 12 o'clock, clockwise) to SVG x/y
function hx(deg, r) { return 100 + r * Math.cos((deg - 90) * Math.PI / 180); }
function hy(deg, r) { return 100 + r * Math.sin((deg - 90) * Math.PI / 180); }

function ClockFace({ remaining, serverOffset, tournamentTime, large }) {
  // Real current time for hour + minute hands
  const now    = Date.now() + serverOffset;
  const d      = new Date(now);
  const h12    = (d.getHours() % 12) + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const minFrac = d.getMinutes() + d.getSeconds() / 60;
  const hourAngle   = h12 * 30;    // 30° per hour
  const minuteAngle = minFrac * 6; // 6° per minute

  // Second hand: countdown-based so it strikes 12 exactly at DRAW!
  const remSec      = Math.max(0, remaining) / 1000;
  const secondAngle = remaining > 0 ? (60 - remSec % 60) * 6 : 0;

  // Tournament marker angle (hour hand position of tournament start time)
  let tMarkerAngle = null;
  if (tournamentTime) {
    const td  = new Date(tournamentTime.toMillis());
    const th12 = (td.getHours() % 12) + td.getMinutes() / 60;
    tMarkerAngle = th12 * 30;
  }

  const critical  = remaining < 10_000 && remaining > 0;
  const sizeClass = large ? 'w-[min(74vw,460px)]' : 'w-44';

  return (
    <svg
      viewBox="0 0 200 200"
      className={`${sizeClass} aspect-square drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]`}
    >
      <defs>
        <radialGradient id="caseGrad" cx="38%" cy="32%">
          <stop offset="0%"   stopColor="#8a5c2e" />
          <stop offset="55%"  stopColor="#3b1e0a" />
          <stop offset="100%" stopColor="#180d04" />
        </radialGradient>
        <radialGradient id="faceGrad" cx="42%" cy="38%">
          <stop offset="0%"   stopColor="#fdf3da" />
          <stop offset="100%" stopColor="#e8cf98" />
        </radialGradient>
        {critical && (
          <filter id="bloodGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Drop-shadow disk */}
      <circle cx="101" cy="103" r="95" fill="rgba(0,0,0,0.4)" />

      {/* Iron/bronze case */}
      <circle cx="100" cy="100" r="97" fill="url(#caseGrad)" />
      <circle cx="100" cy="100" r="91" fill="none" stroke="#100804" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="88" fill="#b08030" />
      <circle cx="100" cy="100" r="86" fill="#180d04" />

      {/* Parchment face */}
      <circle cx="100" cy="100" r="83" fill="url(#faceGrad)" />
      <circle cx="100" cy="100" r="83" fill="none" stroke="#c9a060" strokeWidth="0.6" opacity="0.5" />

      {/* ── Tournament time marker — gold arrow on the gold bezel ── */}
      {tMarkerAngle !== null && (
        <>
          {/* Arrow tip pointing inward */}
          <polygon
            points={`
              ${hx(tMarkerAngle, 83)},${hy(tMarkerAngle, 83)}
              ${hx(tMarkerAngle - 3.5, 91)},${hy(tMarkerAngle - 3.5, 91)}
              ${hx(tMarkerAngle + 3.5, 91)},${hy(tMarkerAngle + 3.5, 91)}
            `}
            fill="#f0c040"
            stroke="#8b6010"
            strokeWidth="0.6"
          />
          {/* Small circle dot on outer edge */}
          <circle
            cx={hx(tMarkerAngle, 93)}
            cy={hy(tMarkerAngle, 93)}
            r="2.5"
            fill="#f0c040"
            stroke="#8b6010"
            strokeWidth="0.6"
          />
        </>
      )}

      {/* Minute tick marks */}
      {Array.from({ length: 60 }, (_, i) => {
        const isHour    = i % 5 === 0;
        const isQuarter = i % 15 === 0;
        const r1 = isQuarter ? 64 : isHour ? 68 : 73;
        return (
          <line key={i}
            x1={hx(i * 6, r1)} y1={hy(i * 6, r1)}
            x2={hx(i * 6, 80)} y2={hy(i * 6, 80)}
            stroke={isHour ? '#3b1e0a' : '#9b7c50'}
            strokeWidth={isQuarter ? 3 : isHour ? 2 : 0.8}
          />
        );
      })}

      {/* Roman numerals */}
      {ROMAN.map(([label, deg]) => (
        <text key={label}
          x={hx(deg, 56)} y={hy(deg, 56)}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#3b1e0a"
          fontSize={label.length > 3 ? '6' : '7.5'}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="bold"
          letterSpacing="0.5"
        >
          {label}
        </text>
      ))}

      {/* Hour hand — short, very thick */}
      <line
        x1={hx(hourAngle + 180, 10)} y1={hy(hourAngle + 180, 10)}
        x2={hx(hourAngle, 40)}       y2={hy(hourAngle, 40)}
        stroke="#2b1407" strokeWidth="7" strokeLinecap="round"
      />

      {/* Minute hand — medium length, medium width */}
      <line
        x1={hx(minuteAngle + 180, 12)} y1={hy(minuteAngle + 180, 12)}
        x2={hx(minuteAngle, 60)}       y2={hy(minuteAngle, 60)}
        stroke="#2b1407" strokeWidth="4.5" strokeLinecap="round"
      />

      {/* Second hand — blood red, countdown-based, long */}
      <line
        x1={hx(secondAngle + 180, 22)} y1={hy(secondAngle + 180, 22)}
        x2={hx(secondAngle, 79)}       y2={hy(secondAngle, 79)}
        stroke={critical ? '#ff2222' : '#c53030'}
        strokeWidth="2.2"
        strokeLinecap="round"
        filter={critical ? 'url(#bloodGlow)' : undefined}
      />
      <circle
        cx={hx(secondAngle + 180, 16)}
        cy={hy(secondAngle + 180, 16)}
        r="3.5"
        fill={critical ? '#ff2222' : '#c53030'}
        filter={critical ? 'url(#bloodGlow)' : undefined}
      />

      {/* Center jewel */}
      <circle cx="100" cy="100" r="6"   fill="#2b1407" />
      <circle cx="100" cy="100" r="3.5" fill="#b08030" />
      <circle cx="100" cy="100" r="1.5" fill="#3b1e0a" />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function CountdownClock({
  scheduledTime,
  startTime,
  tournamentTime,
  serverOffset = 0,
  onPhaseChange,
  large = false,
}) {
  const [remaining, setRemaining] = useState(null);
  const [flash, setFlash]         = useState(false);
  const rafRef     = useRef(null);
  const prevSecRef = useRef(null);
  const firedRef   = useRef({ gong: false, w2: false, w1: false, w30: false });

  const scheduledMs = scheduledTime?.toMillis?.() ?? 0;

  useEffect(() => {
    firedRef.current  = { gong: false, w2: false, w1: false, w30: false };
    prevSecRef.current = null;

    function tick() {
      const now = Date.now() + serverOffset;
      const ms  = scheduledMs - now;
      setRemaining(ms);

      const displaySec = Math.max(0, Math.floor(ms / 1000));
      const fired = firedRef.current;

      // Chimes fire the instant the display digit changes to the threshold
      if (ms < 121_000 && ms > 120_000 && !fired.w2)  { fired.w2  = true; playWarning(1); }
      if (ms < 61_000  && ms > 60_000  && !fired.w1)  { fired.w1  = true; playWarning(2); }
      if (ms < 31_000  && ms > 30_000  && !fired.w30) { fired.w30 = true; playWarning(3); }

      if (ms < 61_000 && ms >= 1_000 && prevSecRef.current !== displaySec) {
        if (ms > 10_000) playHeartbeat();
        else             playTick();
      }

      if (ms < 1_000 && ms >= 0 && !fired.gong) {
        fired.gong = true;
        playGong();
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }

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

  if (remaining <= -30_000) {
    return (
      <div className="text-center">
        <p className={`font-display text-dust-500 ${large ? 'text-4xl' : 'text-2xl'} tracking-widest`}>
          Duel Complete
        </p>
      </div>
    );
  }

  if (remaining <= 0) {
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
    <div className={`flex flex-col items-center gap-4 ${flash ? 'invert' : ''} transition-all duration-100`}>
      <ClockFace
        remaining={remaining}
        serverOffset={serverOffset}
        tournamentTime={tournamentTime}
        large={large}
      />

      {remaining <= 30_000 && remaining >= 1_000 && (
        <p className={`font-sans text-blood-400 uppercase tracking-[0.4em] animate-pulse ${large ? 'text-lg' : 'text-xs'}`}>
          Draw is imminent
        </p>
      )}
      {remaining > 30_000 && remaining <= 60_000 && (
        <p className={`font-sans text-blood-500 uppercase tracking-[0.3em] ${large ? 'text-base' : 'text-xs'}`}>
          30 seconds
        </p>
      )}
      {remaining > 60_000 && remaining <= 2 * 60_000 && (
        <p className={`font-sans text-gold-500 uppercase tracking-[0.3em] ${large ? 'text-lg' : 'text-xs'}`}>
          1 minute
        </p>
      )}
      {remaining > 2 * 60_000 && remaining <= 5 * 60_000 && (
        <p className={`font-sans text-gold-500 uppercase tracking-[0.3em] ${large ? 'text-base' : 'text-xs'}`}>
          Approach the staging area
        </p>
      )}
    </div>
  );
}
