import { Children, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'

export interface OrbitingCirclesProps extends HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: ReactNode
  reverse?: boolean
  duration?: number
  delay?: number
  radius?: number
  path?: boolean
  iconSize?: number
  speed?: number
  pathClassName?: string
}

export function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 0,
  radius = 160,
  path = true,
  iconSize = 30,
  speed = 1,
  pathClassName,
  ...props
}: OrbitingCirclesProps) {
  const calculatedDuration = duration / Math.max(speed, 0.1)
  const childCount = Children.count(children) || 1
  const { style, ...rest } = props
  const halfIconSize = iconSize / 2

  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          role="presentation"
          className="pointer-events-none absolute inset-0 size-full z-0"
        >
          <circle
            className={clsx('stroke-slate-400 stroke-[2px] dark:stroke-slate-500', pathClassName)}
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      {Children.map(children, (child, index) => {
        if (!child) return null

        const angle = (360 / childCount) * index

        return (
          <div
            style={
              {
                '--duration': `${calculatedDuration}s`,
                '--radius': `${radius}px`,
                '--angle': `${angle}deg`,
                '--icon-size': `${iconSize}px`,
                animationDelay: `${delay}s`,
                left: '50%',
                top: '50%',
                marginLeft: -halfIconSize,
                marginTop: -halfIconSize,
                ...style,
              } as CSSProperties
            }
            className={clsx(
              'animate-orbit absolute z-10 flex size-[var(--icon-size)] transform-gpu items-center justify-center rounded-full',
              { '[animation-direction:reverse]': reverse },
              className
            )}
            {...rest}
          >
            {child}
          </div>
        )
      })}
    </>
  )
}

