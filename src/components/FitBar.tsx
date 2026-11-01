export function FitBar({ fit }: { fit: number | null }) {
  if (fit === null) return <span className="text-sm text-slate-400">No evidence</span>;
  const v = Math.round(fit);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200" aria-hidden>
        <div className="h-full rounded-full bg-teal-500" style={{ width: `${v}%` }} />
      </div>
      <span className="tabular-nums text-sm font-semibold text-navy-900">{v}%</span>
    </div>
  );
}

export function RatingDots({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < Math.round(rating) ? 'bg-navy-700' : 'bg-slate-200'}`}
        />
      ))}
    </span>
  );
}
