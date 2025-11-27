import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useSectionReveal } from '@/hooks/useSectionReveal'

interface SectionShellProps {
  id?: string
  title: string
  description?: string
  eyebrow?: string
  tone?: 'light' | 'dark'
  actions?: ReactNode
  children: ReactNode
}

export function SectionShell({
  id,
  title,
  description,
  eyebrow,
  tone = 'light',
  actions,
  children,
}: SectionShellProps) {
  const sectionRef = useSectionReveal<HTMLElement>()

  return (
    <section
      ref={sectionRef}
      id={id}
      className={clsx(
        'mx-auto my-24 w-full max-w-6xl rounded-[32px] border px-6 py-12 transition-colors duration-300 md:px-12',
        tone === 'light'
          ? 'bg-white/80 text-slate-900 shadow-soft-card border-white/70 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100'
          : 'bg-slate-900 text-white border-slate-800 dark:bg-slate-900/90 dark:text-white',
      )}
    >
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.3em] text-accent dark:text-amber-300" data-animate="text">
              {eyebrow}
            </p>
          )}
          <h2 className="font-fantasy text-3xl md:text-4xl" data-animate="text">
            {title}
          </h2>
          {description && (
            <p className="mt-3 max-w-2xl text-balance text-slate-500 dark:text-slate-300 md:text-lg" data-animate="text">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0 text-slate-700 dark:text-slate-200" data-animate="text">
            {actions}
          </div>
        )}
      </div>
      {children}
    </section>
  )
}

