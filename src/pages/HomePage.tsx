import { lazy, Suspense } from 'react'

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

