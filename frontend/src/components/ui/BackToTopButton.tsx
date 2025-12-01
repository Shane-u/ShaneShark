import { useEffect, useState } from 'react'

/**
 * 回到顶部按钮
 *
 * - 固定在右下角
 * - 向下滚动一段距离后才会出现
 * - 点击后平滑滚动回到页面顶部
 *
 * 使用示例：
 * ```tsx
 * // 一般放在布局组件中（例如 MainLayout）
 * <BackToTopButton />
 * ```
 */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 200
      setVisible(shouldShow)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      aria-label="回到顶部"
      onClick={handleClick}
      className="fixed bottom-6 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-sky-100/70 bg-gradient-to-br from-sky-100 via-rose-50 to-amber-100 text-sky-700 shadow-lg shadow-sky-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-900/20 dark:border-sky-800/70 dark:from-slate-800 dark:via-slate-900 dark:to-sky-900/40 dark:text-sky-100 md:bottom-8 md:right-8"
    >
      <span className="flex flex-col items-center leading-none">
        <span className="text-lg">↑</span>
        <span className="text-[10px] font-semibold tracking-wide text-sky-600/90 dark:text-sky-200/90">
          TOP
        </span>
      </span>
      {/* 可爱的光晕效果 */}
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-sky-300/20 blur-xl dark:bg-sky-500/20" />
    </button>
  )
}


