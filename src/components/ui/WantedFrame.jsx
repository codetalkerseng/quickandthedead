// Decorative corner ornaments for a wanted-poster look
function Corner({ className }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M2 2 L12 2 L12 4 L4 4 L4 12 L2 12 Z"
        fill="none"
        stroke="#9d7a1c"
        strokeWidth="2"
      />
      <path
        d="M2 2 L8 8"
        fill="none"
        stroke="#c9a227"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="2" cy="2" r="2" fill="#c9a227" />
    </svg>
  );
}

export default function WantedFrame({ children, className = '', title }) {
  return (
    <div className={`relative ${className}`}>
      {/* Corners */}
      <Corner className="absolute top-0 left-0" />
      <Corner className="absolute top-0 right-0 rotate-90" />
      <Corner className="absolute bottom-0 left-0 -rotate-90" />
      <Corner className="absolute bottom-0 right-0 rotate-180" />

      {/* Optional top label like "WANTED" */}
      {title && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 bg-parchment-200">
          <span className="font-display text-xs text-gold-600 tracking-widest uppercase">
            {title}
          </span>
        </div>
      )}

      <div className="p-4">{children}</div>
    </div>
  );
}
