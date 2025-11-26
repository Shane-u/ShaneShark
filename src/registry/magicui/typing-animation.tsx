import { type ElementType, type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { motion, type MotionProps, useInView } from 'motion/react'
import clsx from 'clsx'

export interface TypingAnimationProps extends MotionProps {
  children?: string
  words?: string[]
  className?: string
  duration?: number
  typeSpeed?: number
  deleteSpeed?: number
  delay?: number
  pauseDelay?: number
  loop?: boolean
  as?: ElementType
  startOnView?: boolean
  showCursor?: boolean
  blinkCursor?: boolean
  cursorStyle?: 'line' | 'block' | 'underscore'
}

type TypingPhase = 'typing' | 'pause' | 'deleting'

export function TypingAnimation({
  children,
  words,
  className,
  duration = 100,
  typeSpeed,
  deleteSpeed,
  delay = 0,
  pauseDelay = 1000,
  loop = false,
  as: Component = 'span',
  startOnView = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = 'line',
  ...props
}: TypingAnimationProps) {
  const MotionComponent = useMemo(
    () =>
      motion.create(Component, {
        forwardMotionProps: true,
      }),
    [Component]
  )

  const [displayedText, setDisplayedText] = useState('')
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [phase, setPhase] = useState<TypingPhase>('typing')

  const elementRef = useRef<HTMLElement | null>(null)
  const isInView = useInView(elementRef as RefObject<Element>, {
    amount: 0.3,
    once: true,
  })

  const wordsToAnimate = useMemo(() => {
    if (words && words.length > 0) return words
    if (children && children.trim().length > 0) return [children]
    return []
  }, [words, children])

  const hasMultipleWords = wordsToAnimate.length > 1
  const typingSpeed = typeSpeed ?? duration
  const deletingSpeed = deleteSpeed ?? Math.max(typingSpeed / 2, 30)
  const shouldStart = startOnView ? isInView : true

  useEffect(() => {
    setDisplayedText('')
    setCurrentCharIndex(0)
    setCurrentWordIndex(0)
    setPhase('typing')
  }, [wordsToAnimate.join('|')])

  useEffect(() => {
    if (!shouldStart || wordsToAnimate.length === 0) return

    const timeoutDelay =
      delay > 0 && displayedText === ''
        ? delay
        : phase === 'typing'
          ? typingSpeed
          : phase === 'deleting'
            ? deletingSpeed
            : pauseDelay

    const timeout = setTimeout(() => {
      const currentWord = wordsToAnimate[currentWordIndex] ?? ''
      const graphemes = Array.from(currentWord)

      switch (phase) {
        case 'typing': {
          if (currentCharIndex < graphemes.length) {
            const nextIndex = currentCharIndex + 1
            setDisplayedText(graphemes.slice(0, nextIndex).join(''))
            setCurrentCharIndex(nextIndex)
          } else if (hasMultipleWords || loop) {
            setPhase('pause')
          }
          break
        }
        case 'pause': {
          setPhase('deleting')
          break
        }
        case 'deleting': {
          if (currentCharIndex > 0) {
            const nextIndex = currentCharIndex - 1
            setDisplayedText(graphemes.slice(0, nextIndex).join(''))
            setCurrentCharIndex(nextIndex)
          } else {
            const nextIndex = (currentWordIndex + 1) % wordsToAnimate.length
            setCurrentWordIndex(nextIndex)
            setPhase('typing')
          }
          break
        }
        default:
          break
      }
    }, timeoutDelay)

    return () => clearTimeout(timeout)
  }, [
    shouldStart,
    phase,
    currentCharIndex,
    currentWordIndex,
    displayedText,
    wordsToAnimate,
    hasMultipleWords,
    loop,
    typingSpeed,
    deletingSpeed,
    pauseDelay,
    delay,
  ])

  const currentWord = wordsToAnimate[currentWordIndex] ?? ''
  const currentWordLength = Array.from(currentWord).length
  const animationComplete =
    !loop &&
    !hasMultipleWords &&
    phase === 'typing' &&
    currentCharIndex >= currentWordLength

  const shouldShowCursor =
    showCursor && !(animationComplete && !loop) && (loop || currentCharIndex < currentWordLength)

  const getCursorChar = () => {
    switch (cursorStyle) {
      case 'block':
        return '▌'
      case 'underscore':
        return '_'
      case 'line':
      default:
        return '|'
    }
  }

  return (
    <MotionComponent
      ref={elementRef}
      className={clsx('inline-flex items-center tracking-tight', className)}
      aria-live="polite"
      {...props}
    >
      {displayedText}
      {shouldShowCursor && (
        <span className={clsx('inline-block', blinkCursor && 'animate-caret-blink')}>{getCursorChar()}</span>
      )}
    </MotionComponent>
  )
}


