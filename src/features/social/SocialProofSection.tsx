import { SocialCard } from '@/components/cards/SocialCard'
import { SectionShell } from '@/components/layout/SectionShell'
import { useProfileStore } from '@/store/useProfileStore'

export function SocialProofSection() {
  const socials = useProfileStore((state) => state.socials)

  return (
    <SectionShell
      id="community"
      eyebrow="Community"
      title="GitHub + CSDN 里的学习同伴"
      description="把代码和博客都开源，方便同学 fork、留言或一起讨论 React、GSAP、算法。"
    >
      <div className="relative overflow-hidden">
        <div className="flex gap-4 animate-marquee">
          {socials.map((stat) => (
            <SocialCard key={stat.id} stat={stat} />
          ))}
          {socials.map((stat) => (
            <SocialCard key={`${stat.id}-clone`} stat={stat} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent dark:from-slate-950" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent dark:from-slate-950" />
      </div>
    </SectionShell>
  )
}

