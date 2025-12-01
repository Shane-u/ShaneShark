"use client"

import React, { useEffect, useId, useRef, useState } from "react"
import { motion } from "motion/react"

import clsx from "clsx"

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
  glow?: boolean
  [key: string]: unknown
}

export function DotPattern({
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = useId()
  const containerRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // 使用纯函数生成“伪随机”动画参数，避免在渲染或 Effect 中调用 Math.random
  const cols = dimensions.width ? Math.ceil(dimensions.width / width) : 0
  const rows = dimensions.height ? Math.ceil(dimensions.height / height) : 0
  const total = cols * rows

  const dots =
    total > 0
      ? Array.from({ length: total }, (_, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          // 通过固定公式生成稳定的“伪随机”数，保证组件是纯函数
          const pseudo = (seed: number) => {
            const x = Math.sin(seed) * 10000
            return x - Math.floor(x)
          }
          const delay = pseudo(i * 37) * 5
          const duration = pseudo(i * 53) * 3 + 2

          return {
            x: col * width + cx,
            y: row * height + cy,
            delay,
            duration,
          }
        })
      : []

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={clsx(
        "pointer-events-none absolute inset-0 h-full w-full text-neutral-400/80",
        className
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots.map((dot) => (
        <motion.circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={cr}
          fill={glow ? `url(#${id}-gradient)` : "currentColor"}
          initial={glow ? { opacity: 0.4, scale: 1 } : {}}
          animate={
            glow
              ? {
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.5, 1],
                }
              : {}
          }
          transition={
            glow
              ? {
                  duration: dot.duration,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: dot.delay,
                  ease: "easeInOut",
                }
              : {}
          }
        />
      ))}
    </svg>
  )
}

