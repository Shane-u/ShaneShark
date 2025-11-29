import { lazy, Suspense, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const HeroSection = lazy(() => import('@/features/hero/HeroSection').then((m) => ({ default: m.HeroSection })))
const SocialProofSection = lazy(() =>
  import('@/features/social/SocialProofSection').then((m) => ({ default: m.SocialProofSection })),
)
const ExperienceSection = lazy(() =>
  import('@/features/experience/ExperienceSection').then((m) => ({ default: m.ExperienceSection })),
)
const SkillsSection = lazy(() =>
  import('@/features/skills/SkillsSection').then((m) => ({ default: m.SkillsSection })),
)
const ShowcaseSection = lazy(() =>
  import('@/features/showcase/ShowcaseSection').then((m) => ({ default: m.ShowcaseSection })),
)
const BlogSection = lazy(() =>
  import('@/features/blog/BlogSection').then((m) => ({ default: m.BlogSection })),
)
const StatisticsSection = lazy(() =>
  import('@/features/stats/StatisticsSection').then((m) => ({ default: m.StatisticsSection })),
)
const BooksSection = lazy(() =>
  import('@/features/books/BooksSection').then((m) => ({ default: m.BooksSection })),
)

function SectionFallback() {
  return (
    <div className="mx-auto my-24 h-40 w-full max-w-6xl animate-pulse rounded-[32px] bg-slate-100" aria-hidden="true" />
  )
}

export default function HomePage() {
  const location = useLocation()

  // 处理锚点跳转（当直接访问 /#/projects 等 URL 时）
  useEffect(() => {
    // HashRouter 中，location.pathname 格式为 /path
    const path = location.pathname
    
    // 支持的锚点路径
    const anchorRoutes = ['home', 'projects', 'skills', 'blog', 'footprint', 'books']
    
    if (path && path !== '/' && anchorRoutes.includes(path.slice(1))) {
      const anchor = path.slice(1)
      
      // 延迟执行，确保页面内容已加载
      const timer = setTimeout(() => {
        const element = document.getElementById(anchor)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [location])

  return (
    <div className="px-4">
      <Suspense fallback={<SectionFallback />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <SocialProofSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ExperienceSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <SkillsSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <ShowcaseSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <BlogSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <StatisticsSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <BooksSection />
      </Suspense>
    </div>
  )
}

