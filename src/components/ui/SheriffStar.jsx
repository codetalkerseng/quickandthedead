// 6-pointed marshal star badge
export default function SheriffStar({ size = 48, className = '', filled = true }) {
  const r = size / 2;
  // Outer points and inner notches for a classic 6-pointed star
  const points = [];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI / 6) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r * 0.95 : r * 0.48;
    points.push(`${r + radius * Math.cos(angle)},${r + radius * Math.sin(angle)}`);
  }
  const pointStr = points.join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label="Sheriff Star"
    >
      <polygon
        points={pointStr}
        fill={filled ? '#c9a227' : 'none'}
        stroke="#9d7a1c"
        strokeWidth={size * 0.04}
        strokeLinejoin="round"
      />
      {/* Center circle */}
      <circle
        cx={r}
        cy={r}
        r={r * 0.18}
        fill={filled ? '#6b3d1e' : 'none'}
        stroke="#9d7a1c"
        strokeWidth={size * 0.03}
      />
    </svg>
  );
}
