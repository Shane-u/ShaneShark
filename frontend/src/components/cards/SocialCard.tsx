import type { SocialStat } from '@/types/profile'
import clsx from 'clsx'

const accentMap: Record<SocialStat['accent'], string> = {
  pink: 'from-pink-400 to-rose-500',
  indigo: 'from-indigo-400 to-purple-500',
  green: 'from-emerald-400 to-lime-500',
  teal: 'from-teal-400 to-cyan-500',
  blue: 'from-sky-400 to-blue-500',
  purple: 'from-purple-400 to-fuchsia-500',
}

interface SocialCardProps {
  stat: SocialStat
}

export function SocialCard({ stat }: SocialCardProps) {
  return (
    <article className="relative w-[300px] flex-shrink-0 rounded-3xl border border-slate-100 bg-white/90 p-6 text-slate-900 shadow-soft-card transition-colors duration-300 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-white">
      <div
        className={clsx(
          'absolute inset-0 -z-10 opacity-30 blur-2xl dark:opacity-40',
          `bg-gradient-to-br ${accentMap[stat.accent]}`,
        )}
      />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-white/70">
            {stat.platform}
          </p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{stat.handle}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-white/10 dark:text-white">
          {stat.followers}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600 dark:text-white/80">{stat.summary}</p>
      {stat.metrics && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500 dark:text-white/70">
          {stat.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd className="text-lg font-semibold text-slate-900 dark:text-white">{metric.value}</dd>
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

