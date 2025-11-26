import { SectionShell } from '@/components/layout/SectionShell'
import { useProfileStore } from '@/store/useProfileStore'

const accentStyles = {
  orange: 'bg-gradient-to-br from-orange-100 to-orange-50 border-orange-200',
  slate: 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-800',
}

export function ExperienceSection() {
  const experience = useProfileStore((state) => state.experience)

  return (
    <SectionShell
      id="experience"
      eyebrow="Practice"
      title="我的履历位于 ShaneShark"
      description="一半时间写 React + Go 项目，一半时间整理算法和面试心得，再同步到博客和伙伴分享。"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {experience.map((item) => (
          <article
            key={item.company}
            className={`rounded-3xl border p-6 shadow-soft-card ${accentStyles[item.accent]}`}
          >
            <p className="text-xs uppercase tracking-[0.3em]">{item.badge}</p>
            <h3 className="mt-2 text-2xl font-semibold">{item.company}</h3>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-4 text-sm opacity-80">{item.description}</p>
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex text-sm font-semibold"
            >
              View work →
            </a>
          </article>
        ))}
      </div>
    </SectionShell>
  )
}

