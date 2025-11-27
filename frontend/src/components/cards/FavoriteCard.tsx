import type { FavoriteItem } from '@/types/profile'

interface FavoriteCardProps {
  favorite: FavoriteItem
}

export function FavoriteCard({ favorite }: FavoriteCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-soft-card transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-300">
        {favorite.tag}
      </p>
      <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{favorite.title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{favorite.summary}</p>
      <a
        href={favorite.href}
        target="_blank"
        rel="noreferrer"
        className="mt-auto text-sm font-semibold text-accent"
      >
        Explore reference →
      </a>
    </article>
  )
}

