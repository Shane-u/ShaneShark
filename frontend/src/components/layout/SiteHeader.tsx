import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { AnimatedThemeToggler } from '@/registry/magicui/animated-theme-toggler'
import { LoginWidget } from '@/components/auth/LoginWidget'
import { NavBrand } from './NavBrand'

const navItems = [
  { label: 'Home', anchor: 'home' },
  { label: 'Projects', anchor: 'projects' },
  { label: 'Skills', anchor: 'skills' },
  { label: 'Blog', anchor: 'blog' },
  { label: 'Footprints', anchor: 'footprint' },
  { label: 'Books', anchor: 'books' },
]

export function SiteHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const socials = useMemo(
    () => [
      { label: 'GitHub', href: 'https://github.com/Shane-u' },
      { label: 'CSDN', href: 'https://blog.csdn.net/VZS_0' },
    ],
    [],
  )

  // 处理锚点跳转
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, anchor: string) => {
    e.preventDefault()
    
    // 如果不在首页，先跳转到首页
    if (location.pathname !== '/') {
      navigate(`/${anchor}`)
      return
    }

    // 在首页时，滚动到对应的锚点
    setTimeout(() => {
      const element = document.getElementById(anchor)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 0)
    
    // 更新 URL
    navigate(`/${anchor}`, { replace: true })
  }

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    navigate('/home')
    setTimeout(() => {
      const element = document.getElementById('home')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 0)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur dark:border-white/5 dark:bg-slate-900/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link 
          to="/" 
          onClick={handleBrandClick}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 rounded-full"
        >
          <NavBrand />
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-semibold text-slate-600 md:flex md:items-center font-nav">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={`#${item.anchor}`}
              onClick={(e) => handleAnchorClick(e, item.anchor)}
              className="transition hover:text-accent !text-slate-600 dark:!text-slate-200 dark:hover:text-accent"
            >
              {item.label}
            </a>
          ))}
          <NavLink
            to="/qa"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs uppercase tracking-wide transition hover:border-accent hover:text-accent !text-slate-600 dark:border-slate-600 dark:!text-slate-100"
          >
            QA知识库
          </NavLink>
          <NavLink
            to="/review"
            className="rounded-full border border-indigo-200 px-4 py-2 text-xs uppercase tracking-wide transition hover:border-indigo-500 hover:text-indigo-600 !text-indigo-600 bg-indigo-50/70 dark:bg-slate-800 dark:border-indigo-500/40 dark:!text-indigo-200"
          >
            检验复盘
          </NavLink>
          <NavLink
            to="/favorites"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs uppercase tracking-wide transition hover:border-accent hover:text-accent !text-slate-600 dark:border-slate-600 dark:!text-slate-100"
          >
            博客收藏
          </NavLink>
          <LoginWidget />
          <AnimatedThemeToggler className="ml-2" />
        </nav>
        <div className="hidden items-center gap-3 text-xs text-slate-500 lg:flex font-nav">
          {socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-accent !text-slate-500 dark:!text-slate-300"
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

