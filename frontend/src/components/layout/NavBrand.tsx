import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * 导航左侧的品牌名 + 小型 GSAP 溅射动画
 *
 * 使用示例：
 * <Link to="/#home">
 *   <NavBrand />
 * </Link>
 */
export function NavBrand() {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dotRef = useRef<SVGCircleElement | null>(null)
  const ringRef = useRef<SVGCircleElement | null>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    if (!rootRef.current || !dotRef.current || !ringRef.current) return

    const ctx = gsap.context(() => {
      const letters = gsap.utils.toArray<HTMLElement>('.nav-logo-letter')

      tlRef.current = gsap
        .timeline({ paused: true })
        .set(dotRef.current, {
          attr: { cy: 26, r: 0 },
          opacity: 1,
        })
        .set(ringRef.current, {
          attr: { r: 0, 'stroke-width': 10 },
          opacity: 0,
        })
        // 小球向上弹起
        .to(dotRef.current, {
          duration: 0.4,
          attr: { cy: 10, r: 4 },
          ease: 'power2.out',
        })
        // 落下到底部
        .to(dotRef.current, {
          duration: 0.3,
          attr: { cy: 22 },
          ease: 'power2.in',
        })
        // 溅射膨胀 + 渐隐
        .to(dotRef.current, {
          duration: 0.9,
          attr: { r: 22 },
          opacity: 0,
          ease: 'power1.out',
        })
        .to(
          ringRef.current,
          {
            duration: 0.9,
            opacity: 1,
            attr: { r: 26, 'stroke-width': 0 },
            ease: 'power1.out',
          },
          '-=0.9',
        )
        // 文字逐字飞入
        .from(
          letters,
          {
            duration: 0.6,
            y: 18,
            opacity: 0,
            ease: 'back.out(2)',
            stagger: 0.04,
          },
          '-=0.6',
        )

      tlRef.current.play(0)
    }, rootRef)

    return () => {
      ctx.revert()
      tlRef.current?.kill()
      tlRef.current = null
    }
  }, [])

  const handleReplay = () => {
    if (!tlRef.current) return
    tlRef.current.restart()
  }

  const text = 'ShaneShark'

  return (
    <div
      ref={rootRef}
      className="relative flex items-center gap-3 font-nav text-2xl text-accent-dark dark:text-white"
      onMouseEnter={handleReplay}
      onFocus={handleReplay}
      tabIndex={-1}
      aria-label="ShaneShark"
    >
      <svg
        className="h-9 w-9 text-accent-dark/90 dark:text-white/80"
        viewBox="0 0 56 56"
        aria-hidden="true"
      >
        <circle ref={dotRef} cx="28" cy="26" r="0" fill="currentColor" />
        <circle
          ref={ringRef}
          cx="28"
          cy="26"
          r="0"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          opacity="0"
        />
      </svg>
      <span className="relative z-10 inline-flex items-baseline">
        {text.split('').map((ch, idx) => (
          <span key={`${ch}-${idx}`} className="nav-logo-letter inline-block">
            {ch}
          </span>
        ))}
      </span>
    </div>
  )
}


