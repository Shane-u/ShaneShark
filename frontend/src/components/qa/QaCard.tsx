"use client"

import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { MouseEvent } from 'react'
import type { QaInfo } from '@/types/qa'
import { cn } from '@/lib/utils'

interface QaCardProps {
  qa: QaInfo
  isActive: boolean
  onSelect: (qa: QaInfo) => void
  onEdit?: (qa: QaInfo, e: MouseEvent) => void
  onDelete?: (qa: QaInfo, e: MouseEvent) => void
  answerPreview: string
  isAdmin?: boolean
}

/**
 * Responsive QA card that mirrors Magic UI blog grid aesthetics.
 */
export function QaCard({
  qa,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  answerPreview,
  isAdmin,
}: QaCardProps) {
  return (
    <article
      data-qa-card
      onClick={() => onSelect(qa)}
      className={cn(
        'group relative flex h-full flex-col border border-border/60 bg-background/80 transition hover:border-primary/60 hover:bg-primary/5 dark:bg-slate-950/60',
        isActive && 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
      )}
    >
      {isAdmin && (
        <div className="absolute right-3 top-3 z-10 flex gap-2 text-muted-foreground">
          <button
            type="button"
            aria-label="编辑QA"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(qa, e)
            }}
            className="rounded-full border border-border bg-background/80 p-1 transition hover:border-primary hover:text-primary"
          >
            <EditOutlined className="text-xs" />
          </button>
          <button
            type="button"
            aria-label="删除QA"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(qa, e)
            }}
            className="rounded-full border border-border bg-background/80 p-1 transition hover:border-primary hover:text-primary"
          >
            <DeleteOutlined className="text-xs" />
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">{qa.tag}</span>
          {qa.isHot === 1 && <span className="text-amber-500">精选</span>}
          <span className="text-muted-foreground/70">
            {new Date(qa.createTime).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <h3 className="text-xl font-semibold leading-tight text-slate-900 transition group-hover:underline group-hover:underline-offset-4 dark:text-white">
          {qa.question}
        </h3>

        <p
          className="text-sm text-muted-foreground"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {answerPreview}
        </p>

        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>{qa.viewCount} 次阅读</span>
          <span className="text-primary">点击展开</span>
        </div>
      </div>
    </article>
  )
}


