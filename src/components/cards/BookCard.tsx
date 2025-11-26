import type { BookItem } from '@/types/profile'

interface BookCardProps {
  book: BookItem
}

export function BookCard({ book }: BookCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/80 p-6 shadow-soft-card transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/70">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-300">{book.tag}</p>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{book.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-300">{book.author}</p>
      <a
        href={book.href}
        target="_blank"
        rel="noreferrer"
        className="mt-4 text-sm font-semibold text-accent"
      >
        View notes →
      </a>
    </article>
  )
}


