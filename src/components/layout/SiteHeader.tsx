import { Link, NavLink } from 'react-router-dom'
import { useMemo } from 'react'
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler'
import { NavBrand } from './NavBrand'

const navItems = [
  { label: 'Home', href: '/#home' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Blog', href: '/#blog' },
  { label: 'Footprints', href: '/#footprint' },
  { label: 'Books', href: '/#books' },
]

export function SiteHeader() {
  const socials = useMemo(
    () => [
      { label: 'GitHub', href: 'https://github.com/Shane-u' },
      { label: 'CSDN', href: 'https://blog.csdn.net/VZS_0' },
    ],
    [],
  )

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur dark:border-white/5 dark:bg-slate-900/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/#home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 rounded-full">
          <NavBrand />
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-semibold text-slate-600 md:flex md:items-center font-nav">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="transition hover:text-accent dark:text-slate-200 dark:hover:text-accent"
            >
              {item.label}
            </a>
          ))}
          <NavLink
            to="/favorites"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs uppercase tracking-wide transition hover:border-accent hover:text-accent dark:border-slate-600 dark:text-slate-100"
          >
            博客收藏
          </NavLink>
          <AnimatedThemeToggler className="ml-2" />
        </nav>
        <div className="hidden items-center gap-3 text-xs text-slate-500 lg:flex font-nav">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-accent dark:text-slate-300"
            >
              {social.label}
            </a>
          ))}
        </div>
        <div className="md:hidden">
          <AnimatedThemeToggler ariaLabel="切换主题" />
        </div>
      </div>
    </header>
  )
}

