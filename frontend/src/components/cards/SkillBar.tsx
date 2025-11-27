interface SkillBarProps {
  label: string
  level: number
}

export function SkillBar({ label, level }: SkillBarProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
        <span>{label}</span>
        <span>{level}/10</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-orange-500"
          style={{ width: `${(level / 10) * 100}%` }}
        />
      </div>
    </div>
  )
}

