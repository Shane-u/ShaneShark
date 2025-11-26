import { SkillBar } from '@/components/cards/SkillBar'
import { SectionShell } from '@/components/layout/SectionShell'
import { useProfileStore } from '@/store/useProfileStore'

export function SkillsSection() {
  const groups = useProfileStore((state) => state.skills)

  return (
    <SectionShell
      id="skills"
      eyebrow="Skills"
      title="写代码、刷题、讲故事的一体化工具箱"
      description="Java、Go、C++ 负责底层逻辑，React + GSAP 负责交互，算法和 Python 则把涌现的灵感转成题解。"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {groups.map((group) => (
          <article
            key={group.id}
            className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-soft-card"
          >
            <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
            <div className="mt-4 space-y-4">
              {group.items.map((skill) => (
                <SkillBar key={skill.label} label={skill.label} level={skill.level} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  )
}

