// Horizontal rope-style decorative divider
export default function RopeDivider({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 my-4 ${className}`} aria-hidden="true">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dust-400 to-dust-400" />
      {/* Knot center */}
      <svg width="24" height="12" viewBox="0 0 24 12">
        <ellipse cx="12" cy="6" rx="10" ry="4" fill="none" stroke="#a8895e" strokeWidth="1.5" />
        <line x1="2" y1="6" x2="22" y2="6" stroke="#a8895e" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="12" cy="6" r="2.5" fill="#a8895e" />
      </svg>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-dust-400 to-dust-400" />
    </div>
  );
}
