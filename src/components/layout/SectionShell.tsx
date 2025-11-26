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
        'mx-auto my-24 w-full max-w-6xl rounded-[32px] border px-6 py-12 md:px-12',
        tone === 'light'
          ? 'bg-white/80 border-white/70 shadow-soft-card'
          : 'bg-slate-900 text-white border-slate-800',
      )}
    >
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.3em] text-accent" data-animate="text">
              {eyebrow}
            </p>
          )}
          <h2 className="font-fantasy text-3xl md:text-4xl" data-animate="text">
            {title}
          </h2>
          {description && (
            <p className="mt-3 max-w-2xl text-balance text-slate-500 md:text-lg" data-animate="text">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0" data-animate="text">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

