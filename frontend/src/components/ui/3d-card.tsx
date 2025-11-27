import {
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
  useRef,
  useState,
} from 'react'
import clsx from 'clsx'

interface CardBaseProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardContainer({ children, className, ...props }: CardBaseProps) {
  return (
    <div
      className={clsx('group/card relative h-full w-full [perspective:1200px]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(function CardBody(
  { children, className, as: Component = 'div', style, ...props },
  ref
) {
  const internalRef = useRef<HTMLDivElement | null>(null)
  const mergedRef = (node: HTMLDivElement | null) => {
    internalRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }

  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateY = ((x - centerX) / centerX) * 12
    const rotateX = ((centerY - y) / centerY) * 12
    setRotation({ x: rotateX, y: rotateY })
  }

  const resetRotation = () => {
    setRotation({ x: 0, y: 0 })
  }

  return (
    <Component
      ref={mergedRef}
      className={clsx(
        'relative h-full w-full rounded-3xl border border-white/30 bg-white/80 p-8 shadow-soft-card transition-all duration-500 ease-out [transform-style:preserve-3d]',
        'dark:bg-slate-900/80',
        className
      )}
      style={{
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        ...style,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetRotation}
      {...props}
    >
      {children}
    </Component>
  )
})

interface CardItemProps extends HTMLAttributes<HTMLDivElement> {
  translateZ?: number | string
  as?: ElementType
  children: ReactNode
}

const formatTranslate = (value: number | string = 0) => {
  if (typeof value === 'number') return `${value}px`
  return value.match(/[a-z%]+/i) ? value : `${value}px`
}

export function CardItem({
  children,
  className,
  translateZ = 0,
  as: Component = 'div',
  style,
  ...props
}: CardItemProps) {
  return (
    <Component
      className={clsx('transition-transform duration-300 [transform-style:preserve-3d]', className)}
      style={{
        transform: `translateZ(${formatTranslate(translateZ)})`,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  )
}

