"use client"

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface QaTagFilterProps {
  tags: string[]
  selectedTag: string
  onSelect: (tag: string) => void
  tagCounts?: Record<string, number>
}

/**
 * Tag pills inspired by Magic UI blog template (desktop) + select dropdown (mobile).
 * 点击时增加 GSAP 轻微缩放 + 回弹动画，让交互反馈更明显。
 */
export function QaTagFilter({ tags, selectedTag, onSelect, tagCounts }: QaTagFilterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('[data-qa-tag]')
    if (!buttons.length) return

    buttons.forEach((btn) => {
      const handleClick = () => {
        gsap.fromTo(
          btn,
          { scale: 0.94 },
          {
            scale: 1,
            duration: 0.25,
            ease: 'back.out(2)',
          }
        )
      }

      btn.addEventListener('click', handleClick)

      // 清理事件
      return () => {
        btn.removeEventListener('click', handleClick)
      }
    })
  }, [tags, selectedTag])

  const handleSelect = (value: string) => {
    onSelect(value)
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div ref={containerRef} className="hidden flex-wrap gap-2 md:flex">
        {tags.map((tag) => {
          const isActive = selectedTag === tag
          return (
            <button
              key={tag}
              type="button"
              data-qa-tag
              onClick={() => handleSelect(tag)}
              className={cn(
                'group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(59,130,246,0.65)] shadow-primary/40'
                  : 'border-border/80 bg-background/50 hover:bg-muted'
              )}
            >
              <span>{tag}</span>
              {tagCounts?.[tag] && (
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-xs',
                    isActive
                      ? 'border-white/40 bg-white/10 text-primary-foreground'
                      : 'border-border/70 text-muted-foreground'
                  )}
                >
                  {tagCounts[tag]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="md:hidden">
        <Select value={selectedTag} onValueChange={handleSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="选择标签" />
          </SelectTrigger>
          <SelectContent>
            {tags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

