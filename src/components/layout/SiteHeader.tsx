import { Link, NavLink } from 'react-router-dom'
import { useMemo } from 'react'

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
    <header className="fixed inset-x-0 top-0 z-40 backdrop-blur border-b border-white/60 bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/#home" className="font-fantasy text-2xl text-accent-dark">
          ShaneShark
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="hover:text-accent">
              {item.label}
            </a>
          ))}
          <NavLink
            to="/favorites"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs uppercase tracking-wide hover:border-accent hover:text-accent"
          >
            博客收藏
          </NavLink>
        </nav>
        <div className="hidden items-center gap-3 text-xs text-slate-500 lg:flex">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent"
            >
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}

