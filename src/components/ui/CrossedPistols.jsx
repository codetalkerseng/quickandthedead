// Pair of crossed revolvers — decorative western header element
export default function CrossedPistols({ size = 80, className = '', color = '#c9a227' }) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 120 72"
      className={className}
      aria-label="Crossed Pistols"
    >
      <g transform="translate(60,36)">
        {/* Left pistol */}
        <g transform="rotate(-35) translate(-50, -6)">
          <rect x="0" y="4" width="52" height="8" rx="2" fill={color} />
          <rect x="38" y="0" width="14" height="14" rx="1" fill={color} />
          <rect x="46" y="2" width="22" height="5" rx="1" fill={color} />
          {/* Grip */}
          <path d="M8 12 Q6 22 10 26 L18 26 Q20 20 16 12Z" fill={color} />
          {/* Trigger */}
          <rect x="20" y="10" width="2" height="10" rx="1" fill="#9d7a1c" />
          {/* Barrel highlight */}
          <rect x="46" y="2.5" width="21" height="1.5" rx="0.5" fill="rgba(255,255,255,0.2)" />
        </g>

        {/* Right pistol (mirrored) */}
        <g transform="rotate(35) translate(-50, -6) scale(-1,1) translate(-68,0)">
          <rect x="0" y="4" width="52" height="8" rx="2" fill={color} />
          <rect x="38" y="0" width="14" height="14" rx="1" fill={color} />
          <rect x="46" y="2" width="22" height="5" rx="1" fill={color} />
          <path d="M8 12 Q6 22 10 26 L18 26 Q20 20 16 12Z" fill={color} />
          <rect x="20" y="10" width="2" height="10" rx="1" fill="#9d7a1c" />
          <rect x="46" y="2.5" width="21" height="1.5" rx="0.5" fill="rgba(255,255,255,0.2)" />
        </g>
      </g>
    </svg>
  );
}
