import type { SocialStat } from '@/types/profile'
import clsx from 'clsx'

const accentMap: Record<SocialStat['accent'], string> = {
  pink: 'from-pink-500 to-rose-500',
  indigo: 'from-indigo-500 to-purple-500',
  green: 'from-emerald-500 to-lime-500',
  teal: 'from-teal-500 to-cyan-500',
  blue: 'from-sky-500 to-blue-600',
  purple: 'from-purple-500 to-fuchsia-500',
}

interface SocialCardProps {
  stat: SocialStat
}

export function SocialCard({ stat }: SocialCardProps) {
  return (
    <article className="relative w-[300px] flex-shrink-0 rounded-3xl border border-white/20 bg-slate-900/70 p-6 text-white backdrop-blur">
      <div
        className={clsx(
          'absolute inset-0 -z-10 opacity-20 blur-2xl',
          `bg-gradient-to-br ${accentMap[stat.accent]}`,
        )}
      />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">{stat.platform}</p>
          <h3 className="text-xl font-semibold">{stat.handle}</h3>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{stat.followers}</span>
      </div>
      <p className="mt-4 text-sm text-white/80">{stat.summary}</p>
      {stat.metrics && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {stat.metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-white/60">{metric.label}</dt>
              <dd className="text-lg font-semibold">{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <a
        href={stat.url}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center text-sm font-semibold text-accent"
      >
        Visit profile →
      </a>
    </article>
  )
}

