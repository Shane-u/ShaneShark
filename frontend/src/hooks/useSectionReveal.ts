import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

const registerPlugins = () => {
  if (registered || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger)
  registered = true
}

export function useSectionReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useLayoutEffect(() => {
    if (!ref.current) return
    registerPlugins()

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 80%',
        },
        defaults: {
          ease: 'power3.out',
          duration: 0.9,
        },
      })

      timeline.from(ref.current, {
        opacity: 0,
        y: 48,
      })

      const textTargets = ref.current?.querySelectorAll<HTMLElement>('[data-animate="text"]')

      if (textTargets?.length) {
        timeline.from(
          textTargets,
          {
            yPercent: 35,
            opacity: 0,
            stagger: 0.08,
          },
          '<20%',
        )
      }
    }, ref)

    return () => ctx.revert()
  }, [])

  return ref
}


