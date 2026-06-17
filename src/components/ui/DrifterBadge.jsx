export default function DrifterBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-leather-600 border border-leather-400
                  rounded-sm font-sans text-[10px] font-bold uppercase tracking-widest text-parchment-200
                  ${className}`}
    >
      ✦ Drifter
    </span>
  );
}
