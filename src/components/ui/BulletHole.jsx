// Dramatic bullet-hole effect — used for eliminated players / impact moments
export default function BulletHole({ size = 40, className = '' }) {
  const r = size / 2;
  const cracks = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label="Bullet Hole"
    >
      {/* Cracks radiating outward */}
      {cracks.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const len = r * (0.5 + Math.random() * 0.4);
        return (
          <line
            key={angle}
            x1={r}
            y1={r}
            x2={r + Math.cos(rad) * len}
            y2={r + Math.sin(rad) * len}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        );
      })}
      {/* Hole */}
      <circle cx={r} cy={r} r={r * 0.28} fill="#0a0a0a" />
      <circle
        cx={r}
        cy={r}
        r={r * 0.28}
        fill="none"
        stroke="rgba(0,0,0,0.6)"
        strokeWidth={r * 0.12}
      />
      {/* Inner glint */}
      <ellipse
        cx={r * 0.85}
        cy={r * 0.85}
        rx={r * 0.06}
        ry={r * 0.04}
        fill="rgba(255,255,255,0.15)"
        transform={`rotate(-45 ${r} ${r})`}
      />
    </svg>
  );
}
