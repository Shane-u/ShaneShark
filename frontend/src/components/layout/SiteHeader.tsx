import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { startTransition, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import gsap from 'gsap'
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

const overflowItems = [
  { label: 'QA知识库', to: '/qa' },
  { label: '检验复盘', to: '/review' },
  { label: '沙箱世界', to: '/sandbox' },
  { label: '博客收藏', to: '/favorites' },
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isOverflowOpen, setIsOverflowOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement | null>(null)
  const overflowPanelRef = useRef<HTMLDivElement | null>(null)
  const hasOverflowActive = overflowItems.some((item) => location.pathname.startsWith(item.to))

  // 锁定滚动，防止移动端抽屉打开后背景跟随滚动
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // 路由切换时自动关闭移动端菜单
  useEffect(() => {
    // 使用 startTransition 避免同步 setState 引发的级联渲染告警
    startTransition(() => {
      setIsMenuOpen(false)
      setIsOverflowOpen(false)
    })
  }, [location.pathname])

  // 桌面更多下拉动效
  useLayoutEffect(() => {
    if (!overflowPanelRef.current) return
    const ctx = gsap.context(() => {
      gsap.to(overflowPanelRef.current, {
        keyframes: isOverflowOpen
          ? [
              { display: 'block', duration: 0 },
              { opacity: 1, y: 0, scale: 1, pointerEvents: 'auto', duration: 0.25, ease: 'power2.out' },
            ]
          : [
              { opacity: 0, y: -6, scale: 0.98, pointerEvents: 'none', duration: 0.2, ease: 'power2.in' },
              { display: 'none', duration: 0 },
            ],
      })
    })
    return () => ctx.revert()
  }, [isOverflowOpen])

  // 点击外部关闭桌面下拉
  useEffect(() => {
    if (!isOverflowOpen) return
    const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setIsOverflowOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOverflowOpen])

  const handleAnchorClick = (e: MouseEvent<HTMLAnchorElement>, anchor: string) => {
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
    setIsMenuOpen(false)
  }

  const handleBrandClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    navigate('/home')
    setTimeout(() => {
      const element = document.getElementById('home')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 0)
    setIsMenuOpen(false)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur dark:border-white/5 dark:bg-slate-900/70">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
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
          <div className="relative" ref={overflowRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isOverflowOpen}
              onClick={() => setIsOverflowOpen((prev) => !prev)}
              className={`flex items-center gap-1 rounded-full border px-4 py-2 text-xs uppercase tracking-wide transition ${
                hasOverflowActive
                  ? 'border-indigo-300 bg-indigo-50/80 text-indigo-600 shadow-sm dark:border-indigo-500/50 dark:bg-slate-800 dark:text-indigo-200'
                  : 'border-slate-200 text-slate-600 hover:border-accent hover:text-accent dark:border-slate-600 dark:text-slate-100'
              }`}
            >
              更多
              <span
                className={`h-0 w-0 border-x-4 border-b-4 border-x-transparent ${
                  isOverflowOpen ? 'border-b-slate-400 rotate-180' : 'border-b-slate-400'
                }`}
                aria-hidden="true"
              />
            </button>
            <div
              ref={overflowPanelRef}
              aria-hidden={!isOverflowOpen}
              className="absolute right-0 top-[calc(100%+8px)] w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-lg transition dark:border-slate-800 dark:bg-slate-900/95"
              style={{ opacity: 0, pointerEvents: 'none', display: 'none', transform: 'translateY(-6px) scale(0.98)' }}
            >
              <div role="menu" className="flex flex-col py-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
                {overflowItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOverflowOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-4 py-2 transition hover:bg-slate-100 hover:text-accent dark:hover:bg-slate-800 ${
                        isActive ? 'text-indigo-600 dark:text-indigo-300' : ''
                      }`
                    }
                    role="menuitem"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
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
          <div className="flex items-center gap-2">
            <AnimatedThemeToggler ariaLabel="切换主题" />
            <button
              type="button"
              aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-700 shadow-sm transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:border-accent dark:hover:text-accent dark:focus-visible:ring-offset-slate-900"
            >
              <span className="sr-only">{isMenuOpen ? '关闭导航菜单' : '打开导航菜单'}</span>
              <div className="space-y-1.5">
                <span
                  className={`block h-0.5 w-6 rounded-full bg-current transition-transform duration-300 ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
                  aria-hidden="true"
                />
                <span
                  className={`block h-0.5 w-6 rounded-full bg-current transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-80'}`}
                  aria-hidden="true"
                />
                <span
                  className={`block h-0.5 w-6 rounded-full bg-current transition-transform duration-300 ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
              aria-hidden="true"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute left-4 right-4 top-[calc(100%+12px)] z-40 md:hidden">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-lg dark:border-slate-800 dark:bg-slate-900/95">
                <nav className="flex flex-col gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100">
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href={`#${item.anchor}`}
                      onClick={(e) => handleAnchorClick(e, item.anchor)}
                      className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-accent dark:hover:bg-slate-800"
                    >
                      {item.label}
                    </a>
                  ))}
                  <NavLink
                    to="/qa"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-accent dark:hover:bg-slate-800"
                  >
                    QA知识库
                  </NavLink>
                  <NavLink
                    to="/review"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-indigo-500 dark:hover:bg-slate-800"
                  >
                    检验复盘
                  </NavLink>
                <NavLink
                  to="/sandbox"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-indigo-500 dark:hover:bg-slate-800"
                >
                  沙箱世界
                </NavLink>
                  <NavLink
                    to="/favorites"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-accent dark:hover:bg-slate-800"
                  >
                    博客收藏
                  </NavLink>
                  <div className="flex items-center justify-between px-1 pt-2 text-xs text-slate-500 dark:text-slate-400">
                    {socials.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg px-2 py-1 transition hover:text-accent"
                      >
                        {social.label}
                      </a>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                    <LoginWidget />
                  </div>
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

