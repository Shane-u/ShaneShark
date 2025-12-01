import { Outlet } from 'react-router-dom'
import { BackToTopButton } from '@/components/ui/BackToTopButton'
import { SiteHeader } from './SiteHeader'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-surface text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />
      <main className="pt-28">
        <Outlet />
      </main>
      <BackToTopButton />
      <footer className="mt-32 border-t border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-slate-500 dark:text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ShaneShark · React 18 + GSAP.</p>
          <div className="flex gap-4 font-semibold uppercase tracking-wide text-xs">
            <a className="transition hover:text-accent" href="/#projects">
              Projects
            </a>
            <a className="transition hover:text-accent" href="/#blog">
              Blog
            </a>
            <a className="transition hover:text-accent" href="/#footprint">
              Footprints
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

