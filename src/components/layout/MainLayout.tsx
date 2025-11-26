import { Outlet } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-surface text-slate-800">
      <SiteHeader />
      <main className="pt-28">
        <Outlet />
      </main>
      <footer className="mt-32 border-t border-slate-200 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} ShaneShark · React 18 + GSAP.</p>
          <div className="flex gap-4 font-semibold uppercase tracking-wide text-xs">
            <a href="/#projects">Projects</a>
            <a href="/#blog">Blog</a>
            <a href="/#footprint">Footprints</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

