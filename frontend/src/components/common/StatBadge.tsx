interface StatBadgeProps {
  label: string
  value: string
}

export function StatBadge({ label, value }: StatBadgeProps) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-center shadow-soft-card">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

