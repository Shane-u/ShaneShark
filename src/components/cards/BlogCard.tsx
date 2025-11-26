import type { BlogPost } from '@/types/profile'
import clsx from 'clsx'

interface BlogCardProps {
  post: BlogPost
}

const tagColors = ['bg-orange-50 text-orange-600', 'bg-emerald-50 text-emerald-600', 'bg-sky-50 text-sky-600']

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-soft-card">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{post.published}</p>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag, index) => (
            <span
              key={tag}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-semibold',
                tagColors[index % tagColors.length],
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-slate-900">{post.title}</h3>
        <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm text-slate-500">
        {post.stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd className="text-lg font-semibold text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <a
        href={post.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto text-sm font-semibold text-accent"
      >
        阅读全文 →
      </a>
    </article>
  )
}


