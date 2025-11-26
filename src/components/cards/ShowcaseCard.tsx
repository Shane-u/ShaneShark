import type { ShowcaseItem } from '@/types/profile'

interface ShowcaseCardProps {
  item: ShowcaseItem
}

const categoryColors: Record<ShowcaseItem['category'], string> = {
  project: 'text-emerald-600 bg-emerald-50',
  game: 'text-orange-500 bg-orange-50',
  video: 'text-purple-500 bg-purple-50',
}

export function ShowcaseCard({ item }: ShowcaseCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-soft-card">
      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[item.category]}`}>
        {item.category.toUpperCase()}
      </span>
      <div>
        <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{item.description}</p>
      </div>
      {item.stats && (
        <dl className="grid grid-cols-2 gap-3 text-sm text-slate-500">
          {item.stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd className="text-lg font-semibold text-slate-900">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto text-sm font-semibold text-accent"
      >
        Open project →
      </a>
    </article>
  )
}

