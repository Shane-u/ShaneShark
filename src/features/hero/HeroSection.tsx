import { StatBadge } from '@/components/common/StatBadge'
import { SectionShell } from '@/components/layout/SectionShell'
import { useProfileStore } from '@/store/useProfileStore'
import avatarSrc from '../../../assert/avator/avator.jpg'

export function HeroSection() {
  const hero = useProfileStore((state) => state.hero)

  return (
    <SectionShell
      id="home"
      eyebrow="Welcome"
      title={hero.tagline}
      description={hero.summary}
      actions={
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/Shane-u"
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-accent px-6 py-3 font-semibold text-slate-900"
          >
            GitHub · Shane-u
          </a>
          <a
            href="https://blog.csdn.net/VZS_0"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 hover:border-accent hover:text-accent"
          >
            CSDN · 写博客
          </a>
        </div>
      }
    >
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-soft-card">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">My name is</p>
          <h1 className="mt-4 font-fantasy text-5xl text-accent-dark">{hero.name}</h1>
          <ul className="mt-8 flex flex-wrap gap-3">
            {hero.roles.map((role) => (
              <li key={role.label}>
                <a
                  href={role.href}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-accent hover:text-accent"
                >
                  {role.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {hero.stats.map((stat) => (
              <StatBadge key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
        <div className="relative flex-1 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-100 p-10">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-b from-white to-slate-200 blur-3xl" />
          <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white/80 p-4">
            <img
              src={avatarSrc}
              alt="Shane 的头像"
              className="h-full w-full rounded-full object-cover shadow-soft-card"
              loading="lazy"
            />
          </div>
          {hero.orbitBadges.map((badge, index) => (
            <span
              key={badge.label}
              className="absolute flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-white/90 text-2xl shadow-soft-card"
              style={{
                top: `${20 + index * 10}%`,
                right: index % 2 === 0 ? '-4%' : '70%',
                animation: 'orbit 18s linear infinite',
                animationDelay: `${index * 2}s`,
              }}
            >
              {badge.icon}
            </span>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

