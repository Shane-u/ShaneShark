import { SectionShell } from '@/components/layout/SectionShell'

const timeSlices = [
  { label: '刷题 / 算法', value: '35%' },
  { label: 'React / GSAP 项目', value: '30%' },
  { label: '写博客', value: '25%' },
  { label: '阅读底层源码', value: '10%' },
]

const footprints = ['江苏', '四川', '浙江', '重庆']

export function StatisticsSection() {
  return (
    <SectionShell
      id="footprint"
      eyebrow="Footprints"
      title="时间怎么分配 & 我去过哪里"
      description="把学习和爱好拆成可跟踪的百分比，同时记录我旅行过的城市，方便同学了解 ShaneShark 的背景。"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-soft-card">
          <h3 className="text-xl font-semibold text-slate-900">时间配比</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            {timeSlices.map((slice) => (
              <li key={slice.label} className="flex items-center justify-between">
                <span>{slice.label}</span>
                <span className="font-semibold text-slate-900">{slice.value}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-soft-card">
          <h3 className="text-xl font-semibold text-slate-900">足迹</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {footprints.map((city) => (
              <span
                key={city}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                {city}
              </span>
            ))}
          </div>
        </article>
      </div>
    </SectionShell>
  )
}

