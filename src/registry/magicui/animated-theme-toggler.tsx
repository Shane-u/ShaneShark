import clsx from 'clsx'
import { useTheme } from '@/providers/ThemeProvider'

type AnimatedThemeTogglerProps = {
  className?: string
  ariaLabel?: string
}

// Usage:
// <AnimatedThemeToggler className="ml-4" ariaLabel="切换主题" />
export function AnimatedThemeToggler({
  className,
  ariaLabel = 'Toggle color theme',
}: AnimatedThemeTogglerProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className={clsx(
        'group relative flex h-10 w-20 items-center rounded-full border border-white/40 bg-gradient-to-r from-amber-200/90 via-amber-100/50 to-sky-100/60 px-1 py-1 text-xs uppercase tracking-wide text-slate-800 shadow-soft-card transition-all duration-300 dark:border-slate-700 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-slate-800/80 dark:text-slate-100',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
        className,
      )}
    >
      <span
        className={clsx(
          'ml-2 flex items-center gap-1 text-[10px] font-semibold transition-opacity',
          isDark ? 'opacity-30' : 'opacity-100',
        )}
      >
        ☀️ Light
      </span>
      <span
        className={clsx(
          'ml-auto mr-3 flex items-center gap-1 text-[10px] font-semibold transition-opacity',
          isDark ? 'opacity-100' : 'opacity-30',
        )}
      >
        🌙 Dark
      </span>
      <span
        className={clsx(
          'absolute inset-y-1 flex w-8 items-center justify-center rounded-full bg-white text-base shadow-lg transition-all duration-300 group-hover:scale-[1.02] dark:bg-slate-950',
          isDark ? 'translate-x-[44px] text-amber-200' : 'translate-x-0 text-amber-500',
        )}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100 dark:via-white/10" />
    </button>
  )
}

